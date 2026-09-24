import { z } from "zod";
import { Assumption, rationaleAiRatings } from "@/lib/models/assumption";
import { generateText, LanguageModel, Output, Instructions } from "ai";
import { asMarkdown } from "@/lib/services/blockDocumentMarkdown";
import { AssumptionCommentService } from "./assumptionCommentService";
import { anthropic } from "@ai-sdk/anthropic";
import { DbConnection } from "@/lib/db/connection";
import { db } from "@/lib/db";

export const evaluationResultSchema = z.object({
  rating: z.enum(rationaleAiRatings),
  evaluation: z.string().min(1)
});

export type EvaluationResult = z.infer<typeof evaluationResultSchema>;

export type EvaluationInput = {
  title: string;
  rationale: string;
  comments: { author: string; body: string }[];
};

function defaultModel(): LanguageModel {
  return anthropic("claude-sonnet-5");
}

const singleCommentEvaluationInstructions: Instructions = `
You are evaluating to what degree a stated rationale for a given assumption addresses
concerns expressed in a comment. Your evaluation should result in a rating on the scale 
${rationaleAiRatings.join(", ")} and a short 1-3 line text that describes what the
rationale failes to address. If all concerns are adressed, the text should simply be
"Nothing to add". As input, you will be given the title of the assumption and the 
rationale.
`;

function singleCommentEvaluationPrompt(title: string, rationale: string, comment: string) {
  return `
  Title: ${title}
  Rationale: ${rationale}
  Comment: ${comment}
  `;
}

const summarizationInstructions: Instructions = `
You are summarizing a list of evaluations. Each evaluation considers how well a 
rationale addresses a concern raised in a comment about that rationale. An evaluation 
concists of a rating on the scale ${rationaleAiRatings.join(", ")} and a short text that 
describes the findings. Your task is to write an overall summary of all the findings
in the form of a 1-3 line text, and to produce an overall rating on the same scale.
The reader of the summary does not have access to the individual evaluations so you
must write the summary without referring (directly or indirectly) to the evaluations.
DO NOT refer to individual evaluations and their findings.
Just present your overall findings and final conclusion as the summary.
`;

function summarizationPrompt(evaluations: EvaluationResult[]) {
  return evaluations
    .map((evaluation) => {
      return `
    Rating: ${evaluation.rating}
    Evaluation: ${evaluation.evaluation}
    `;
    })
    .join("\n\n");
}

export class AssumptionEvaluationService {
  static async evaluateAssumption(
    assumption: Assumption,
    connection: DbConnection = db,
    model: LanguageModel = defaultModel()
  ): Promise<EvaluationResult> {
    const comments = await AssumptionCommentService.listForAssumptionWithCreatorAndResolver(assumption.id, connection);
    const unresolved = comments.filter((comment) => comment.resolvedAt === undefined);

    const input = {
      title: assumption.title,
      rationale: await asMarkdown(assumption.rationale),
      comments: await Promise.all(
        unresolved.map(async (comment) => {
          return {
            author: comment.creator.email,
            body: await asMarkdown(comment.body)
          };
        })
      )
    };

    return await this.evaluateRationale(input, model);
  }

  private static async evaluateRationale(input: EvaluationInput, model: LanguageModel): Promise<EvaluationResult> {
    const evaluations = await Promise.all(
      input.comments.map(async (comment) => {
        return await this.evaluateRationaleAgainstSingleComment(input.title, input.rationale, comment.body, model);
      })
    );

    const problematic = evaluations.filter((evaluation) => evaluation.rating !== "addressed");
    const prompt = summarizationPrompt(problematic);

    if (problematic.length > 0) {
      const result = await generateText({
        model: model,
        instructions: summarizationInstructions,
        prompt: prompt,
        output: Output.object({ schema: evaluationResultSchema })
      });

      return result.output;
    } else {
      return {
        rating: "addressed",
        evaluation: "The rationale adequately adresses all concerns raised in comments."
      };
    }
  }

  private static async evaluateRationaleAgainstSingleComment(
    title: string,
    rationale: string,
    comment: string,
    model: LanguageModel
  ): Promise<EvaluationResult> {
    const prompt = singleCommentEvaluationPrompt(title, rationale, comment);

    const result = await generateText({
      model: model,
      instructions: singleCommentEvaluationInstructions,
      prompt: prompt,
      output: Output.object({ schema: evaluationResultSchema })
    });

    return result.output;
  }
}
