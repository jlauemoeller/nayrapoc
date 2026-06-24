import { db } from "@/lib/db";
import { DbConnection } from "@/lib/db/connection";
import { ProjectRepository } from "@/lib/repositories/projectRepository";
import { DecisionRepository } from "@/lib/repositories/decisionRepository";
import { AssumptionRepository } from "@/lib/repositories/assumptionRepository";
import { RecordError } from "@/lib/repositories/repository";
import { Result } from "neverthrow";

// Fixed id of the account whose project tree is the demo's "starter content". The
// seed (db-dump.json) carries an account with exactly this id, owned by a non-login
// template user. New signups get a private, isolated copy of its tree (see cloneInto),
// and the hourly demo reset restores the pristine template.
export const TEMPLATE_ACCOUNT_ID = "01920000-0000-7000-8000-0000000000aa";

export class TemplateService {
  /**
   * Deep-copies the template account's `projects → decisions → assumptions` tree into
   * `accountId`: every row gets a fresh id, child FKs are re-pointed at the new parents,
   * and — since a freshly created account has exactly one user — every `creator_id` is
   * attributed to that user.
   *
   * No-op when the template account is absent or empty (e.g. a dev DB without the demo
   * seed), so signup never depends on the seed being present. Intended to run inside the
   * signup transaction; a failure throws and rolls the whole signup back.
   */
  static async cloneInto(
    { accountId, userId }: { accountId: string; userId: string },
    connection: DbConnection = db
  ): Promise<void> {
    const templateProjects = await ProjectRepository.listForAccount(TEMPLATE_ACCOUNT_ID, connection);

    for (const project of templateProjects) {
      const newProject = unwrap(
        await ProjectRepository.create(
          {
            name: project.name,
            description: project.description,
            account_id: accountId,
            creator_id: userId
          },
          connection
        ),
        `project "${project.name}"`
      );

      const templateDecisions = await DecisionRepository.listForProject(project.id, connection);
      for (const decision of templateDecisions) {
        // Built directly (not via DecisionService.create) so the template's state /
        // review_by / reviewed_at carry over — the create path always forces "proposed".
        const newDecision = unwrap(
          await DecisionRepository.create(
            {
              title: decision.title,
              rationale: decision.rationale,
              state: decision.state,
              review_by: decision.review_by,
              reviewed_at: decision.reviewed_at,
              project_id: newProject.id,
              creator_id: userId
            },
            connection
          ),
          `decision "${decision.title}"`
        );

        const templateAssumptions = await AssumptionRepository.listForDecision(decision.id, connection);
        for (const assumption of templateAssumptions) {
          unwrap(
            await AssumptionRepository.create(
              {
                title: assumption.title,
                rationale: assumption.rationale,
                confidence: assumption.confidence,
                decision_id: newDecision.id,
                creator_id: userId
              },
              connection
            ),
            `assumption "${assumption.title}"`
          );
        }
      }
    }
  }
}

// Cloning known-good template rows can only fail on an *unexpected* error (a real FK/insert
// bug, never an "expected" constraint violation), so an err here is an invariant breach:
// throw it so the signup transaction rolls back rather than swallowing it as a value.
function unwrap<T>(result: Result<T, RecordError<T>>, what: string): T {
  if (result.isErr()) {
    throw new Error(`Template clone failed for ${what}: ${result.error.field} — ${result.error.message}`);
  }
  return result.value;
}
