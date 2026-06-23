import { SessionUser } from "@/lib/models/user";
import { User } from "@/lib/models/user";
import { hasRole, isTenant } from "@/lib/policies/policy";

export function canListUsers(actor: SessionUser, accountId: string): boolean {
  return isTenant(actor, accountId) && hasRole(actor, ["admin", "owner", "member"]);
}

export function canViewUser(actor: SessionUser, user: User): boolean {
  return (
    !!user.accountId && isTenant(actor, user.accountId) && (hasRole(actor, ["admin", "owner"]) || actor.id === user.id)
  );
}

export function canCreateUser(actor: SessionUser, accountId: string): boolean {
  return isTenant(actor, accountId) && hasRole(actor, ["admin", "owner"]);
}

export function canUpdateUser(actor: SessionUser, user: User): boolean {
  return (
    !!user.accountId && isTenant(actor, user.accountId) && (hasRole(actor, ["admin", "owner"]) || actor.id === user.id)
  );
}

export function canDeleteUser(actor: SessionUser, user: User): boolean {
  return (
    !!user.accountId && isTenant(actor, user.accountId) && hasRole(actor, ["admin", "owner"]) && actor.id !== user.id
  );
}
