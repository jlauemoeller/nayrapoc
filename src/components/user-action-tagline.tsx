import { RelativeTimeCard } from "@/components/ui/relative-time-card";
import { User } from "@/lib/models/user";
type UserActionTaglineProps = {
  action: string;
  user: User;
  date: Date;
};

export function UserActionTagline({ action, user, date }: UserActionTaglineProps) {
  return (
    <span>
      {action} <RelativeTimeCard className="text-xs text-muted-foreground" date={date} /> by {user.firstName}{" "}
      {user.lastName}
    </span>
  );
}
