"use client";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FieldGroup } from "@/components/ui/field";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Project, projectFormSchema } from "@/lib/models/project";
import { Required } from "@/components/required";
import { applyActionError } from "@/lib/forms";
import { createProject } from "@/lib/actions/project";

export type NewProjectFormValues = z.infer<typeof projectFormSchema>;

interface NewProjectFormProps {
  id: string;
  accountId: string;
  onSubmittingChange?: (submitting: boolean) => void;
  onSuccess?: (project: Project) => void;
}

export function NewProjectForm({ id, accountId, onSubmittingChange, onSuccess }: NewProjectFormProps) {
  const form = useForm<NewProjectFormValues>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      name: ""
    },
    mode: "onBlur",
    reValidateMode: "onChange"
  });

  async function handleSubmit(values: NewProjectFormValues) {
    onSubmittingChange?.(true);
    try {
      const result = await createProject({ accountId, ...values });

      if (!result.success) {
        applyActionError(form, result.error);
        return;
      }

      onSuccess?.(result.data);
    } finally {
      onSubmittingChange?.(false);
    }
  }

  const rootError = form.formState.errors.root?.message;

  return (
    <Form {...form}>
      <form id={id} onSubmit={form.handleSubmit(handleSubmit)} className="max-w-xl">
        <FieldGroup className="gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Title <Required />
                </FormLabel>
                <FormControl>
                  <Input {...field} type="text" placeholder="My decision" autoComplete="off" autoFocus data-1p-ignore />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {rootError ?
            <p className="text-sm text-destructive">{rootError}</p>
          : null}
        </FieldGroup>
      </form>
    </Form>
  );
}
