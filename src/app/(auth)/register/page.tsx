import { AuthShell } from "@/components/auth/AuthShell"
import { RegisterForm } from "@/components/auth/RegisterForm"

export default function RegisterPage() {
  return (
    <AuthShell heading="Create your account" subheading="Join KasbyIQ — free to get started">
      <RegisterForm />
    </AuthShell>
  )
}
