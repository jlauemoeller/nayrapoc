import { Breadcrumbs } from "@/components/breadcrumbs";
import { Button } from "@/components/ui/button";
import { DeleteIcon } from "@/components/icons";
import { DeleteUserDialog } from "@/components/delete-user-dialog";
import { PageTitle } from "@/components/page-title";
import { RelativeTimeCard } from "@/components/ui/relative-time-card";
import { UserService } from "@/lib/services/userService";
import { canViewUser, canDeleteUser } from "@/lib/policies/user";
import { currentUser, assertAuthorized } from "@/lib/authorization";
import { redirect } from "next/navigation";

type UserPageParams = {
  params: Promise<{ user_id: string }>;
};

export default async function UserPage({ params }: UserPageParams) {
  const { user_id } = await params;
  const user = await UserService.get(user_id);

  if (!user) {
    redirect("/users");
  }

  const actor = await currentUser();
  assertAuthorized(canViewUser, actor, user);

  const breadcrumbs = [{ name: "Users", link: "/users" }];

  return (
    <div className="container mx-auto pb-4 flex flex-col gap-8">
      <div>
        <Breadcrumbs path={breadcrumbs} page="User" className="mb-6" />
        <PageTitle
          title={`${user.firstName} ${user.lastName}`}
          actions={
            canDeleteUser(actor, user) ?
              <DeleteUserDialog user={user} buttonSize="sm" />
            : <Button variant="destructive" disabled size="sm">
                <DeleteIcon /> Delete
              </Button>
          }
        ></PageTitle>
      </div>
      <div className="text-xs text-muted-foreground">
        Created <RelativeTimeCard className="text-xs text-muted-foreground" date={user.createdAt} />
      </div>
    </div>
  );
}
