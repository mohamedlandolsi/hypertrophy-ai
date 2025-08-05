import { z } from "zod";

// Translation-aware validation schemas
export const createAuthSchemas = (t: (key: string) => string) => {
  // Base email validation
  const emailSchema = z
    .string()
    .min(1, t("emailRequired"))
    .email(t("validEmail"));

  // Password validation with strength requirements
  const passwordSchema = z
    .string()
    .min(8, t("passwordMinLength"))
    .regex(/[A-Z]/, t("passwordUppercase"))
    .regex(/[a-z]/, t("passwordLowercase"))
    .regex(/\d/, t("passwordNumber"))
    .regex(
      /[!@#$%^&*(),.?":{}|<>]/,
      t("passwordSpecialChar")
    );

  // Login form validation
  const loginSchema = z.object({
    email: emailSchema,
    password: z.string().min(1, t("passwordRequired")),
  });

  // Signup form validation
  const signupSchema = z
    .object({
      email: emailSchema,
      password: passwordSchema,
      confirmPassword: z.string().min(1, t("confirmPasswordRequired")),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t("passwordsDoNotMatch"),
      path: ["confirmPassword"],
    });

  // Password reset validation
  const resetPasswordSchema = z.object({
    email: emailSchema,
  });

  // Change password validation
  const changePasswordSchema = z
    .object({
      currentPassword: z.string().min(1, t("currentPasswordRequired")),
      newPassword: passwordSchema,
      confirmPassword: z.string().min(1, t("confirmNewPasswordRequired")),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: t("passwordsDoNotMatch"),
      path: ["confirmPassword"],
    });

  return {
    emailSchema,
    passwordSchema,
    loginSchema,
    signupSchema,
    resetPasswordSchema,
    changePasswordSchema,
  };
};

// Default schemas with English messages (for backward compatibility)
const emailSchema = z
  .string()
  .min(1, "Email is required")
  .email("Please enter a valid email address");

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/\d/, "Password must contain at least one number")
  .regex(
    /[!@#$%^&*(),.?":{}|<>]/,
    "Password must contain at least one special character"
  );

// Default login form validation
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});

// Default signup form validation
export const signupSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

// Default password reset validation
export const resetPasswordSchema = z.object({
  email: emailSchema,
});

// Default change password validation
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

// Type exports
export type LoginFormData = z.infer<typeof loginSchema>;
export type SignupFormData = z.infer<typeof signupSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

// Helper function to get password strength
export const getPasswordStrength = (password: string): number => {
  if (password.length === 0) return 0;
  
  let score = 0;
  
  // Length check
  if (password.length >= 8) score += 20;
  if (password.length >= 12) score += 10;
  
  // Character variety checks
  if (/[A-Z]/.test(password)) score += 20;
  if (/[a-z]/.test(password)) score += 20;
  if (/\d/.test(password)) score += 20;
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 20;
  
  return Math.min(score, 100);
};

// Helper function to validate email format
export const isValidEmail = (email: string): boolean => {
  try {
    emailSchema.parse(email);
    return true;
  } catch {
    return false;
  }
};

// Helper function to check if password meets requirements
export const isStrongPassword = (password: string): boolean => {
  try {
    passwordSchema.parse(password);
    return true;
  } catch {
    return false;
  }
};
