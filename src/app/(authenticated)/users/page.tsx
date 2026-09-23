import { currentUser, assertAuthorized } from "@/lib/authorization";
import { canListUsers, canCreateUser } from "@/lib/policies/user";
import { UserService } from "@/lib/services/userService";
import { PageTitle } from "@/components/page-title";
import { UserPreviewList } from "@/components/user-preview-list";
import { NewUserDialog } from "@/components/new-user-dialog";
import { Button } from "@/components/ui/button";
import { AddIcon } from "@/components/icons";

export default async function TeamPage() {
  const actor = await currentUser();
  assertAuthorized(canListUsers, actor, actor.accountId);

  const users = await UserService.listForAccount(actor.accountId);
  const editable = canCreateUser(actor, actor.accountId);

  return (
    <div className="container mx-auto py-4 flex flex-col gap-8">
      <PageTitle
        title="Team"
        actions={
          editable ?
            <NewUserDialog accountId={actor.accountId} />
          : <Button disabled size="sm">
              <AddIcon /> Add user
            </Button>
        }
      ></PageTitle>
      <UserPreviewList users={users} />
    </div>
  );
}
