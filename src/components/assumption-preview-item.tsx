import Link from "next/link";
import { Assumption } from "@/lib/models/assumption";
import { AssumptionIcon, DetailIcon } from "@/components/icons";
import { ConfidenceView } from "@/components/confidence-view";
import { Item, ItemActions, ItemMedia, ItemContent, ItemDescription, ItemTitle } from "@/components/ui/item";

type AssumptionPreviewItemProps = {
  assumption: Assumption<"with-decision-and-creator">;
};

export function AssumptionPreviewItem({ assumption }: AssumptionPreviewItemProps) {
  return (
    <Item variant="outline" asChild>
      <Link href={`/assumptions/${assumption.id}`}>
        <ItemMedia variant="icon">
          <AssumptionIcon />
        </ItemMedia>
        <ItemContent>
          <ItemTitle>{assumption.title}</ItemTitle>
          <ConfidenceView value={assumption.confidence ?? 0} editable={false} size={"sm"} />
          <ItemDescription>Click to view assumption details</ItemDescription>
        </ItemContent>
        <ItemActions>
          <DetailIcon className="size-4" />
        </ItemActions>
      </Link>
    </Item>
  );
}
