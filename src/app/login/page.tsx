import { Suspense } from "react";
import LoginForm from "@/components/auth/login-form";
import { AuthLoading } from "@/components/ui/loading";

function LoginFormWrapper() {
  return <LoginForm />;
}

export default function LoginPage() {
  return (
    <Suspense fallback={<AuthLoading />}>
      <LoginFormWrapper />
    </Suspense>
  );
}
