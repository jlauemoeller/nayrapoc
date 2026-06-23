import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Decision } from "@/lib/models/decision";
import { DecisionIcon, AddIcon, ProjectStartIcon } from "@/components/icons";
import { DecisionStateBadge } from "./decision-state-badge";
import { NewDecisionDialog } from "@/components/new-decision-dialog";
import { Project } from "@/lib/models/project";
import { RelativeTimeCard } from "./ui/relative-time-card";
import {
  Timeline,
  TimelineConnector,
  TimelineContent,
  TimelineDescription,
  TimelineDot,
  TimelineHeader,
  TimelineItem,
  TimelineTime,
  TimelineTitle
} from "@/components/ui/timeline";

type ProjectDecisionsTimelineProps = {
  project: Project<"with-creator">;
  decisions: Decision<"with-creator">[];
  editable: boolean;
};

export function ProjectDecisionsTimeline({ project, decisions, editable }: ProjectDecisionsTimelineProps) {
  const items = decisions.map(item);

  return (
    <div className="min-w-75">
      <div className="flex flex-col gap-4">
        <h3>The story so far...</h3>
        <div className="-mt-1">
          {editable ?
            <NewDecisionDialog projectId={project.id} />
          : <Button disabled>
              <AddIcon /> Add decision
            </Button>
          }
        </div>
        <div className="pt-4 pb-2">
          <Timeline className="[--timeline-dot-size:2rem]" activeIndex={decisions.length}>
            <TimelineItem key={`${project.id}-start`}>
              <TimelineDot>
                <ProjectStartIcon className="size-3.5" />
              </TimelineDot>
              <TimelineConnector />
              <TimelineContent>
                <TimelineHeader>
                  <TimelineTime dateTime={project.createdAt.toISOString()}>
                    <RelativeTimeCard date={project.createdAt} />
                  </TimelineTime>
                  <TimelineTitle>Project start</TimelineTitle>
                </TimelineHeader>
                <TimelineDescription>
                  Initiated by {project.creator.firstName} {project.creator.lastName}
                </TimelineDescription>
              </TimelineContent>
            </TimelineItem>
            {items}
            <TimelineItem key={`${project.id}-add`}>
              <TimelineDot>
                <AddIcon className="size-3.5" />
              </TimelineDot>
              <TimelineConnector />
              <TimelineContent>
                <TimelineDescription>
                  <span className="block mt-2">What comes next?</span>
                </TimelineDescription>
              </TimelineContent>
            </TimelineItem>
          </Timeline>
        </div>
      </div>
    </div>
  );
}

function item(decision: Decision<"with-creator">) {
  return (
    <TimelineItem key={decision.id}>
      <TimelineDot>
        <DecisionIcon className="size-3.5" />
      </TimelineDot>
      <TimelineConnector />
      <TimelineContent>
        <Link href={`/decisions/${decision.id}`}>
          <TimelineHeader>
            <TimelineTime dateTime={decision.createdAt.toISOString()}>
              <RelativeTimeCard date={decision.createdAt} />
            </TimelineTime>
            <TimelineTitle>{decision.title}</TimelineTitle>
          </TimelineHeader>
          <TimelineDescription className="pt-2">
            <DecisionStateBadge decision={decision} />{" "}
            <span className="mr-2">
              {decision.creator.firstName} {decision.creator.lastName}
            </span>
          </TimelineDescription>
        </Link>
      </TimelineContent>
    </TimelineItem>
  );
}
