"use client";

import { ConfirmationDialog } from "./confirmation-dialog";
import { DeleteIcon } from "@/components/icons";
import { User } from "@/lib/models/user";
import { deleteUser } from "@/lib/actions/user";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

type DeleteUserDialogProps = {
  user: User;
};

export function DeleteUserDialog({ user }: DeleteUserDialogProps) {
  const router = useRouter();
  const handleDelete = async () => {
    const result = await deleteUser(user.id);

    if (!result.success) {
      toast.error("Could not delete the user");
    } else {
      router.push(`/users`);
    }
  };

  return (
    <ConfirmationDialog
      title="Delete User?"
      triggerIcon={<DeleteIcon />}
      triggerLabel="Delete"
      onConfirm={handleDelete}
      content={
        <>
          <span>
            This will permanently delete the user{" "}
            <b>
              {user.firstName} {user.lastName}
            </b>{" "}
            ({user.email}).
          </span>
          <span>The action cannot be undone.</span>
        </>
      }
    />
  );
}
