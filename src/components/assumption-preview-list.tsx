import { AssumptionPreviewItem } from "@/components/assumption-preview-item";

type AssumptionWithPreloads = Parameters<typeof AssumptionPreviewItem>[0]["assumption"];

type AssumptionPreviewListProps = {
  assumptions: AssumptionWithPreloads[];
};

export function AssumptionPreviewList({ assumptions }: AssumptionPreviewListProps) {
  return <div className="flex flex-col gap-4">{content(assumptions)}</div>;
}

function content(assumptions: AssumptionWithPreloads[]) {
  if (assumptions.length > 0) {
    const items = assumptions.map(item);
    return <div className="grid md:grid-cols-2 grid-cols-1 gap-4">{items}</div>;
  } else {
    return <div>There are no assumptions for this decison yet.</div>;
  }
}

function item(assumption: AssumptionWithPreloads) {
  return <AssumptionPreviewItem key={assumption.id} assumption={assumption} />;
}
