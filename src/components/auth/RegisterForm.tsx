"use client"
import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"

export function RegisterForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState<"agent" | "broker">("agent")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !password) { setError("All fields are required"); return }
    if (password.length < 8) { setError("Password must be at least 8 characters"); return }

    setLoading(true)
    setError("")

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, role }),
    })

    if (!res.ok) {
      const data = await res.json()
      setError(data.error ?? "Registration failed")
      setLoading(false)
      return
    }

    await signIn("credentials", { email, password, redirect: false })
    router.push("/onboarding/survey")
    router.refresh()
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
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">I am a…</label>
        <div className="flex gap-3">
          {(["agent", "broker"] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRole(r)}
              className={`flex-1 py-2 rounded border font-medium text-sm capitalize transition-colors ${
                role === r
                  ? "border-[#1a73e8] bg-[#e8f0fe] text-[#1a73e8]"
                  : "border-gray-300 text-gray-600 hover:border-gray-400"
              }`}
            >
              {r.charAt(0).toUpperCase() + r.slice(1)}
            </button>
          ))}
        </div>
      </div>
      {error && <p className="text-[#e53e3e] text-sm">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="bg-[#1a73e8] text-white rounded px-4 py-2 font-semibold text-sm hover:bg-[#1557b0] disabled:opacity-60"
      >
        {loading ? "Creating account…" : "Create Account"}
      </button>
      <p className="text-sm text-gray-500 text-center">
        Already have an account?{" "}
        <Link href="/login" className="text-[#1a73e8] font-medium">
          Sign in
        </Link>
      </p>
    </form>
  )
}
