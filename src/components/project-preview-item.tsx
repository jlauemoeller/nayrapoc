import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Item, ItemActions, ItemMedia, ItemContent, ItemDescription, ItemTitle } from "@/components/ui/item";
import { Project, ProjectDecisionCounts } from "@/lib/models/project";
import { ProjectIcon, DetailIcon } from "@/components/icons";

type ProjectPreviewItemProps = {
  project: Project<"with-creator">;
  counts: ProjectDecisionCounts;
};

export function ProjectPreviewItem({ project, counts }: ProjectPreviewItemProps) {
  return (
    <Item variant="outline" asChild>
      <Link href={`/projects/${project.id}`}>
        <ItemMedia variant="icon">
          <ProjectIcon />
        </ItemMedia>
        <ItemContent>
          <ItemTitle>{project.name}</ItemTitle>
          <ItemDescription>
            <span className="flex flex-row gap-2">
              {counts?.proposed > 0 && <Badge variant="outline">{counts.proposed} proposed</Badge>}
              {counts?.active > 0 && <Badge variant="default">{counts.active} active</Badge>}
              {counts?.rejected > 0 && <Badge variant="destructive">{counts.rejected} rejected</Badge>}
              {counts?.retired > 0 && <Badge variant="outline">{counts.retired} retired</Badge>}
              {counts && counts.total > 1 ?
                " decisions"
              : counts.total == 1 ?
                " decision"
              : "No decisions yet"}
            </span>
            <span className="block mt-2">Click to view project details</span>
          </ItemDescription>
        </ItemContent>
        <ItemActions>
          <DetailIcon className="size-4" />
        </ItemActions>
      </Link>
    </Item>
  );
}
