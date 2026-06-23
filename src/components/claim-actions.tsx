"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { signIn } from "next-auth/react";
import { useState } from "react";

type ClaimActionsProps = {
  email: string;
};

type ResendState = "idle" | "sending" | "sent" | "error";

export function ClaimActions({ email }: ClaimActionsProps) {
  const [state, setState] = useState<ResendState>("idle");

  async function handleResend() {
    setState("sending");
    try {
      await signIn("email", { email, redirect: false, callbackUrl: `/start` });
      setState("sent");
    } catch {
      setState("error");
    }
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <Button type="button" onClick={handleResend} disabled={state === "sending"}>
        {state === "sending" ? "Sending..." : "Resend email"}
      </Button>
      {state === "sent" && <p className="text-sm text-muted-foreground">Email sent. Check your inbox.</p>}
      {state === "error" && <p className="text-sm text-destructive">Could not send email. Please try again.</p>}
      <Link className="text-sm underline" href="/signup">
        Cancel and go back
      </Link>
    </div>
  );
}
