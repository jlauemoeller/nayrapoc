import { SessionUser } from "@/lib/models/user";
import { cache } from "react";
import { getAuthOptions } from "@/lib/auth/options";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

/**
 * Assert that a policy is true. Example usage:
 *
 * assertAuthorized(canViewFeedbackSource, feedbackSource);
 * assertAuthorized(canCreateFeedbackSource, companyId);
 * assertAuthorized(canDeleteFeedbackSource, feedbackSource);
 *
 * @param policy - The policy to assert.
 * @param params - The parameters to pass to the policy.
 *
 * Redirects to "/login" if policy denies access
 */

export const currentUser = cache(async (): Promise<SessionUser> => {
  const session = await getServerSession(getAuthOptions());
  if (!session?.user) redirect("/login");
  return session.user;
});

export function assertAuthorized<T extends readonly unknown[]>(policy: (...args: T) => boolean, ...params: T): void {
  if (!policy(...params)) {
    console.warn(`Access denied: ${policy.name} for`, params);
    redirect("/login");
  }
}

export function isAuthorized<T extends readonly unknown[]>(policy: (...args: T) => boolean, ...params: T): boolean {
  return policy(...params);
}
