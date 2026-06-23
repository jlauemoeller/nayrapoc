import { AssumptionPreviewList } from "@/components/assumption-preview-list";
import { AssumptionService } from "@/lib/services/assumptionService";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { Button } from "@/components/ui/button";
import { DecisionRationaleEditor } from "@/components/decision-rationale-editor";
import { DecisionReviewByEditor } from "@/components/decision-review-by-editor";
import { DecisionService } from "@/lib/services/decisionService";
import { DecisionStateBadge } from "@/components/decision-state-badge";
import { DecisionStateEditor } from "@/components/decision-state-editor";
import { DecisionTitleEditor } from "@/components/decision-title-editor";
import { DeleteDecisionDialog } from "@/components/delete-decision-dialog";
import { DeleteIcon } from "@/components/icons";
import { MarkDecisionAsReviewedAction } from "@/components/mark-decision-as-reviewed-action";
import { PageTitle } from "@/components/page-title";
import { RelativeTimeCard } from "@/components/ui/relative-time-card";
import { canCreateAssumption } from "@/lib/policies/assumption";
import { canViewDecision, canUpdateDecision, canDeleteDecision } from "@/lib/policies/decision";
import { currentUser, assertAuthorized } from "@/lib/authorization";
import { notFound } from "next/navigation";

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
  const assumptionsEditable = canCreateAssumption(actor, decision);

  return (
    <div className="container mx-auto pb-4 flex flex-col">
      <div className="flex flex-col md:flex-row md:justify-between items-center mb-4">
        <Breadcrumbs path={breadcrumbs} page="Decision" />
        <div className="flex flex-row items-center gap-4">
          <DecisionStateBadge decision={decision} />
          {canDeleteDecision(actor, decision) ?
            <DeleteDecisionDialog decision={decision} />
          : <Button variant="destructive" disabled>
              <DeleteIcon /> Delete
            </Button>
          }
        </div>
      </div>
      <PageTitle title={<DecisionTitleEditor decision={decision} editable={editable} />}></PageTitle>
      <div className="text-xs text-muted-foreground">
        <span>
          Created <RelativeTimeCard className="text-xs text-muted-foreground" date={decision.createdAt} /> by{" "}
          {decision.creator.firstName} {decision.creator.lastName}
        </span>
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
        <MarkDecisionAsReviewedAction decision={decision} editable={editable} />
      </div>
      <div className="flex flex-col gap-4 mt-8">
        <h3>Assumptions</h3>
        <AssumptionPreviewList decision={decision} assumptions={assumptions} editable={assumptionsEditable} />
      </div>
      <div className="flex flex-col gap-4 mt-8">
        <h3>Rationale</h3>
        <DecisionRationaleEditor decision={decision} editable={editable} />
      </div>
    </div>
  );
}
