import type { Adapter, AdapterUser, VerificationToken } from "next-auth/adapters";
import type { UserRecord } from "@/lib/models/user";
import { UserRepository } from "@/lib/repositories/userRepository";
import { db } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { generateId } from "@/lib/db/uuid";
import { users, verificationTokens } from "@/lib/db/schema";

function toAdapterUser(record: UserRecord): AdapterUser {
  return {
    id: record.id,
    email: record.email,
    emailVerified: null,
    name: [record.first_name, record.last_name].filter(Boolean).join(" ") || null
  };
}

export function createAdapter(): Adapter {
  return {
    async createUser(data: Omit<AdapterUser, "id">): Promise<AdapterUser> {
      const id = generateId();
      const [record] = await db
        .insert(users)
        .values({
          id,
          email: data.email.toLowerCase().trim(),
          first_name: "",
          last_name: ""
        })
        .returning();
      return toAdapterUser(record);
    },

    async getUser(id: string): Promise<AdapterUser | null> {
      const record = await UserRepository.get(id);
      return record ? toAdapterUser(record) : null;
    },

    async getUserByEmail(email: string): Promise<AdapterUser | null> {
      const record = await UserRepository.getByEmail(email.toLowerCase().trim());
      return record ? toAdapterUser(record) : null;
    },

    async getUserByAccount() {
      return null;
    },

    async updateUser(data: Partial<AdapterUser> & Pick<AdapterUser, "id">): Promise<AdapterUser> {
      if (!data.id) throw new Error("User id is required for update");

      const updates: Partial<{ email: string; first_name: string; last_name: string }> = {};

      if (data.email) updates.email = data.email.toLowerCase().trim();

      if (data.name) {
        const [first, ...rest] = data.name.split(" ");
        updates.first_name = first;
        updates.last_name = rest.join(" ");
      }

      const result = await UserRepository.update(data.id, updates);

      if (result.isOk()) {
        return toAdapterUser(result.value);
      }

      throw new Error(`Failed to update user: ${result.error}`);
    },

    async createVerificationToken(data: VerificationToken): Promise<VerificationToken> {
      const [token] = await db
        .insert(verificationTokens)
        .values({
          identifier: data.identifier,
          token: data.token,
          expires: data.expires
        })
        .returning();
      return token;
    },

    async useVerificationToken({
      identifier,
      token
    }: {
      identifier: string;
      token: string;
    }): Promise<VerificationToken | null> {
      const [result] = await db
        .delete(verificationTokens)
        .where(and(eq(verificationTokens.identifier, identifier), eq(verificationTokens.token, token)))
        .returning();
      return result ?? null;
    },

    async linkAccount() {
      return undefined;
    },
    async unlinkAccount() {
      return undefined;
    },
    async createSession() {
      return null as never;
    },
    async getSessionAndUser() {
      return null;
    },
    async updateSession() {
      return null;
    },
    async deleteSession() {
      return undefined;
    }
  };
}
