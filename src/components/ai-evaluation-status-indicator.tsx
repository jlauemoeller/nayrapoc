import { Assumption, evaluationStatus } from "@/lib/models/assumption";
import { Badge } from "@/components/ui/badge";
import { CheckIcon, MissingIcon, WarningIcon } from "@/components/icons";
import { Spinner } from "./ui/spinner";

type AiEvaluationStatusIndicatorProps = {
  assumption: Assumption;
};

export function AiEvaluationStatusIndicator({ assumption }: AiEvaluationStatusIndicatorProps) {
  const status = evaluationStatus(assumption);

  switch (status) {
    case "missing":
      return (
        <Badge variant="outline">
          <MissingIcon /> No AI evaluation available
        </Badge>
      );

    case "pending":
      return (
        <Badge variant="outline">
          <Spinner /> AI evaluation pending...
        </Badge>
      );

    case "outdated":
      return (
        <Badge variant="outline">
          <WarningIcon /> AI Evaluation is out of date
        </Badge>
      );

    case "current":
      return (
        <Badge variant="outline">
          <CheckIcon />
          AI Evaluation is up-to date
        </Badge>
      );

    default:
      throw new Error(`Unexpected assumption AI evaluation status ${status}`);
  }
}
