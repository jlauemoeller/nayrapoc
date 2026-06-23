import { Button } from "@/components/ui/button";
import { DecisionIcon, AddIcon } from "@/components/icons";
import { DecisionPreviewItem } from "@/components/decision-preview-item";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { NewDecisionDialog } from "@/components/new-decision-dialog";

type DecisionWithPreloads = Parameters<typeof DecisionPreviewItem>[0]["decision"];

type DecisionPreviewListProps = {
  projectId: string;
  decisions: DecisionWithPreloads[];
  editable: boolean;
  hideAddButton?: boolean;
};

export async function DecisionPreviewList({ projectId, decisions, editable, hideAddButton }: DecisionPreviewListProps) {
  const items = decisions.map(item);

  if (decisions.length > 0) {
    return (
      <div className="flex flex-col gap-4">
        <div className="grid md:grid-cols-2 grid-cols-1 gap-4">{items}</div>
        <div className="mt-4">
          <CTA {...{ editable, projectId, hideAddButton }} />
        </div>
      </div>
    );
  } else {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <DecisionIcon />
          </EmptyMedia>
          <EmptyTitle>No Decisions Yet</EmptyTitle>
          <EmptyDescription>Get started by adding your first decision.</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <CTA {...{ editable, projectId, hideAddButton }} />
        </EmptyContent>
      </Empty>
    );
  }
}

function item(decision: DecisionWithPreloads) {
  return <DecisionPreviewItem key={decision.id} decision={decision} />;
}

type CTAProps = Pick<DecisionPreviewListProps, "projectId" | "editable" | "hideAddButton">;

function CTA({ editable, hideAddButton, projectId }: CTAProps) {
  return editable ?
      <NewDecisionDialog projectId={projectId} />
    : !hideAddButton && (
        <Button disabled>
          <AddIcon /> Add decision
        </Button>
      );
}
