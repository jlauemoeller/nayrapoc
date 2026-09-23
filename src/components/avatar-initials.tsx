import { AvatarFallback } from "@/components/ui/avatar";
import { User } from "@/lib/models/user";

type AvatarInitialsProps = {
  user: User;
};

export function AvatarInitials({ user }: AvatarInitialsProps) {
  const initials = initial(user.firstName).toUpperCase() + initial(user.lastName).toUpperCase();

  return <AvatarFallback className="bg-primary text-primary-foreground font-bold">{initials}</AvatarFallback>;
}

function initial(name: string | undefined): string {
  return name?.at(0) ?? "";
}
