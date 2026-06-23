import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Item, ItemActions, ItemMedia, ItemContent, ItemDescription, ItemTitle } from "@/components/ui/item";
import { User, UserRole } from "@/lib/models/user";
import { UserIcon, DetailIcon } from "@/components/icons";

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
      <Link href={`/users/${user.id}`}>
        <ItemMedia variant="icon">
          <UserIcon />
        </ItemMedia>
        <ItemContent>
          <ItemTitle>
            {user.firstName} {user.lastName}
          </ItemTitle>
          <ItemDescription>
            <span className="flex flex-col gap-2">
              <span>{user.email}</span>
              <Badge>{formatRole(user.role)}</Badge>
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
