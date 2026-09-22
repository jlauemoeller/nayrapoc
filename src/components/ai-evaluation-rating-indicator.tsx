import { Badge } from "@/components/ui/badge";
import { RationaleAiRatings } from "@/lib/models/assumption";

type AiEvaluationRatingIndicatorProps = {
  rating: RationaleAiRatings;
};

export function AiEvaluationRatingIndicator({ rating }: AiEvaluationRatingIndicatorProps) {
  const variant = variantFromRating(rating);
  const title = titleFromRating(rating);
  return <Badge variant={variant}>{title}</Badge>;
}

function variantFromRating(rating: RationaleAiRatings) {
  switch (rating) {
    case "addressed":
      return "default";

    case "not_addressed":
      return "destructive";

    default:
      return "destructive";
  }
}

function titleFromRating(rating: RationaleAiRatings) {
  switch (rating) {
    case "addressed":
      return "Adressed";

    case "not_addressed":
      return "Not Addressed";

    case "partially_addressed":
      return "Partially Addressed";

    default:
      throw new Error(`Unexpected rating ${rating}`);
  }
}
