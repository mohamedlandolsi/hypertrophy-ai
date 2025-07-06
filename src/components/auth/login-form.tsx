"use client";

import React from "react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { PasswordInput } from "@/components/ui/password-input";
import { loginSchema, type LoginFormData } from "@/lib/validations/auth";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { GoogleIcon } from "@/components/ui/google-icon";

export default function LoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const message = searchParams.get("message");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: "onChange",
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    
    try {
      const supabase = createClient();
      
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          toast.error("Invalid email or password. Please check your credentials and try again.");
        } else if (error.message.includes("Email not confirmed")) {
          toast.error("Please check your email and click the confirmation link before signing in.");
        } else {
          toast.error(error.message);
        }
        return;
      }

      toast.success("Welcome back!");
      router.push("/chat");
      
    } catch (err) {
      console.error("Login error:", err);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    
    try {
      const supabase = createClient();
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        toast.error("Could not authenticate with Google");
      }
    } catch (err) {
      console.error("Google sign-in error:", err);
      toast.error("An unexpected error occurred with Google authentication");
    } finally {
      setIsGoogleLoading(false);
    }
  };

  // Show success message if present
  React.useEffect(() => {
    if (message) {
      if (message.includes("Check your email")) {
        toast.success(message);
      } else {
        toast.error(message);
      }
    }
  }, [message]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background">
      <div className="flex flex-col items-center mb-8">
        <Image 
          src="/logo.png" 
          alt="HypertroQ Logo" 
          width={80}
          height={80}
          className="h-16 w-16 md:h-20 md:w-20 object-contain mb-4"
        />
        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          HypertroQ
        </h1>
      </div>
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <Image 
              src="/logo.png" 
              alt="HypertroQ Logo" 
              width={64}
              height={64}
              className="h-16 w-16 object-contain"
            />
          </div>
          <CardTitle className="text-2xl text-center">Welcome Back</CardTitle>
          <CardDescription className="text-center">
            Enter your credentials to access your account.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="grid gap-4">
            {/* Email Field */}
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                {...register("email")}
                className={errors.email ? "border-red-500" : ""}
                autoComplete="email"
              />
              {errors.email && (
                <p className="text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            {/* Password Field */}
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <a 
                  href="/reset-password" 
                  className="text-sm text-muted-foreground hover:text-primary underline"
                >
                  Forgot password?
                </a>
              </div>
              <PasswordInput
                id="password"
                placeholder="Enter your password"
                {...register("password")}
                className={errors.password ? "border-red-500" : ""}
                autoComplete="current-password"
              />
              {errors.password && (
                <p className="text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>
          </CardContent>
          
          <CardFooter className="flex flex-col gap-4 pt-4">
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading || isGoogleLoading}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sign In
            </Button>
            
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleGoogleSignIn}
              disabled={isLoading || isGoogleLoading}
            >
              {isGoogleLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <GoogleIcon className="mr-2" size={16} />
              )}
              Sign In with Google
            </Button>
            
            <div className="text-center text-sm">
              Don&apos;t have an account?{" "}
              <a href="/signup" className="underline hover:text-primary">
                Sign Up
              </a>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
