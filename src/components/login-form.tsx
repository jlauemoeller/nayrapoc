"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";

type SubmitState = "idle" | "sending" | "sent" | "error";

export function LoginForm({ className, ...props }: React.ComponentProps<"div">) {
  const searchParams = useSearchParams();
  const hasVerificationError = searchParams.get("error") === "Verification";

  const [email, setEmail] = useState("");
  const [state, setState] = useState<SubmitState>("idle");

  async function submitEmail() {
    if (!email) return;
    setState("sending");
    try {
      await signIn("email", { email, redirect: false, callbackUrl: "/start" });
      setState("sent");
    } catch (error) {
      console.error("Failed to send magic link", error);
      setState("error");
    }
  }

  function onSubmit(event: React.ChangeEvent<HTMLFormElement>): void {
    event.preventDefault();
    submitEmail();
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form className="p-6 md:p-8" onSubmit={onSubmit}>
            <FieldGroup>
              <div className="flex flex-col items-center gap-2 text-center">
                <h1 className="text-2xl font-bold">Welcome back</h1>
                <p className="text-balance text-muted-foreground">Login to your nayra account</p>
              </div>
              {hasVerificationError && (
                <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  Your sign-in link is invalid or has expired. Enter your email to request a new one.
                </p>
              )}
              {state === "sent" && (
                <p className="rounded-md bg-muted p-3 text-sm">
                  Check your inbox at <strong>{email}</strong> for a sign-in link.
                </p>
              )}
              {state === "error" && (
                <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  Could not send email. Please try again.
                </p>
              )}
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </Field>
              <Field>
                <Button type="submit" disabled={state === "sending"}>
                  {state === "sending" ? "Sending..." : "Login"}
                </Button>
              </Field>
              <FieldDescription className="text-center">
                Don&apos;t have an account? <Link href="/signup">Sign up</Link>
              </FieldDescription>
            </FieldGroup>
          </form>
          <div className="relative hidden bg-muted md:block">
            <Image
              src="/login.jpg"
              alt="Image"
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
