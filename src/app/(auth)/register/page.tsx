import { RegisterForm } from "@/components/auth/RegisterForm"

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-xl shadow-md px-8 py-10 w-full max-w-sm">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Create account</h1>
        <p className="text-sm text-gray-500 mb-6">Join KasbyIQ</p>
        <RegisterForm />
      </div>
    </div>
  )
}
