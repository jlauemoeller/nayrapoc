import { Badge, BadgeVariant } from "@/components/ui/badge";
import { Decision, DecisionState } from "@/lib/models/decision";

type DecisionStateLabelProps = {
  decision: Decision;
};

const STATES: Record<DecisionState, [string, BadgeVariant]> = {
  proposed: ["Proposed", "outline"],
  active: ["Active", "default"],
  rejected: ["Rejected", "destructive"],
  retired: ["Retired", "outline"]
};

export function DecisionStateBadge({ decision }: DecisionStateLabelProps) {
  const [text, variant] = STATES[decision.state];

  return <Badge variant={variant}>{text}</Badge>;
}
