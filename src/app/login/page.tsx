'use server';

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

export async function login(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const supabase = await createClient(); // Await the client creation

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return redirect("/login?message=Could not authenticate user");
  }

  return redirect("/dashboard");
}



export async function signInWithGoogle() {
  const supabase = await createClient(); // Await the client creation
  // Get redirect URL from environment or construct dynamically
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
    return redirect(data.url); // Redirect to Google's OAuth page
  }

  return redirect("/login?message=Could not get Google OAuth URL");
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: { message?: string };
}) {
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
            {searchParams?.message && (
              <p className="text-sm font-medium text-destructive">
                {searchParams.message}
              </p>
            )}
          </CardContent>          <CardFooter className="flex flex-col gap-4">
            <Button formAction={login} className="w-full">
              Sign In
            </Button>
            <Button
              formAction={signInWithGoogle}
              variant="outline"
              className="w-full"
            >
              Sign In with Google
            </Button>
            <div className="text-center text-sm">
              Don't have an account?{" "}
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
