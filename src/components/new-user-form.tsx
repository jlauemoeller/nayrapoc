"use client";

import { FieldGroup } from "@/components/ui/field";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Required } from "@/components/required";
import { User, tenantUserFormSchema } from "@/lib/models/user";
import { applyActionError } from "@/lib/forms";
import { createTenantUser } from "@/lib/actions/user";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

export type NewTenantUserFormValues = z.infer<typeof tenantUserFormSchema>;

interface NewUserFormProps {
  id: string;
  accountId: string;
  onSubmittingChange?: (submitting: boolean) => void;
  onSuccess?: (user: User) => void;
}

export function NewUserForm({ id, accountId, onSubmittingChange, onSuccess }: NewUserFormProps) {
  const form = useForm<NewTenantUserFormValues>({
    resolver: zodResolver(tenantUserFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: ""
    },
    mode: "onBlur",
    reValidateMode: "onChange"
  });

  async function handleSubmit(values: NewTenantUserFormValues) {
    onSubmittingChange?.(true);
    try {
      const result = await createTenantUser({ accountId, ...values });

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
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  First name <Required />
                </FormLabel>
                <FormControl>
                  <Input {...field} type="text" placeholder="John" autoComplete="off" autoFocus data-1p-ignore />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Last name <Required />
                </FormLabel>
                <FormControl>
                  <Input {...field} type="text" placeholder="Decider" autoComplete="off" autoFocus data-1p-ignore />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Email <Required />
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="email"
                    placeholder="jon@example.com"
                    autoComplete="off"
                    autoFocus
                    data-1p-ignore
                  />
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
