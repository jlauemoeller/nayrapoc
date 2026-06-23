"use client";

import { useState, useId } from "react";
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogTrigger
} from "@/components/ui/responsive-dialog";
import { AddIcon } from "@/components/icons";
import { Button, ButtonVariant, ButtonSize } from "@/components/ui/button";

interface NewiItemDialogProps<T> {
  triggerLabel: string;
  title?: string;
  description: React.ReactNode;
  buttonVariant?: ButtonVariant;
  buttonSize?: ButtonSize;
  onSuccess?: (value: T) => void;
  children: (handlers: {
    formId: string;
    onSubmittingChange: (submitting: boolean) => void;
    onSuccess: (value: T) => void;
  }) => React.ReactNode;
}

export function NewItemDialog<T>({
  triggerLabel,
  title,
  description,
  buttonSize,
  buttonVariant,
  onSuccess,
  children
}: NewiItemDialogProps<T>) {
  const [pending, setPending] = useState(false);
  const [open, setOpen] = useState(false);
  const formId = useId();

  const handleSuccess = (value: T) => {
    setOpen(false);
    onSuccess?.(value);
  };

  return (
    <ResponsiveDialog open={open} onOpenChange={setOpen}>
      <ResponsiveDialogTrigger asChild>
        <Button size={buttonSize} variant={buttonVariant}>
          <AddIcon /> {triggerLabel}
        </Button>
      </ResponsiveDialogTrigger>
      <ResponsiveDialogContent>
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>{title ?? triggerLabel}</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>{description}</ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        {children({ formId, onSubmittingChange: setPending, onSuccess: handleSuccess })}
        <ResponsiveDialogFooter>
          <Button
            variant="secondary"
            type="button"
            onClick={() => setOpen(false)}
            onMouseDown={(e) => e.preventDefault()}
          >
            Cancel
          </Button>
          <Button form={formId} disabled={pending}>
            Add
          </Button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
