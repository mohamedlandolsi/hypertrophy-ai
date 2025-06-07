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

export async function signup(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (password !== confirmPassword) {
    return redirect("/signup?message=Passwords do not match");
  }

  if (password.length < 6) {
    return redirect("/signup?message=Password must be at least 6 characters");
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`
    },
  });

  if (error) {
    return redirect("/signup?message=Could not sign up user: " + error.message);
  }

  return redirect("/signup?message=Check your email to continue sign up process");
}

export async function signInWithGoogle() {
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
    return redirect("/signup?message=Could not authenticate with Google");
  }

  if (data.url) {
    return redirect(data.url);
  }

  return redirect("/signup?message=Could not get Google OAuth URL");
}

export default async function SignupPage({
  searchParams,
}: {
  searchParams?: { message?: string };
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Sign Up</CardTitle>
          <CardDescription>
            Create a new account to get started with AI Coach.
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
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Enter your password"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                required
              />
            </div>
            {searchParams?.message && (
              <p className={`text-sm font-medium ${
                searchParams.message.includes("Check your email") 
                  ? "text-green-600" 
                  : "text-destructive"
              }`}>
                {searchParams.message}
              </p>
            )}
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button formAction={signup} className="w-full">
              Sign Up
            </Button>
            <Button
              formAction={signInWithGoogle}
              variant="outline"
              className="w-full"
            >
              Sign Up with Google
            </Button>
            <div className="text-center text-sm">
              Already have an account?{" "}
              <a href="/login" className="underline">
                Sign In
              </a>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
