import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { ClaimActions } from "@/components/claim-actions";
import { UserService } from "@/lib/services/userService";
import { redirect } from "next/navigation";

type ClaimPageParams = {
  params: Promise<{ user_id: string }>;
};

export default async function ClaimPage({ params }: ClaimPageParams) {
  const { user_id } = await params;
  const user = await UserService.getWithAccount(user_id);

  if (!user) {
    console.error(`ClaimPage: Could not find user ${user_id}`);
    redirect("/signup");
  }

  if (user.claimedAt) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-muted p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-4xl">
        <Card className="overflow-hidden p-0">
          <CardContent className="grid p-0 md:grid-cols-2">
            <div className="p-6 md:p-8">
              <div className="flex flex-col items-center gap-4 text-center mb-8">
                <h1 className="text-2xl font-bold">Thank you for signing up, {user.firstName}!</h1>
                <p>
                  Please verify your email to continue. We have sent an email to <strong>{user.email}</strong>. Click
                  the link in the email to activate your account.
                </p>
                <ClaimActions email={user.email} />
              </div>
            </div>
            <div className="relative hidden bg-muted md:block">
              <Image
                src="/signup.jpg"
                alt="Image"
                fill={true}
                className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
