import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Item, ItemActions, ItemMedia, ItemContent, ItemDescription, ItemTitle } from "@/components/ui/item";
import { User, UserRole } from "@/lib/models/user";
import { DetailIcon } from "@/components/icons";
import { AvatarInitials } from "@/components/avatar-initials";
import { Avatar } from "@/components/ui/avatar";

type UserPreviewItemProps = {
  user: User;
};

function formatRole(role: UserRole) {
  switch (role) {
    case "owner":
      return "Owner";
    case "admin":
      return "Administrator";
    case "member":
      return "Member";
  }
}

export function UserPreviewItem({ user }: UserPreviewItemProps) {
  return (
    <Item variant="outline" asChild>
      <Link href={`/users/${user.id}`} className="bg-card text-card-foreground">
        <ItemMedia variant="icon">
          <Avatar className="size-10">
            <AvatarInitials user={user} />
          </Avatar>
        </ItemMedia>
        <ItemContent>
          <ItemTitle>
            {user.firstName} {user.lastName}
          </ItemTitle>
          <ItemDescription>
            <span className="flex flex-col gap-2">
              <span>{user.email}</span>
              <Badge variant={user.role === "owner" ? "default" : "outline"}>{formatRole(user.role)}</Badge>
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
