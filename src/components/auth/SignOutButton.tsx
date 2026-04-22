"use client"
import { signOut } from "next-auth/react"

export function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-150"
      style={{
        backgroundColor: "rgba(255,255,255,0.08)",
        color: "#8ba8cc",
        border: "1px solid rgba(255,255,255,0.1)",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(255,255,255,0.14)"
        ;(e.currentTarget as HTMLButtonElement).style.color = "#ffffff"
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(255,255,255,0.08)"
        ;(e.currentTarget as HTMLButtonElement).style.color = "#8ba8cc"
      }}
    >
      <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
        <polyline points="16 17 21 12 16 7"/>
        <line x1="21" y1="12" x2="9" y2="12"/>
      </svg>
      Sign out
    </button>
  )
}
