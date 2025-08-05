"use client";

import React from "react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
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
import { PasswordStrength } from "@/components/ui/password-strength";
import { createAuthSchemas, type SignupFormData } from "@/lib/validations/auth";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { GoogleIcon } from "@/components/ui/google-icon";
import { getAuthCallbackUrl } from "@/lib/utils/site-url";
import { useTranslations, useLocale } from "next-intl";

export default function SignupForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const router = useRouter();
  const t = useTranslations("SignupPage");
  const tValidation = useTranslations("PasswordValidation");
  const locale = useLocale();

  // Create translation-aware validation schema
  const { signupSchema } = createAuthSchemas((key: string) => tValidation(key));

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    mode: "onChange",
  });

  const password = watch("password", "");

  const onSubmit = async (data: SignupFormData) => {
    setIsLoading(true);
    
    try {
      const supabase = createClient();
      
      const { error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: getAuthCallbackUrl(),
        },
      });

      if (error) {
        if (error.message.includes("User already registered")) {
          toast.error(t("userAlreadyExists"));
        } else if (error.message.includes("email not confirmed")) {
          toast.error(t("emailNotConfirmed"));
        } else if (error.message.includes("password")) {
          toast.error(t("passwordTooShort"));
        } else {
          toast.error(t("unexpectedError"));
        }
        return;
      }

      toast.success(t("emailNotConfirmed"));
      router.push(`/${locale}/login?message=Check your email to continue sign up process`);
      
    } catch (err) {
      console.error("Signup error:", err);
      toast.error(t("unexpectedError"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setIsGoogleLoading(true);
    
    try {
      const supabase = createClient();
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: getAuthCallbackUrl(),
        },
      });

      if (error) {
        toast.error(t("googleAuthError"));
      }
    } catch (err) {
      console.error("Google signup error:", err);
      toast.error(t("googleAuthUnexpectedError"));
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-start md:justify-center bg-background px-4 py-8 md:py-0">
      <div className="flex flex-col items-center mb-8 mt-4 md:mt-0">
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
          <CardTitle className="text-2xl text-center">{t("title")}</CardTitle>
          <CardDescription className="text-center">
            {t("subtitle")}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="grid gap-4">
            {/* Email Field */}
            <div className="grid gap-2">
              <Label htmlFor="email">{t("email")}</Label>
              <Input
                id="email"
                type="email"
                placeholder={t("emailPlaceholder")}
                {...register("email")}
                className={errors.email ? "border-red-500" : ""}
              />
              {errors.email && (
                <p className="text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            {/* Password Field */}
            <div className="grid gap-2">
              <Label htmlFor="password">{t("password")}</Label>
              <PasswordInput
                id="password"
                placeholder={t("passwordPlaceholder")}
                {...register("password")}
                className={errors.password ? "border-red-500" : ""}
              />
              {errors.password && (
                <p className="text-sm text-red-600">{errors.password.message}</p>
              )}
              
              {/* Password Strength Indicator */}
              <PasswordStrength password={password} />
            </div>

            {/* Confirm Password Field */}
            <div className="grid gap-2">
              <Label htmlFor="confirmPassword">{t("confirmPassword")}</Label>
              <PasswordInput
                id="confirmPassword"
                placeholder={t("confirmPasswordPlaceholder")}
                {...register("confirmPassword")}
                className={errors.confirmPassword ? "border-red-500" : ""}
              />
              {errors.confirmPassword && (
                <p className="text-sm text-red-600">
                  {errors.confirmPassword.message}
                </p>
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
              {isLoading ? t("signingUp") : t("signUp")}
            </Button>
            
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleGoogleSignup}
              disabled={isLoading || isGoogleLoading}
            >
              {isGoogleLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <GoogleIcon className="mr-2" size={16} />
              )}
              {t("orContinueWith")} Google
            </Button>
            
            <div className="text-center text-sm">
              {t("alreadyHaveAccount")}{" "}
              <Link href={`/${locale}/login`} className="underline hover:text-primary">
                {t("signInHere")}
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
