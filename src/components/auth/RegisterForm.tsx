"use client"
import { useState } from "react"
import Link from "next/link"

const ROLES = [
  {
    id: "agent" as const,
    label: "Agent",
    desc: "I represent buyers & sellers",
    icon: (
      <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
        <circle cx="12" cy="7" r="4"/>
      </svg>
    ),
  },
  {
    id: "broker" as const,
    label: "Broker",
    desc: "I run a brokerage",
    icon: (
      <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <rect x="2" y="7" width="20" height="14" rx="2"/>
        <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
        <line x1="12" y1="12" x2="12" y2="16"/>
        <line x1="10" y1="14" x2="14" y2="14"/>
      </svg>
    ),
  },
]

export function RegisterForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState<"agent" | "broker">("agent")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [verifyPending, setVerifyPending] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
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

    setVerifyPending(true)
    setLoading(false)
  }

  if (verifyPending) {
    return (
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>✉️</div>
        <div style={{ fontSize: 16, fontWeight: 600, color: "#0b1426", marginBottom: 8 }}>
          Check your email
        </div>
        <div style={{ fontSize: 14, color: "#6b7a99", lineHeight: 1.6, marginBottom: 24 }}>
          We sent a verification link to <strong style={{ color: "#0b1426" }}>{email}</strong>.<br />
          Click the link to activate your account.
        </div>
        <p className="text-sm" style={{ color: "#6b7a99" }}>
          Already verified?{" "}
          <Link href="/login" className="font-semibold" style={{ color: "#1a73e8" }}>
            Sign in
          </Link>
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">

      {/* Role selector */}
      <div className="fade-up fade-up-2">
        <label className="block text-xs font-semibold uppercase tracking-widest mb-2.5"
               style={{ color: "#6b7a99" }}>
          I am a…
        </label>
        <div className="grid grid-cols-2 gap-3">
          {ROLES.map((r) => {
            const active = role === r.id
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => setRole(r.id)}
                className={`role-active relative rounded-xl p-4 text-left border-2 transition-all duration-150 ${
                  active ? "" : "hover:border-slate-300"
                }`}
                style={{
                  borderColor: active ? "#1a73e8" : "#e2e8f4",
                  backgroundColor: active ? "#eef4ff" : "#f8fafd",
                }}
              >
                <div className="mb-2" style={{ color: active ? "#1a73e8" : "#9aacc4" }}>
                  {r.icon}
                </div>
                <div className="text-sm font-bold" style={{ color: active ? "#0b1426" : "#4a5568" }}>
                  {r.label}
                </div>
                <div className="text-xs mt-0.5" style={{ color: active ? "#4a7fd4" : "#9aacc4" }}>
                  {r.desc}
                </div>
                {active && (
                  <div className="absolute top-3 right-3 w-4 h-4 rounded-full flex items-center justify-center"
                       style={{ backgroundColor: "#1a73e8" }}>
                    <svg width="9" height="9" viewBox="0 0 10 8" fill="none">
                      <path d="M1 4l2.5 2.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Divider */}
      <div className="fade-up fade-up-3 flex items-center gap-3">
        <div className="flex-1 h-px" style={{ backgroundColor: "#e2e8f4" }} />
        <span className="text-xs font-medium" style={{ color: "#b0bcd4" }}>your details</span>
        <div className="flex-1 h-px" style={{ backgroundColor: "#e2e8f4" }} />
      </div>

      {/* Email */}
      <div className="fade-up fade-up-3">
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
      <div className="fade-up fade-up-4">
        <label className="block text-xs font-semibold uppercase tracking-widest mb-2"
               style={{ color: "#6b7a99" }}>
          Password
        </label>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Min. 8 characters"
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

        {/* Password strength indicator */}
        {password.length > 0 && (
          <div className="flex gap-1 mt-2">
            {[...Array(4)].map((_, i) => {
              const strength = password.length >= 12 ? 4 : password.length >= 10 ? 3 : password.length >= 8 ? 2 : 1
              return (
                <div key={i} className="h-1 flex-1 rounded-full transition-colors duration-200"
                     style={{
                       backgroundColor: i < strength
                         ? strength >= 3 ? "#22c55e" : strength >= 2 ? "#f59e0b" : "#ef4444"
                         : "#e2e8f4"
                     }} />
              )
            })}
          </div>
        )}
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
      <div className="fade-up fade-up-5 pt-1">
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
              Creating account…
            </span>
          ) : "Create Account"}
        </button>
      </div>

      {/* Footer link */}
      <p className="fade-up fade-up-6 text-center text-sm" style={{ color: "#6b7a99" }}>
        Already have an account?{" "}
        <Link href="/login"
              className="font-semibold transition-colors"
              style={{ color: "#1a73e8" }}>
          Sign in
        </Link>
      </p>
    </form>
  )
}
