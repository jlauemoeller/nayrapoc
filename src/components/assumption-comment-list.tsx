"use client";

import { toast } from "sonner";
import { Block } from "@blocknote/core";
import { type Assumption } from "@/lib/models/assumption";
import { AssumptionCommentView } from "@/components/assumption-comment-view";
import { AssumptionCommentEditor } from "@/components/assumption-comment-editor";
import { SessionUser } from "@/lib/models/user";
import { canDeleteAssumptionComment } from "@/lib/policies/assumptionComment";
import { canUpdateAssumption } from "@/lib/policies/assumption";
import { useRouter } from "next/navigation";
import {
  createAssumptionComment,
  deleteAssumptionComment,
  updateAssumptionCommentResolutionState
} from "@/lib/actions/assumptionComment";
import { useState } from "react";

type AssumptionCommentWithPreloads = Parameters<typeof AssumptionCommentView>[0]["comment"];

type AssumptionCommentListProps = {
  actor: SessionUser;
  assumption: Assumption<"with-decision-and-project">;
  initialComments: AssumptionCommentWithPreloads[];
};

export function AssumptionCommentList({ actor, assumption, initialComments }: AssumptionCommentListProps) {
  const editable = canUpdateAssumption(actor, assumption);
  const [comments, setComments] = useState(initialComments);
  const router = useRouter();

  const handleCreate = async function (body: Block[]) {
    const result = await createAssumptionComment({ assumptionId: assumption.id, body });
    if (!result.success) return showErrorToast("Could not create comment");
    setComments((prev) => [...prev, result.data]);
    router.refresh();
  };

  const handleDelete = async function (id: string) {
    const result = await deleteAssumptionComment(id);
    if (!result.success) return showErrorToast("Could not delete comment");
    setComments((prev) => prev.filter((c) => c.id != id));
    router.refresh();
  };

  const handleResolutionChange = async function (id: string, state: boolean) {
    const result = await updateAssumptionCommentResolutionState(id, state);
    if (!result.success) return showErrorToast("Could not change comment resolution state");
    setComments((prev) => prev.map((c) => (c.id == id ? result.data : c)));
    router.refresh();
  };

  return (
    <div className="flex flex-col">
      {content(actor, handleDelete, handleResolutionChange, assumption, comments)}
      {editable ?
        <div className="border rounded-lg p-4 bg-muted">
          <h3 className="mb-2">Leave a Comment</h3>
          <AssumptionCommentEditor onSubmit={handleCreate} className="h-full bg-white" />
        </div>
      : ""}
    </div>
  );
}

function content(
  actor: SessionUser,
  handleDelete: (id: string) => void,
  handleResolutionChange: (id: string, state: boolean) => void,
  assumption: Assumption<"with-decision-and-project">,
  comments: AssumptionCommentWithPreloads[]
) {
  if (comments.length > 0) {
    const items = comments.map((c) => item(actor, handleDelete, handleResolutionChange, assumption, c));
    return <div className="flex flex-col">{items}</div>;
  } else {
    return <div>No comments yet</div>;
  }
}

function item(
  actor: SessionUser,
  handleDelete: (id: string) => void,
  handleResolutionChange: (id: string, state: boolean) => void,
  assumption: Assumption<"with-decision-and-project">,
  comment: AssumptionCommentWithPreloads
) {
  const canDelete = canDeleteAssumptionComment(actor, assumption, comment);

  return (
    <div key={comment.id} className="flex flex-col">
      <AssumptionCommentView
        deletable={canDelete}
        onDelete={handleDelete}
        onResolutionChange={handleResolutionChange}
        comment={comment}
      />
      <div className="ml-4 h-8 border-l">&nbsp;</div>
    </div>
  );
}

function showErrorToast(message: string) {
  toast.error(<span className="text-destructive">{message}</span>, {
    position: "top-center"
  });
}
