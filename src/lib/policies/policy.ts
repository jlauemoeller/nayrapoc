import { type UserRole, SessionUser } from "@/lib/models/user";

type AccountRelated = {
  accountId: string;
};

export function sameAccount(actor: SessionUser, resource: AccountRelated): boolean {
  return actor.accountId === resource.accountId;
}

export function hasRole(user: SessionUser, roles: UserRole[]): boolean {
  return roles.includes(user.role);
}

export function isTenant(actor: SessionUser, accountId: string): boolean {
  return actor.domain === "tenant" && actor.accountId === accountId;
}

export function isStaff(actor: SessionUser): boolean {
  return actor.domain === "staff";
}
