import { Suspense } from "react";
import SignupForm from "@/components/auth/signup-form";
import { AuthLoading } from "@/components/ui/loading";

function SignupFormWrapper() {
  return <SignupForm />;
}

export default function SignupPage() {
  return (
    <Suspense fallback={<AuthLoading />}>
      <SignupFormWrapper />
    </Suspense>
  );
}
