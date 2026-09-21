import { currentUser } from "@/lib/authorization";
import { SessionUser, UserRecord } from "@/lib/models/user";
import { AccountRecord } from "@/lib/models/account";

import { vi } from "vitest";

export async function asCurrentUser(actor: SessionUser) {
  vi.mocked(currentUser).mockResolvedValue(actor);
}

export function resetCurrentUser() {
  vi.mocked(currentUser).mockReset();
}

// Build the SessionUser the mocked `currentUser` will return. Defaults to an
// owner in the resource's account (the authorized case); override `accountId`,
// `role` or `id` to construct denial scenarios.
export function actorFor(user: UserRecord, account: AccountRecord, overrides: Partial<SessionUser> = {}): SessionUser {
  return {
    id: user.id,
    email: user.email,
    domain: "tenant",
    role: "owner",
    accountId: account.id,
    ...overrides
  };
}
