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
    <div className="container mx-auto pb-4 flex flex-col">
      <div className="flex flex-col md:flex-row md:justify-between items-center mb-4">
        <Breadcrumbs path={breadcrumbs} page="User" className="mb-6" />
        <div className="flex flex-row items-center gap-4">
          {canDeleteUser(actor, user) ?
            <DeleteUserDialog user={user} />
          : <Button variant="destructive" disabled>
              <DeleteIcon /> Delete
            </Button>
          }
        </div>
      </div>
      <PageTitle title={`${user.firstName} ${user.lastName}`}></PageTitle>
      <div className="text-xs text-muted-foreground">
        Created <RelativeTimeCard className="text-xs text-muted-foreground" date={user.createdAt} />
      </div>
    </div>
  );
}
