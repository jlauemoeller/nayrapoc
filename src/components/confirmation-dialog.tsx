"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import { Button, ButtonSize } from "@/components/ui/button";
import { ReactNode } from "react";

interface ConfirmationDialogProps {
  triggerIcon?: ReactNode;
  triggerLabel: string;
  title: string;
  content: ReactNode;
  actionLabel?: string;
  cancelLabel?: string;
  buttonSize?: ButtonSize;
  onConfirm?: () => void;
}

export function ConfirmationDialog({
  triggerIcon,
  triggerLabel,
  title,
  content,
  actionLabel,
  cancelLabel,
  buttonSize,
  onConfirm
}: ConfirmationDialogProps) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size={buttonSize}>
          {triggerIcon} {triggerLabel}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-destructive/10 text-destructive dark:bg-destructive/20 dark:text-destructive">
            {triggerIcon}
          </AlertDialogMedia>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription className="flex flex-col gap-4">{content}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel variant="outline">{cancelLabel ?? "Cancel"}</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} variant="destructive">
            {actionLabel ?? triggerLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
