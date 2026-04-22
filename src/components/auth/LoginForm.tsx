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
  const [showPassword, setShowPassword] = useState(false)
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
      setError("Invalid email or password. Please try again.")
    } else {
      router.push("/onboarding/survey")  // middleware redirects to dashboard if already completed
      router.refresh()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Email */}
      <div className="fade-up fade-up-2">
        <label className="block text-xs font-semibold uppercase tracking-widest mb-2"
               style={{ color: "#6b7a99" }}>
          Email address
        </label>
        <input
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@brokerage.com"
          className="auth-input w-full rounded-xl border px-4 py-3.5 text-sm font-medium placeholder:font-normal"
          style={{
            borderColor: "#e2e8f4",
            backgroundColor: "#f8fafd",
            color: "#0b1426",
          }}
        />
      </div>

      {/* Password */}
      <div className="fade-up fade-up-3">
        <label className="block text-xs font-semibold uppercase tracking-widest mb-2"
               style={{ color: "#6b7a99" }}>
          Password
        </label>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="auth-input w-full rounded-xl border px-4 py-3.5 text-sm font-medium pr-12"
            style={{
              borderColor: "#e2e8f4",
              backgroundColor: "#f8fafd",
              color: "#0b1426",
            }}
          />
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 rounded"
            style={{ color: "#9aacc4" }}
          >
            {showPassword ? (
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                <line x1="1" y1="1" x2="23" y2="23"/>
              </svg>
            ) : (
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="fade-up flex items-center gap-2.5 rounded-xl px-4 py-3 text-sm font-medium"
             style={{ backgroundColor: "#fff1f1", color: "#c0392b", border: "1px solid #fecaca" }}>
          <svg width="15" height="15" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-.75-5.25a.75.75 0 001.5 0v-4a.75.75 0 00-1.5 0v4zm.75 2.5a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd"/>
          </svg>
          {error}
        </div>
      )}

      {/* Submit */}
      <div className="fade-up fade-up-4 pt-1">
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl py-3.5 text-sm font-bold tracking-wide text-white transition-all duration-150 disabled:opacity-60"
          style={{
            backgroundColor: loading ? "#3d6bb3" : "#0b1426",
            boxShadow: loading ? "none" : "0 4px 14px rgba(11,20,38,0.25)",
          }}
          onMouseEnter={(e) => {
            if (!loading) (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#1a3a6e"
          }}
          onMouseLeave={(e) => {
            if (!loading) (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#0b1426"
          }}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin" width="16" height="16" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
              </svg>
              Signing in…
            </span>
          ) : "Sign In"}
        </button>
      </div>

      {/* Footer link */}
      <p className="fade-up fade-up-5 text-center text-sm" style={{ color: "#6b7a99" }}>
        No account?{" "}
        <Link href="/register"
              className="font-semibold transition-colors"
              style={{ color: "#1a73e8" }}>
          Create one
        </Link>
      </p>
    </form>
  )
}
