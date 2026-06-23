"use client";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FieldGroup } from "@/components/ui/field";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Decision, decisionFormSchema } from "@/lib/models/decision";
import { Required } from "@/components/required";
import { applyActionError } from "@/lib/forms";
import { createDecision } from "@/lib/actions/decision";

export type NewDecisionFormValues = z.infer<typeof decisionFormSchema>;

interface NewDecisionFormProps {
  id: string;
  projectId: string;
  onSubmittingChange?: (submitting: boolean) => void;
  onSuccess?: (decision: Decision) => void;
}

export function NewDecisionForm({ id, projectId, onSubmittingChange, onSuccess }: NewDecisionFormProps) {
  const form = useForm<NewDecisionFormValues>({
    resolver: zodResolver(decisionFormSchema),
    defaultValues: {
      title: ""
    },
    mode: "onBlur",
    reValidateMode: "onChange"
  });

  async function handleSubmit(values: NewDecisionFormValues) {
    onSubmittingChange?.(true);
    try {
      const result = await createDecision({ projectId, ...values });

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
            name="title"
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
