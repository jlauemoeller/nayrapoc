import type { SessionUser } from "@/lib/models/user";

declare module "next-auth" {
  interface Session {
    user: SessionUser;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    firstName?: string;
    lastName?: string;
    domain: string;
    role: string;
    accountId: string;
  }
}
