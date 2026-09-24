import { AssumptionCommentList } from "@/components/assumption-comment-list";
import { AssumptionRationaleEditor } from "@/components/assumption-rationale-editor";
import { AssumptionRationaleAIEvaluation } from "@/components/assumption-rationale-ai-evaluation";
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
import { AssumptionCommentService } from "@/lib/services/assumptionCommentService";
import { UserActionTagline } from "@/components/user-action-tagline";

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

  const comments = await AssumptionCommentService.listForAssumptionWithCreatorAndResolver(assumption.id);

  const breadcrumbs = [
    { name: assumption.decision.project.name, link: `/projects/${assumption.decision.projectId}` },
    { name: assumption.decision.title, link: `/decisions/${assumption.decisionId}` }
  ];

  return (
    <div className="container mx-auto pb-4 flex flex-col gap-8">
      <div>
        <Breadcrumbs path={breadcrumbs} page="Assumption" className="mb-6" />
        <PageTitle
          title={<AssumptionTitleEditor assumption={assumption} editable={editable} />}
          actions={
            canDeleteAssumption(actor, assumption) ?
              <DeleteAssumptionDialog assumption={assumption} buttonSize="sm" />
            : <Button variant="destructive" size="sm" disabled>
                <DeleteIcon /> Delete
              </Button>
          }
        ></PageTitle>
        <div className="text-xs text-muted-foreground">
          <UserActionTagline action="Created" date={assumption.createdAt} user={assumption.creator} />
        </div>
      </div>
      <div className="flex flex-col gap-4">
        <div className="flex flex-row gap-4 items-baseline">
          <h3>Rationale</h3>
          {editable && <span className="text-muted-foreground text-xs">(Click and type to edit)</span>}
        </div>
        <AssumptionRationaleEditor assumption={assumption} editable={editable} className="min-h-50" />
        <AssumptionRationaleAIEvaluation assumption={assumption} />
      </div>
      <div>
        <h3>Discussion</h3>
        <p className="mb-6">
          Help validate the assumption by sharing your thoughts and concerns. Mark your comment as resolved when you
          believe it has been addressed or is no longer relevant.
        </p>
        <AssumptionCommentList actor={actor} assumption={assumption} initialComments={comments} />
      </div>
    </div>
  );
}
