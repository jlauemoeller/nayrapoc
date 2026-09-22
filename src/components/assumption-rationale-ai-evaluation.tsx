import { Item, ItemContent, ItemDescription, ItemMedia, ItemTitle } from "@/components/ui/item";
import { AgentIcon } from "@/components/icons";
import { AiEvaluationRatingIndicator } from "@/components/ai-evaluation-rating-indicator";
import { AiEvaluationStatusIndicator } from "@/components/ai-evaluation-status-indicator";
import { Assumption, evaluationStatus } from "@/lib/models/assumption";
import { RelativeTimeCard } from "@/components/ui/relative-time-card";
import { RefreshPoller } from "@/components/refresh-poller";
import { Skeleton } from "@/components/ui/skeleton";

type AssumptionRationaleAIEvaluationProps = {
  assumption: Assumption;
};

export function AssumptionRationaleAIEvaluation({ assumption }: AssumptionRationaleAIEvaluationProps) {
  return (
    <>
      <RefreshPoller active={evaluationStatus(assumption) !== "current"} />
      <Item className="px-0">
        <ItemMedia variant="icon">
          <AgentIcon />
        </ItemMedia>
        <ItemContent>
          <ItemTitle>
            AI Evaluation{" "}
            {assumption.rationaleAiRating && <AiEvaluationRatingIndicator rating={assumption.rationaleAiRating} />}
            <AiEvaluationStatusIndicator assumption={assumption} />
          </ItemTitle>
          <ItemDescription>
            {assumption.rationaleAiEvaluatedAt ?
              <span>
                Last evaluated by AI at <RelativeTimeCard date={assumption.rationaleAiEvaluatedAt} />
              </span>
            : "Not evaluated yet"}
          </ItemDescription>
          <ItemContent>
            {evaluationStatus(assumption) === "current" ?
              assumption.rationaleAiEvaluation
            : <div className="flex w-full flex-col gap-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            }
          </ItemContent>
        </ItemContent>
      </Item>
    </>
  );
}
