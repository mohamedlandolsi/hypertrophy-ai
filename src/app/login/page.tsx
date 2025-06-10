import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

async function login(formData: FormData) {
  'use server';
  
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return redirect("/login?message=Could not authenticate user");
  }

  return redirect("/chat");
}

async function signInWithGoogle() {
  'use server';
  
  const supabase = await createClient();
  const redirectTo = process.env.NEXT_PUBLIC_SITE_URL
    ? `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`
    : "/auth/callback";

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
    },
  });

  if (error) {
    console.error("Error signing in with Google:", error);
    return redirect("/login?message=Could not authenticate with Google");
  }

  if (data.url) {
    return redirect(data.url);
  }

  return redirect("/login?message=Could not get Google OAuth URL");
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const params = await searchParams;
  
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Login</CardTitle>
          <CardDescription>
            Enter your email below to login to your account.
          </CardDescription>
        </CardHeader>
        <form>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="m@example.com"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" required />
            </div>
            {params?.message && (
              <p className="text-sm font-medium text-destructive">
                {params.message}
              </p>
            )}
          </CardContent>
          <CardFooter className="flex flex-col gap-4 pt-4">
            <Button formAction={login} className="w-full">
              Sign In
            </Button>
            <Button
              formAction={signInWithGoogle}
              variant="outline"
              className="w-full"
            >
              Sign In with Google
            </Button>            <div className="text-center text-sm">
              Don&apos;t have an account?{" "}
              <a href="/signup" className="underline">
                Sign Up
              </a>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
