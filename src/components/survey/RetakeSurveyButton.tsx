"use client"
import { useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"

export function RetakeSurveyButton({ variant = "dark" }: { variant?: "dark" | "light" }) {
  const [loading, setLoading] = useState(false)
  const { update } = useSession()
  const router = useRouter()

  const styles = variant === "light"
    ? { bg: "transparent", color: "#6b6a66", border: "1px solid rgba(0,0,0,0.14)", hoverBg: "#f2f1ee", hoverColor: "#1a1916" }
    : { bg: "rgba(26,115,232,0.1)", color: "#1a73e8", border: "1px solid rgba(26,115,232,0.2)", hoverBg: "rgba(26,115,232,0.18)", hoverColor: "#1a73e8" }

  async function handleReset() {
    setLoading(true)
    await fetch("/api/survey/reset", { method: "POST" })
    await update({ surveyCompleted: false })
    router.push("/onboarding/survey")
    router.refresh()
  }

  return (
    <button
      onClick={handleReset}
      disabled={loading}
      style={{ display: "inline-flex", alignItems: "center", gap: 6, borderRadius: 6, padding: "5px 12px", fontSize: 13, fontFamily: "inherit", cursor: loading ? "default" : "pointer", opacity: loading ? 0.5 : 1, backgroundColor: styles.bg, color: styles.color, border: styles.border, transition: "all 0.15s" }}
      onMouseEnter={e => { if (!loading) { e.currentTarget.style.backgroundColor = styles.hoverBg; e.currentTarget.style.color = styles.hoverColor } }}
      onMouseLeave={e => { if (!loading) { e.currentTarget.style.backgroundColor = styles.bg; e.currentTarget.style.color = styles.color } }}
    >
      <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
        <path d="M3 3v5h5"/>
      </svg>
      {loading ? "Resetting…" : "Retake survey"}
    </button>
  )
}
