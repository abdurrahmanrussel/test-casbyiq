import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { SignOutButton } from "@/components/auth/SignOutButton"

export default async function BrokerDashboard() {
  const session = await auth()
  if (!session) redirect("/login")

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#f4f7fc" }}>
      {/* Top nav */}
      <header className="border-b" style={{ backgroundColor: "#0b1426", borderColor: "rgba(255,255,255,0.07)" }}>
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md flex items-center justify-center" style={{ backgroundColor: "#1a73e8" }}>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <rect x="2" y="8" width="3" height="6" rx="1" fill="white" />
                <rect x="6.5" y="5" width="3" height="9" rx="1" fill="white" />
                <rect x="11" y="2" width="3" height="12" rx="1" fill="white" />
              </svg>
            </div>
            <span className="font-bold text-base tracking-tight" style={{ color: "#ffffff" }}>KasbyIQ</span>
            <span className="text-xs px-2 py-0.5 rounded-full font-semibold ml-1"
                  style={{ backgroundColor: "rgba(26,115,232,0.2)", color: "#5b9cf6" }}>
              Broker
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm hidden sm:block" style={{ color: "#8ba8cc" }}>{session.user.email}</span>
            <SignOutButton />
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-6 py-16">
        <div className="mb-10">
          <h1 className="text-3xl font-extrabold tracking-tight" style={{ color: "#0b1426" }}>
            Broker Dashboard
          </h1>
          <p className="mt-2 text-sm" style={{ color: "#6b7a99" }}>
            Your brokerage fit analytics and agent pipeline.
          </p>
        </div>

        {/* Placeholder cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {[
            { label: "Agents Assessed", value: "—", note: "Coming in Phase 2" },
            { label: "Avg Fit Score", value: "—", note: "Coming in Phase 2" },
            { label: "Coaching Queued", value: "—", note: "Coming in Phase 2" },
          ].map((card) => (
            <div key={card.label} className="rounded-2xl p-6 border"
                 style={{ backgroundColor: "#ffffff", borderColor: "#e2e8f4" }}>
              <div className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "#9aacc4" }}>
                {card.label}
              </div>
              <div className="text-4xl font-extrabold" style={{ color: "#0b1426" }}>{card.value}</div>
              <div className="text-xs mt-1.5" style={{ color: "#b0bcd4" }}>{card.note}</div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
