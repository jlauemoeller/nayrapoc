"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Field, FieldDescription, FieldGroup } from "@/components/ui/field";
import { Form, FormField, FormLabel, FormControl, FormMessage, FormItem } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { applyActionError } from "@/lib/forms";
import { cn } from "@/lib/utils";
import { signIn } from "next-auth/react";
import { signupTenantUser } from "@/lib/actions/signup";
import { tenantUserSignupSchema, TenantUserSignupInput } from "@/lib/models/user";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";

export function SignupForm({ className, ...props }: React.ComponentProps<"div">) {
  const router = useRouter();

  const form = useForm<TenantUserSignupInput>({
    resolver: zodResolver(tenantUserSignupSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      accountName: ""
    },
    mode: "onBlur",
    reValidateMode: "onChange"
  });

  async function onSubmit(values: TenantUserSignupInput) {
    const result = await signupTenantUser(values);

    if (!result.success) {
      applyActionError(form, result.error);
      return;
    }

    try {
      await signIn("email", { email: values.email, redirect: false, callbackUrl: "/start" });
    } catch (error) {
      console.error("Failed to send magic link after signup", error);
    }

    router.push(`/claim/${result.data.id}`);
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 md:p-8">
              <FieldGroup className="gap-2">
                <div className="flex flex-col items-center gap-2 text-center mb-8">
                  <h1 className="text-2xl font-bold">Create your nayra account</h1>
                  <p className="text-sm text-balance text-muted-foreground">Let&apos;s get to know each other!</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First name</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="John" />
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
                        <FormLabel>Last name</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Doe" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div>
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input {...field} type="email" placeholder="john@example.com" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div>
                  <FormField
                    control={form.control}
                    name="accountName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Account name</FormLabel>
                        <FormControl>
                          <Input {...field} type="text" placeholder="Acme, Inc." />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </FieldGroup>
              <FieldGroup className="mt-2 gap-8">
                <Field>
                  <Button type="submit">Create Account</Button>
                </Field>
                <FieldDescription className="text-center">
                  Already have an account? <Link href="/login">Sign in</Link>
                </FieldDescription>
              </FieldGroup>
            </form>
          </Form>
          <div className="relative hidden bg-muted md:block">
            <Image
              src="/signup.jpg"
              alt=""
              className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
              fill={true}
            />
          </div>
        </CardContent>
      </Card>
      <FieldDescription className="px-6 text-center">
        By clicking continue, you agree to our <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>.
      </FieldDescription>
    </div>
  );
}
