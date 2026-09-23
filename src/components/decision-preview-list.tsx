import { DecisionPreviewItem } from "@/components/decision-preview-item";

type DecisionWithPreloads = Parameters<typeof DecisionPreviewItem>[0]["decision"];

type DecisionPreviewListProps = {
  decisions: DecisionWithPreloads[];
};

export async function DecisionPreviewList({ decisions }: DecisionPreviewListProps) {
  const items = decisions.map(item);

  return <div className="grid md:grid-cols-2 grid-cols-1 gap-4">{items}</div>;
}

function item(decision: DecisionWithPreloads) {
  return <DecisionPreviewItem key={decision.id} decision={decision} />;
}
