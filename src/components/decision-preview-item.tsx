import Link from "next/link";
import { Decision } from "@/lib/models/decision";
import { DecisionIcon, DetailIcon } from "@/components/icons";
import { Item, ItemActions, ItemMedia, ItemContent, ItemDescription, ItemTitle } from "@/components/ui/item";
import { RelativeTimeCard } from "@/components/ui/relative-time-card";

type DecisionPreviewItemProps = {
  decision: Decision<"with-creator">;
};

export function DecisionPreviewItem({ decision }: DecisionPreviewItemProps) {
  const options = {
    month: "short",
    day: "numeric",
    year: "numeric"
  } satisfies Intl.DateTimeFormatOptions;

  return (
    <Item variant="outline" asChild>
      <Link href={`/decisions/${decision.id}`}>
        <ItemMedia variant="icon">
          <DecisionIcon />
        </ItemMedia>
        <ItemContent>
          <ItemTitle>{decision.title}</ItemTitle>
          <ItemDescription>
            <span className="flex flex-row gap-x-2 flex-wrap">
              <span className="whitespace-nowrap">
                Created <RelativeTimeCard className="text-muted-foreground" date={decision.createdAt} /> by{" "}
                {decision.creator.firstName} {decision.creator.lastName}
              </span>
              {decision.reviewedAt && (
                <span className="whitespace-nowrap">
                  Last reviewed{" "}
                  <RelativeTimeCard
                    className="text-muted-foreground"
                    date={decision.reviewedAt}
                    triggerFormatOptions={options}
                  />
                </span>
              )}
              {decision.reviewBy && (
                <span className="font-bold whitespace-nowrap">
                  Review by{" "}
                  <RelativeTimeCard
                    className="text-muted-foreground"
                    date={decision.reviewBy}
                    triggerFormatOptions={options}
                  />
                </span>
              )}
            </span>
          </ItemDescription>
        </ItemContent>
        <ItemActions>
          <DetailIcon className="size-4" />
        </ItemActions>
      </Link>
    </Item>
  );
}
