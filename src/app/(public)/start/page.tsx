import { getAuthOptions } from "@/lib/auth/options";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export default async function StartPage() {
  const session = await getServerSession(getAuthOptions());

  if (session?.user && session?.user.accountId) {
    redirect("/overview");
  }

  redirect("/login");
}
