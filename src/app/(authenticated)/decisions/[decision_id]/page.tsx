import { AssumptionPreviewList } from "@/components/assumption-preview-list";
import { AssumptionService } from "@/lib/services/assumptionService";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { Button } from "@/components/ui/button";
import { DecisionRationaleEditor } from "@/components/decision-rationale-editor";
import { DecisionReviewByEditor } from "@/components/decision-review-by-editor";
import { DecisionService } from "@/lib/services/decisionService";
import { DecisionStateEditor } from "@/components/decision-state-editor";
import { DecisionTitleEditor } from "@/components/decision-title-editor";
import { DeleteDecisionDialog } from "@/components/delete-decision-dialog";
import { AddIcon, DecisionIcon, DeleteIcon } from "@/components/icons";
import { MarkDecisionAsReviewedAction } from "@/components/mark-decision-as-reviewed-action";
import { PageTitle } from "@/components/page-title";
import { RelativeTimeCard } from "@/components/ui/relative-time-card";
import { canCreateAssumption } from "@/lib/policies/assumption";
import { canViewDecision, canUpdateDecision, canDeleteDecision } from "@/lib/policies/decision";
import { currentUser, assertAuthorized } from "@/lib/authorization";
import { notFound } from "next/navigation";
import { UserActionTagline } from "@/components/user-action-tagline";
import { NewAssumptionDialog } from "@/components/new-assumption-dialog";
import { Decision } from "@/lib/models/decision";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";

type DecisionPageParams = {
  params: Promise<{ decision_id: string }>;
};

export default async function DecisionPage({ params }: DecisionPageParams) {
  const { decision_id } = await params;
  const decision = await DecisionService.getWithProjectAndCreator(decision_id);

  if (!decision) {
    notFound();
  }

  const actor = await currentUser();
  assertAuthorized(canViewDecision, actor, decision);

  const assumptions = await AssumptionService.listWithCreatorForDecision(decision_id);

  const breadcrumbs = [{ name: decision.project.name, link: `/projects/${decision.projectId}` }];
  const editable = canUpdateDecision(actor, decision);

  return (
    <div className="container mx-auto pb-4 flex flex-col gap-8">
      <div>
        <Breadcrumbs path={breadcrumbs} page="Decision" className="mb-6" />
        <PageTitle
          title={<DecisionTitleEditor decision={decision} editable={editable} />}
          actions={
            canDeleteDecision(actor, decision) ?
              <DeleteDecisionDialog decision={decision} buttonSize="sm" />
            : <Button variant="destructive" size="sm" disabled>
                <DeleteIcon /> Delete
              </Button>
          }
        ></PageTitle>
        <div className="text-xs text-muted-foreground">
          <UserActionTagline action="Created" date={decision.createdAt} user={decision.creator} />
          <span> &mdash; </span>
          {decision.reviewedAt ?
            <span>
              Reviewed <RelativeTimeCard className="text-xs text-muted-foreground" date={decision.reviewedAt} />
            </span>
          : <span className="font-bold">Not reviewed</span>}
        </div>
        <div className="flex flex-row mt-4 gap-4">
          <DecisionStateEditor decision={decision} editable={editable} />
          <DecisionReviewByEditor decision={decision} editable={editable} />
          <MarkDecisionAsReviewedAction decision={decision} editable={editable} className="ml-4" />
        </div>
      </div>
      <div className="flex flex-col gap-4">
        <h3>Rationale</h3>
        <DecisionRationaleEditor decision={decision} editable={editable} />
      </div>
      <div>
        <div className="flex flex-row justify-between mb-4 gap-4">
          <h3>Assumptions</h3>
          {assumptions.length > 0 && addButton(editable, decision)}
        </div>
        {assumptions.length === 0 ?
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <DecisionIcon />
              </EmptyMedia>
              <EmptyTitle>No Assumptions Yet</EmptyTitle>
              <EmptyDescription>Get started by adding your first assumption.</EmptyDescription>
            </EmptyHeader>
            <EmptyContent>{addButton(editable, decision)}</EmptyContent>
          </Empty>
        : <AssumptionPreviewList assumptions={assumptions} />}
      </div>
    </div>
  );
}

function addButton(editable: boolean, decision: Decision) {
  return editable ?
      <NewAssumptionDialog decision={decision} buttonSize="sm" buttonVariant="default" />
    : <Button disabled size="sm">
        <AddIcon /> Add assumption
      </Button>;
}
