"use client";

import { ConfidenceIcon } from "@/components/icons";
import { Rating, RatingItem } from "@/components/ui/rating";

interface ConfidenceViewProps extends React.ComponentProps<typeof Rating> {
  editable: boolean;
  value: number;
  onValueChange?: (value: number) => void;
}

export function ConfidenceView({ editable, value, onValueChange, ...rest }: ConfidenceViewProps) {
  return (
    <Rating value={value} step={0.5} onValueChange={onValueChange} disabled={!editable} {...rest}>
      {Array.from({ length: 5 }, (_, i) => (
        <RatingItem key={i}>
          <ConfidenceIcon />
        </RatingItem>
      ))}
    </Rating>
  );
}
