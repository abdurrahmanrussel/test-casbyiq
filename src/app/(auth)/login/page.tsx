import { Suspense } from "react"
import { AuthShell } from "@/components/auth/AuthShell"
import { LoginForm } from "@/components/auth/LoginForm"

export default function LoginPage() {
  return (
    <AuthShell heading="Welcome back" subheading="Sign in to your KasbyIQ account">
      <Suspense>
        <LoginForm />
      </Suspense>
    </AuthShell>
  )
}
