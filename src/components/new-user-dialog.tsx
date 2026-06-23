"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogTrigger
} from "@/components/ui/responsive-dialog";
import { Button } from "@/components/ui/button";
import { AddIcon } from "@/components/icons";
import { NewUserForm } from "@/components/new-user-form";
import { User } from "@/lib/models/user";

type NewUserDialogProps = {
  accountId: string;
};

export function NewUserDialog({ accountId }: NewUserDialogProps) {
  const [pending, setPending] = useState(false);
  const [open, setOpen] = useState(false);

  const router = useRouter();

  const handleSuccess = (user: User) => {
    setOpen(false);
    router.push(`/users/${user.id}`);
  };

  return (
    <ResponsiveDialog open={open} onOpenChange={setOpen}>
      <ResponsiveDialogTrigger asChild>
        <Button>
          <AddIcon /> Add user
        </Button>
      </ResponsiveDialogTrigger>
      <ResponsiveDialogContent>
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>Add user</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>Add a new user</ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        <NewUserForm
          id="new-user-form"
          accountId={accountId}
          onSubmittingChange={setPending}
          onSuccess={handleSuccess}
        />
        <ResponsiveDialogFooter>
          <Button
            variant="secondary"
            type="button"
            onClick={() => setOpen(false)}
            onMouseDown={(e) => e.preventDefault()}
          >
            Cancel
          </Button>
          <Button form="new-user-form" disabled={pending}>
            Add
          </Button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
