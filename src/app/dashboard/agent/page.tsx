import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"

type ScoreKey = "gritScore" | "selfRegScore" | "eiScore" | "autonomyScore" | "competenceScore" | "relatednessScore"

const DIMENSION_INFO: Record<ScoreKey, { label: string; description: string }> = {
  gritScore:        { label: "Follow-through",   description: "You stay with tasks even when results are slow. This is one of your strongest signals." },
  selfRegScore:     { label: "Business systems",  description: "You have structure in place. Strengthening your CRM habits is your next leverage point." },
  eiScore:          { label: "Client connection", description: "Clients feel heard when working with you. This is a clear competitive edge." },
  autonomyScore:    { label: "Independent drive", description: "You work well on your own and own your outcomes. Self-direction comes naturally." },
  competenceScore:  { label: "Skill confidence",  description: "Your confidence is growing. Tracking small wins will reinforce what's already working." },
  relatednessScore: { label: "Team connection",   description: "You draw energy from your work relationships. This supports long-term momentum." },
}

const SCORE_KEYS: ScoreKey[] = ["gritScore","selfRegScore","eiScore","autonomyScore","competenceScore","relatednessScore"]

function scoreColor(s: number) {
  if (s >= 70) return "#3B6D11"
  if (s >= 50) return "#BA7517"
  return "#E24B4A"
}

function barColor(s: number) {
  if (s >= 70) return "#639922"
  if (s >= 50) return "#BA7517"
  return "#E24B4A"
}

function displayName(email: string) {
  const prefix = email.split("@")[0]
  return prefix.charAt(0).toUpperCase() + prefix.slice(1)
}

export default async function AgentDashboard() {
  const session = await auth()
  if (!session) redirect("/login")

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { scoreResult: true, broker: true },
  })
  if (!user) redirect("/login")

  const dayCount = Math.floor((Date.now() - new Date(user.createdAt).getTime()) / 86_400_000)
  const score = user.scoreResult

  return (
    <div style={{ background: "#f7f6f3", minHeight: "100vh" }}>
      <nav style={{ background: "#fff", borderBottom: "1px solid rgba(0,0,0,0.09)", padding: "0 32px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 56, position: "sticky", top: 0, zIndex: 100 }}>
        <span style={{ fontFamily: "var(--font-dm-mono, monospace)", fontSize: 15, fontWeight: 500, color: "#1a1916" }}>
          Kasby<span style={{ color: "#639922" }}>IQ</span>
        </span>
        <span style={{ fontSize: 11, color: "#9c9b97", background: "#f2f1ee", padding: "4px 10px", borderRadius: 20, border: "1px solid rgba(0,0,0,0.09)" }}>
          Agent
        </span>
      </nav>

      <main style={{ padding: "24px 32px 48px", maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 500, color: "#1a1916" }}>Welcome back, {displayName(user.email)}</h1>
          <p style={{ fontSize: 13, color: "#6b6a66", marginTop: 3 }}>Your growth journey · Day {dayCount}</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", border: "1px solid rgba(0,0,0,0.14)", borderRadius: 10, overflow: "hidden", marginBottom: 24 }}>
          <JourneyStep status="done"  label="Step 1 · Complete"   title="Your starting point"   date={`Completed ${new Date(user.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`} last={false} />
          <JourneyStep status="next"  label="Step 2 · Up next"    title="90-day check-in"       date="Due at day 90"        last={false} />
          <JourneyStep status="later" label="Step 3 · Coming soon" title="180-day check-in"     date="Unlocks after step 2" last={true} />
        </div>

        {score ? (
          <>
            <h2 style={{ fontSize: 15, fontWeight: 500, color: "#1a1916", marginBottom: 4 }}>Your growth areas</h2>
            <p style={{ fontSize: 13, color: "#6b6a66", marginBottom: 18, lineHeight: 1.6 }}>
              These six areas shape how you work. Your scores reflect patterns from your baseline survey — not your ceiling.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 20 }}>
              {SCORE_KEYS.map(key => {
                const s = score[key]
                const info = DIMENSION_INFO[key]
                return (
                  <div key={key} style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.09)", borderRadius: 10, padding: "16px 18px" }}>
                    <div style={{ fontSize: 11, color: "#6b6a66", marginBottom: 4 }}>{info.label}</div>
                    <div style={{ fontSize: 24, fontWeight: 500, color: scoreColor(s), marginBottom: 6 }}>{Math.round(s)}</div>
                    <div style={{ height: 6, background: "#eae9e5", borderRadius: 3, marginBottom: 12, overflow: "hidden" }}>
                      <div style={{ width: `${s}%`, height: 6, background: barColor(s), borderRadius: 3 }} />
                    </div>
                    <div style={{ fontSize: 12, color: "#6b6a66", lineHeight: 1.6 }}>{info.description}</div>
                  </div>
                )
              })}
            </div>
          </>
        ) : (
          <div style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.09)", borderRadius: 10, padding: "24px 18px", color: "#6b6a66", textAlign: "center" }}>
            Complete your survey to see your growth areas.
          </div>
        )}

        {user.broker && (
          <div style={{ background: "#E6F1FB", border: "1px solid #B5D4F4", borderRadius: 10, padding: "16px 18px" }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#0C447C", marginBottom: 5 }}>From your broker</div>
            <div style={{ fontSize: 13, color: "#185FA5", lineHeight: 1.65 }}>
              Your next check-in will be available at day 90. We&apos;ll send you a heads-up a few days before — no pressure, just a reminder.
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

function JourneyStep({ status, label, title, date, last }: {
  status: "done" | "next" | "later"
  label: string
  title: string
  date: string
  last: boolean
}) {
  const theme = {
    done:  { bg: "#EAF3DE", labelColor: "#2A5200", titleColor: "#1a1916", dateColor: "#6b6a66" },
    next:  { bg: "#FFF8EC", labelColor: "#7A4A00", titleColor: "#1a1916", dateColor: "#7A4A00" },
    later: { bg: "#f2f1ee", labelColor: "#9c9b97", titleColor: "#6b6a66", dateColor: "#9c9b97" },
  }[status]

  return (
    <div style={{ padding: "16px 18px", background: theme.bg, borderRight: last ? "none" : "1px solid rgba(0,0,0,0.14)" }}>
      <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.4px", color: theme.labelColor, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 500, color: theme.titleColor }}>{title}</div>
      <div style={{ fontSize: 12, marginTop: 3, color: theme.dateColor }}>{date}</div>
    </div>
  )
}
