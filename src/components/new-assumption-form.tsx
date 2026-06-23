"use client";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FieldGroup } from "@/components/ui/field";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Assumption, assumptionFormSchema } from "@/lib/models/assumption";
import { Required } from "@/components/required";
import { createAssumption } from "@/lib/actions/assumption";

const newAssumptionFormSchema = assumptionFormSchema;
export type NewAssumptionFormValues = z.infer<typeof newAssumptionFormSchema>;

interface NewAssumptionFormProps {
  id: string;
  decisionId: string;
  onSubmittingChange?: (submitting: boolean) => void;
  onSuccess?: (assumption: Assumption) => void;
}

export function NewAssumptionForm({ id, decisionId, onSubmittingChange, onSuccess }: NewAssumptionFormProps) {
  const form = useForm<NewAssumptionFormValues>({
    resolver: zodResolver(newAssumptionFormSchema),
    defaultValues: {
      title: ""
    },
    mode: "onBlur",
    reValidateMode: "onChange"
  });

  async function handleSubmit(values: NewAssumptionFormValues) {
    onSubmittingChange?.(true);
    try {
      const result = await createAssumption({ decisionId, ...values });

      if (!result.success) {
        const { field, message } = result.error;
        if (field === "root") {
          form.setError("root", { type: "custom", message });
        } else {
          form.setError(field, { type: "custom", message }, { shouldFocus: true });
        }
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
        <FieldGroup>
          <div className="grid-col-3 gap-4"></div>
        </FieldGroup>
      </form>
    </Form>
  );
}
