import { User } from "@/lib/models/user";
import { UserPreviewItem } from "@/components/user-preview-item";

type UserPreviewListProps = {
  users: User[];
};

export async function UserPreviewList({ users }: UserPreviewListProps) {
  const items = users.map((user) => <UserPreviewItem key={user.id} user={user} />);
  return <div className="grid md:grid-cols-2 grid-cols-1 gap-4">{items}</div>;
}
