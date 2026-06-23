import Link from "next/link";
import { AssumptionConfidenceEditor } from "@/components/assumption-confidence-editor";
import { AssumptionRationaleEditor } from "@/components/assumption-rationale-editor";
import { AssumptionService } from "@/lib/services/assumptionService";
import { AssumptionTitleEditor } from "@/components/assumption-title-editor";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { Button } from "@/components/ui/button";
import { DeleteAssumptionDialog } from "@/components/delete-assumption-dialog";
import { DeleteIcon } from "@/components/icons";
import { PageTitle } from "@/components/page-title";
import { canViewAssumption, canUpdateAssumption, canDeleteAssumption } from "@/lib/policies/assumption";
import { currentUser, assertAuthorized } from "@/lib/authorization";
import { redirect } from "next/navigation";

type AssumptionPageParams = {
  params: Promise<{ assumption_id: string }>;
};

export default async function AssumptionPage({ params }: AssumptionPageParams) {
  const { assumption_id } = await params;
  const assumption = await AssumptionService.getWithDecisionCreatorAndProject(assumption_id);

  if (!assumption) {
    redirect("/projects");
  }

  const actor = await currentUser();
  assertAuthorized(canViewAssumption, actor, assumption);
  const editable = canUpdateAssumption(actor, assumption);

  const breadcrumbs = [
    { name: assumption.decision.project.name, link: `/projects/${assumption.decision.projectId}` },
    { name: "Decision", link: `/decisions/${assumption.decisionId}` }
  ];

  return (
    <div className="container mx-auto pb-4 flex flex-col">
      <div className="flex flex-col md:flex-row md:justify-between items-center">
        <Breadcrumbs path={breadcrumbs} page="Assumption" />
        {canDeleteAssumption(actor, assumption) ?
          <DeleteAssumptionDialog assumption={assumption} />
        : <Button variant="destructive" disabled>
            <DeleteIcon /> Delete
          </Button>
        }
      </div>
      <div className="text-sm mt-4 text-muted-foreground">
        The decision{" "}
        <Link className="link" href={`/decisions/${assumption.decisionId}`}>
          {assumption.decision.title}
        </Link>{" "}
        assumes
      </div>
      <PageTitle title={<AssumptionTitleEditor assumption={assumption} editable={editable} />}></PageTitle>
      <h3>Confidence</h3>
      <div className="mb-2">How confident are we that this assumption holds?</div>
      <AssumptionConfidenceEditor assumption={assumption} editable={editable} />
      <div className="flex flex-col gap-4 mt-6">
        <div className="flex flex-row gap-4 items-baseline">
          <h3>Rationale</h3>
          {editable && <span className="text-muted-foreground text-xs">(Click and type to edit)</span>}
        </div>
        <AssumptionRationaleEditor assumption={assumption} editable={editable} />
      </div>
    </div>
  );
}
