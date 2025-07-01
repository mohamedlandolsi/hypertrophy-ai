import { Suspense } from "react";
import SignupForm from "@/components/auth/signup-form";

function SignupFormWrapper() {
  return <SignupForm />;
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SignupFormWrapper />
    </Suspense>
  );
}
