"use client"
import { signOut } from "next-auth/react"

export function SignOutButton({ variant = "dark" }: { variant?: "dark" | "light" }) {
  const styles = variant === "light"
    ? { bg: "transparent", color: "#6b6a66", border: "1px solid rgba(0,0,0,0.14)", hoverBg: "#f2f1ee", hoverColor: "#1a1916" }
    : { bg: "rgba(255,255,255,0.08)", color: "#8ba8cc", border: "1px solid rgba(255,255,255,0.1)", hoverBg: "rgba(255,255,255,0.14)", hoverColor: "#ffffff" }

  return (
    <button
      onClick={() => signOut({ callbackUrl: "/login" })}
      style={{ display: "inline-flex", alignItems: "center", gap: 6, borderRadius: 6, padding: "5px 12px", fontSize: 13, fontFamily: "inherit", cursor: "pointer", backgroundColor: styles.bg, color: styles.color, border: styles.border, transition: "all 0.15s" }}
      onMouseEnter={e => { e.currentTarget.style.backgroundColor = styles.hoverBg; e.currentTarget.style.color = styles.hoverColor }}
      onMouseLeave={e => { e.currentTarget.style.backgroundColor = styles.bg; e.currentTarget.style.color = styles.color }}
    >
      <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
        <polyline points="16 17 21 12 16 7"/>
        <line x1="21" y1="12" x2="9" y2="12"/>
      </svg>
      Sign out
    </button>
  )
}
