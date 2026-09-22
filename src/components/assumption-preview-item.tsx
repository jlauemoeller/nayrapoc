import Link from "next/link";
import { Assumption } from "@/lib/models/assumption";
import { AssumptionIcon, DetailIcon } from "@/components/icons";
import { Item, ItemActions, ItemMedia, ItemContent, ItemDescription, ItemTitle } from "@/components/ui/item";
import { UserActionTagline } from "./user-action-tagline";
import { AgentIcon } from "@/components/icons";
import { Badge } from "@/components/ui/badge";

type AssumptionPreviewItemProps = {
  assumption: Assumption<"with-decision-and-creator">;
};

export function AssumptionPreviewItem({ assumption }: AssumptionPreviewItemProps) {
  return (
    <Item variant="outline" asChild className="items-start">
      <Link href={`/assumptions/${assumption.id}`}>
        <ItemMedia variant="icon">
          <AssumptionIcon />
        </ItemMedia>
        <ItemContent>
          <ItemTitle>{assumption.title}</ItemTitle>
          <ItemDescription>
            <UserActionTagline action="Created" user={assumption.creator} date={assumption.createdAt} />
          </ItemDescription>
          {evaluationSummary(assumption)}
        </ItemContent>
        <ItemActions>
          <DetailIcon className="size-4" />
        </ItemActions>
      </Link>
    </Item>
  );
}

function evaluationSummary(assumption: Assumption) {
  switch (assumption.rationaleAiRating) {
    case undefined:
      return (
        <div className="flex flex-col gap-2 mt-2">
          <div className="flex flex-row gap-2 items-center">
            <AgentIcon /> <Badge variant="outline">Unknown</Badge>
          </div>
          No AI evaluation of the rationale available.
        </div>
      );

    case "addressed":
      return (
        <div className="flex flex-col gap-2 mt-2">
          <div className="flex flex-row gap-2 items-center">
            <AgentIcon /> <Badge variant="outline">Good to go!</Badge>
          </div>
          The rationale appears to address all major concerns raised in comments.
        </div>
      );

    case "partially_addressed":
      return (
        <div className="flex flex-col gap-2 mt-2">
          <div className="flex flex-row gap-2 items-center">
            <AgentIcon /> <Badge variant="destructive">Work Needed</Badge>
          </div>
          The rationale appears to only partially address concerns raised in comments.
        </div>
      );

    case "not_addressed":
      return (
        <div className="flex flex-col gap-2 mt-2">
          <div className="flex flex-row gap-2 items-center">
            <AgentIcon /> <Badge variant="destructive">Attention!</Badge>
          </div>
          The rationale does not appear to address major concerns raised in comments.
        </div>
      );

    default:
      throw new Error(`Unexpected rationale AI rating ${assumption.rationaleAiRating}`);
  }
}
