import { Item, ItemContent, ItemDescription, ItemMedia, ItemTitle } from "@/components/ui/item";
import { AgentIcon } from "@/components/icons";

export function AssumptionRationaleAIEvaluation() {
  return (
    <Item>
      <ItemMedia variant="icon">
        <AgentIcon />
      </ItemMedia>
      <ItemContent>
        <ItemTitle>AI Evaluation</ItemTitle>
        <ItemDescription>
          The rationale does not address the concern raised by John Wilkes (john@example.com) regarding ability to
          render to PNG (for use in PDF exports).
        </ItemDescription>
      </ItemContent>
    </Item>
  );
}
