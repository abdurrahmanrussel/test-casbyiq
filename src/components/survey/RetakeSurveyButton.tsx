"use client"
import { useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"

export function RetakeSurveyButton() {
  const [loading, setLoading] = useState(false)
  const { update } = useSession()
  const router = useRouter()

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
      className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-150 disabled:opacity-50"
      style={{
        backgroundColor: "rgba(26,115,232,0.1)",
        color: "#1a73e8",
        border: "1px solid rgba(26,115,232,0.2)",
      }}
      onMouseEnter={(e) => {
        if (!loading) (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(26,115,232,0.18)"
      }}
      onMouseLeave={(e) => {
        if (!loading) (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(26,115,232,0.1)"
      }}
    >
      <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
        <path d="M3 3v5h5"/>
      </svg>
      {loading ? "Resetting…" : "Retake survey"}
    </button>
  )
}
