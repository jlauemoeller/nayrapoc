import { Button } from "@/components/ui/button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { NewUserDialog } from "@/components/new-user-dialog";
import { User } from "@/lib/models/user";
import { UserIcon, AddIcon } from "@/components/icons";
import { UserPreviewItem } from "@/components/user-preview-item";

type UserPreviewListProps = {
  accountId: string;
  users: User[];
  editable: boolean;
};

export async function UserPreviewList({ accountId, users, editable }: UserPreviewListProps) {
  const items = users.map((user) => <UserPreviewItem key={user.id} user={user} />);

  return users.length > 0 ?
      <div className="flex flex-col gap-4">
        <div className="grid md:grid-cols-2 grid-cols-1 gap-4">{items}</div>
        <div className="flex flex-row justify-start mt-4">
          {editable ?
            <NewUserDialog accountId={accountId} />
          : <Button disabled>
              <AddIcon /> Add user
            </Button>
          }
        </div>
      </div>
    : <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <UserIcon />
          </EmptyMedia>
          <EmptyTitle>No Users Yet</EmptyTitle>
          <EmptyDescription>Get started by adding your first user.</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          {editable ?
            <NewUserDialog accountId={accountId} />
          : <Button disabled>
              <AddIcon /> Add user
            </Button>
          }
        </EmptyContent>
      </Empty>;
}
