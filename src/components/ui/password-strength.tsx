"use client";

import React from "react";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

interface PasswordStrengthProps {
  password: string;
  className?: string;
}

interface PasswordRequirement {
  labelKey: string;
  test: (password: string) => boolean;
}

const getPasswordRequirements = (): PasswordRequirement[] => [
  {
    labelKey: "uppercase",
    test: (password: string) => /[A-Z]/.test(password),
  },
  {
    labelKey: "lowercase", 
    test: (password: string) => /[a-z]/.test(password),
  },
  {
    labelKey: "number",
    test: (password: string) => /\d/.test(password),
  },
  {
    labelKey: "specialChar",
    test: (password: string) => /[!@#$%^&*(),.?":{}|<>]/.test(password),
  },
  {
    labelKey: "eightChars",
    test: (password: string) => password.length >= 8,
  },
];

const getPasswordStrength = (password: string, t: (key: string) => string): { score: number; label: string; color: string } => {
  if (password.length === 0) {
    return { score: 0, label: "", color: "" };
  }

  const requirements = getPasswordRequirements();
  const metRequirements = requirements.filter(req => req.test(password)).length;
  
  if (metRequirements <= 2) {
    return { score: 25, label: t("veryWeak"), color: "bg-red-500" };
  } else if (metRequirements === 3) {
    return { score: 50, label: t("weak"), color: "bg-orange-500" };
  } else if (metRequirements === 4) {
    return { score: 75, label: t("good"), color: "bg-yellow-500" };
  } else {
    return { score: 100, label: t("strong"), color: "bg-green-500" };
  }
};

export function PasswordStrength({ password, className }: PasswordStrengthProps) {
  const t = useTranslations("PasswordValidation");
  const strength = getPasswordStrength(password, t);
  const passwordRequirements = getPasswordRequirements();

  if (password.length === 0) {
    return null;
  }

  return (
    <div className={cn("space-y-3", className)}>
      {/* Password strength bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">{t("passwordStrength")}</span>
          <span className={cn(
            "font-medium",
            strength.score <= 25 ? "text-red-600" :
            strength.score <= 50 ? "text-orange-600" :
            strength.score <= 75 ? "text-yellow-600" :
            "text-green-600"
          )}>
            {strength.label}
          </span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={cn("h-full transition-all duration-300", strength.color)}
            style={{ width: `${strength.score}%` }}
          />
        </div>
      </div>

      {/* Password requirements checklist */}
      <div className="grid grid-cols-2 gap-2">
        {passwordRequirements.map((requirement, index) => {
          const isMet = requirement.test(password);
          return (
            <div key={index} className="flex items-center gap-2 text-xs">
              {isMet ? (
                <Check className="h-3 w-3 text-green-600" />
              ) : (
                <X className="h-3 w-3 text-red-600" />
              )}
              <span className={cn(
                "text-xs",
                isMet ? "text-green-600" : "text-red-600"
              )}>
                {t(requirement.labelKey)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
