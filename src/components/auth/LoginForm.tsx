"use client"
import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"

export function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email) { setError("Email is required"); return }
    if (!password) { setError("Password is required"); return }

    setLoading(true)
    setError("")

    const res = await signIn("credentials", { email, password, redirect: false })

    setLoading(false)

    if (res?.error) {
      setError("Invalid email or password")
    } else {
      router.push("/onboarding/survey")
      router.refresh()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full max-w-sm">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#1a73e8]"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#1a73e8]"
        />
      </div>
      {error && <p className="text-[#e53e3e] text-sm">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="bg-[#1a73e8] text-white rounded px-4 py-2 font-semibold text-sm hover:bg-[#1557b0] disabled:opacity-60"
      >
        {loading ? "Signing in…" : "Sign In"}
      </button>
      <p className="text-sm text-gray-500 text-center">
        No account?{" "}
        <Link href="/register" className="text-[#1a73e8] font-medium">
          Register
        </Link>
      </p>
    </form>
  )
}
