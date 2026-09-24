import { currentSession } from "@/lib/authorization";
import { redirect } from "next/navigation";

export default async function StartPage() {
  const session = await currentSession();

  if (session?.user && session?.user.accountId) {
    redirect("/overview");
  }

  redirect("/login");
}
