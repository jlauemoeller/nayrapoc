import { currentUser, assertAuthorized } from "@/lib/authorization";
import { canListUsers, canCreateUser } from "@/lib/policies/user";
import { UserService } from "@/lib/services/userService";
import { PageTitle } from "@/components/page-title";
import { UserPreviewList } from "@/components/user-preview-list";

export default async function TeamPage() {
  const actor = await currentUser();
  assertAuthorized(canListUsers, actor, actor.accountId);

  const users = await UserService.listForAccount(actor.accountId);
  const editable = canCreateUser(actor, actor.accountId);

  return (
    <div className="container mx-auto py-4 flex flex-col gap-4">
      <PageTitle title="Team" hint="Your team"></PageTitle>
      <UserPreviewList accountId={actor.accountId} users={users} editable={editable} />
    </div>
  );
}
