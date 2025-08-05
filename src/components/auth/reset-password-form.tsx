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
import { createAuthSchemas, type ResetPasswordFormData } from "@/lib/validations/auth";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, ArrowLeft } from "lucide-react";
import { getAuthCallbackUrl } from "@/lib/utils/site-url";
import { useTranslations, useLocale } from "next-intl";

export default function ResetPasswordForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const router = useRouter();
  const t = useTranslations("ResetPasswordPage");
  const tValidation = useTranslations("PasswordValidation");
  const locale = useLocale();

  // Create translation-aware validation schema
  const { resetPasswordSchema } = createAuthSchemas((key: string) => tValidation(key));

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    mode: "onChange",
  });

  const onSubmit = async (data: ResetPasswordFormData) => {
    setIsLoading(true);
    
    try {
      const supabase = createClient();
      
      const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: getAuthCallbackUrl('/update-password'),
      });

      if (error) {
        if (error.message.includes("User not found")) {
          toast.error(t("noAccountFound"));
        } else {
          toast.error(t("unexpectedError"));
        }
        return;
      }

      setEmailSent(true);
      toast.success(t("resetLinkSent"));
      
    } catch (err) {
      console.error("Reset password error:", err);
      toast.error(t("unexpectedError"));
    } finally {
      setIsLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-start md:justify-center bg-background px-4 py-8 md:py-0">
        <Card className="w-full max-w-md mt-16 md:mt-0">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">{t("checkEmailTitle")}</CardTitle>
            <CardDescription>
              {t("checkEmailSubtitle")}{" "}
              <span className="font-medium">{getValues("email")}</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground">
              {t("linkExpiresInfo")}
            </p>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => router.push(`/${locale}/login`)}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t("backToSignIn")}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() => setEmailSent(false)}
            >
              {t("tryAnotherEmail")}
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-start md:justify-center bg-background px-4 py-8 md:py-0">
      <Card className="w-full max-w-md mt-16 md:mt-0">
        <CardHeader>
          <CardTitle className="text-2xl">{t("title")}</CardTitle>
          <CardDescription>
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
                autoComplete="email"
                autoFocus
              />
              {errors.email && (
                <p className="text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>
          </CardContent>
          
          <CardFooter className="flex flex-col gap-4 pt-4">
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? t("sendingLink") : t("sendResetLink")}
            </Button>
            
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => router.push(`/${locale}/login`)}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t("backToSignIn")}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
