import EmailProvider from "next-auth/providers/email";
import nodemailer from "nodemailer";
import type { NextAuthOptions } from "next-auth";
import { SignupService } from "@/lib/services/signupService";
import { UserRepository } from "@/lib/repositories/userRepository";
import { UserRole } from "@/lib/models/user";
import { authConfig, appConfig } from "@/lib/config";
import { createAdapter } from "@/lib/auth/adapter";

let _authOptions: NextAuthOptions | null = null;

export function getAuthOptions(): NextAuthOptions {
  if (!_authOptions) {
    _authOptions = {
      adapter: createAdapter(),
      secret: authConfig.secret,

      session: {
        strategy: "jwt"
      },

      pages: {
        signIn: "/login",
        error: "/login"
      },

      providers: [
        EmailProvider({
          server: appConfig.email.configuration.server,
          from: appConfig.email.configuration.from,
          async sendVerificationRequest({ identifier, url, provider }) {
            const host = new URL(url).host;
            const transporter = nodemailer.createTransport(provider.server);
            await transporter.sendMail({
              to: identifier,
              from: provider.from,
              subject: `Sign in to ${host}`,
              text: `Sign in to ${host}\n\n${url}\n\nIf you did not request this email, you can safely ignore it.\n`,
              html: magicLinkEmail({ url, host })
            });
          }
        })
      ],

      callbacks: {
        async jwt({ token, user }) {
          if (user?.email) {
            const record = await UserRepository.getByEmail(user.email);
            if (record) {
              token.id = record.id;
              token.firstName = record.first_name || undefined;
              token.lastName = record.last_name || undefined;
              token.email = record.email;
              token.domain = record.domain;
              token.role = record.role;
              token.accountId = record.account_id ?? "";
            }
          }
          return token;
        },

        async session({ session, token }) {
          session.user = {
            id: token.id as string,
            firstName: token.firstName as string | undefined,
            lastName: token.lastName as string | undefined,
            email: token.email as string,
            domain: token.domain as string,
            role: token.role as UserRole,
            accountId: token.accountId as string
          };
          return session;
        },

        async signIn({ user }) {
          if (!user.email) return false;
          const record = await UserRepository.getByEmail(user.email);
          if (!record) return "/signup";

          if (!record.claimed_at) {
            const result = await SignupService.markClaimed(record.id);
            if (result.isErr()) {
              console.error(`signIn: failed to mark user ${record.id} claimed`, result.error);
              return false;
            }
          }

          return true;
        }
      }
    };
  }
  return _authOptions;
}

function magicLinkEmail({ url, host }: { url: string; host: string }): string {
  const escapedHost = host.replace(/\./g, "&#8203;.");
  return `<!DOCTYPE html>
<html>
  <body style="background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;padding:24px;">
    <table style="max-width:480px;margin:0 auto;background:#fff;border-radius:8px;padding:32px;">
      <tr><td>
        <h1 style="margin:0 0 16px 0;font-size:20px;">Sign in to ${escapedHost}</h1>
        <p style="margin:0 0 24px 0;color:#374151;">Click the button below to sign in. This link will expire shortly.</p>
        <p style="margin:0 0 24px 0;">
          <a href="${url}" style="display:inline-block;background:#111827;color:#fff;text-decoration:none;padding:12px 20px;border-radius:6px;">Sign in</a>
        </p>
        <p style="margin:0;color:#6b7280;font-size:13px;">If you did not request this email, you can safely ignore it.</p>
      </td></tr>
    </table>
  </body>
</html>`;
}
