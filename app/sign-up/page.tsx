import { AuthForms } from "@/components/auth-forms"

// AuthForms renders its own light-themed Suspense fallback (inside AuthShell).
export default function SignUpPage() {
  return <AuthForms defaultTab="signup" />
}
