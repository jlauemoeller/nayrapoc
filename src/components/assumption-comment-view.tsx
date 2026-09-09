"use client";

import { AssumptionComment } from "@/lib/models/assumptionComment";
import { BlockEditor } from "@/components/block-editor";
import { Avatar } from "@/components/ui/avatar";
import { AvatarInitials } from "@/components/avatar-initials";
import { Button } from "@/components/ui/button";
import { DeleteIcon } from "@/components/icons";
import { RelativeTimeCard } from "@/components/ui/relative-time-card";

type AssumptionCommentWithPreloads = AssumptionComment<"with-creator-and-resolver">;

interface AssumptionCommentViewProps {
  deletable: boolean;
  onDelete: (id: string) => void;
  comment: AssumptionCommentWithPreloads;
}

export function AssumptionCommentView({ deletable, onDelete, comment }: AssumptionCommentViewProps) {
  const options = {
    month: "short",
    day: "numeric",
    year: "numeric"
  } satisfies Intl.DateTimeFormatOptions;

  return (
    <div className="flex flex-col border rounded-lg">
      <div className="flex flex-row rounded-t-lg border-b p-2 gap-3.5 bg-muted">
        <Avatar className="size-10">
          <AvatarInitials user={comment.creator} />
        </Avatar>
        <div className="flex flex-row justify-between w-full">
          <div className="flex flex-col text-sm">
            <div className="font-bold">
              {comment.creator.firstName} {comment.creator.lastName}
            </div>
            <RelativeTimeCard
              className="text-muted-foreground"
              date={comment.updatedAt}
              triggerFormatOptions={options}
            />
          </div>
          <div className="flex flex-row gap-2">
            {deletable ?
              <Button variant="destructive" onClick={() => onDelete(comment.id)}>
                <DeleteIcon />
              </Button>
            : ""}
          </div>
        </div>
      </div>
      <BlockEditor editable={false} initialContent={comment.body} className="border-none px-2" />
    </div>
  );
}
