import { AddIcon } from "@/components/icons";
import { AssumptionPreviewItem } from "@/components/assumption-preview-item";
import { Button } from "@/components/ui/button";
import { Decision } from "@/lib/models/decision";
import { NewAssumptionDialog } from "@/components/new-assumption-dialog";

type AssumptionWithPreloads = Parameters<typeof AssumptionPreviewItem>[0]["assumption"];

type AssumptionPreviewListProps = {
  decision: Decision;
  assumptions: AssumptionWithPreloads[];
  editable: boolean;
};

export function AssumptionPreviewList({ decision, assumptions, editable }: AssumptionPreviewListProps) {
  return (
    <div className="flex flex-col gap-4">
      {content(assumptions)}
      <div className="flex flex-row justify-start">
        {editable ?
          <NewAssumptionDialog decision={decision} />
        : <Button disabled>
            <AddIcon /> Add assumption
          </Button>
        }
      </div>
    </div>
  );
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
