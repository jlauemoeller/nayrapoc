"use client";

import { AssumptionComment } from "@/lib/models/assumptionComment";
import { BlockEditor } from "@/components/block-editor";
import { Avatar } from "@/components/ui/avatar";
import { AvatarInitials } from "@/components/avatar-initials";
import { Button } from "@/components/ui/button";
import { DeleteIcon } from "@/components/icons";
import { RelativeTimeCard } from "@/components/ui/relative-time-card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

type AssumptionCommentWithPreloads = AssumptionComment<"with-creator-and-resolver">;

interface AssumptionCommentViewProps {
  deletable: boolean;
  onDelete: (id: string) => void;
  onResolutionChange: (id: string, state: boolean) => void;
  comment: AssumptionCommentWithPreloads;
}

export function AssumptionCommentView({
  deletable,
  onDelete,
  onResolutionChange,
  comment
}: AssumptionCommentViewProps) {
  const options = {
    month: "short",
    day: "numeric",
    year: "numeric"
  } satisfies Intl.DateTimeFormatOptions;

  return (
    <div className="flex flex-col border rounded-lg">
      <div className="flex flex-row items-center rounded-t-lg border-b p-2 gap-3.5 bg-muted">
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
          <div className="flex flex-row gap-4">
            <div className="flex flex-row items-center space-x-2">
              <Switch
                id={`resolved-${comment.id}`}
                defaultChecked={comment.resolvedAt !== undefined}
                onCheckedChange={(state) => onResolutionChange(comment.id, state)}
              />
              <Label htmlFor={`resolved-${comment}`}>Resolved</Label>
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
      </div>
      <BlockEditor editable={false} initialContent={comment.body} className="border-none px-2" />
    </div>
  );
}
