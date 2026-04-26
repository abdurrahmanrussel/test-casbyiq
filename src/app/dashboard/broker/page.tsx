import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { ManageAgents } from "@/components/dashboard/ManageAgents"

type ScoreKey = "gritScore" | "selfRegScore" | "eiScore" | "autonomyScore" | "competenceScore" | "relatednessScore"

const DIM_LABELS: Record<ScoreKey, string> = {
  gritScore:        "Grit",
  selfRegScore:     "Self-regulation",
  eiScore:          "Emotional intelligence",
  autonomyScore:    "Autonomy",
  competenceScore:  "Competence",
  relatednessScore: "Relatedness",
}

const DIM_KEYS: ScoreKey[] = ["gritScore","selfRegScore","eiScore","autonomyScore","competenceScore","relatednessScore"]

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

function avatarColor(s: number): { border: string; bg: string; text: string } {
  if (s >= 70) return { border: "#639922", bg: "#EAF3DE", text: "#3B6D11" }
  if (s >= 50) return { border: "#BA7517", bg: "#FAEEDA", text: "#633806" }
  return { border: "#E24B4A", bg: "#FCEBEB", text: "#501313" }
}

function initials(email: string) {
  return email.slice(0, 2).toUpperCase()
}

function daysSince(createdAt: Date) {
  return Math.floor((Date.now() - new Date(createdAt).getTime()) / 86_400_000)
}

type ScoreDims = Pick<{ [K in ScoreKey]: number }, ScoreKey>

function hasCoachingFlag(score: ScoreDims) {
  return DIM_KEYS.some(k => score[k] < 50)
}

export default async function BrokerDashboard() {
  const session = await auth()
  if (!session) redirect("/login")

  const agents = await prisma.user.findMany({
    where: { brokerId: session.user.id },
    include: { scoreResult: true },
    orderBy: { createdAt: "asc" },
  })

  const completed = agents.filter(a => a.scoreResult)
  const avgFit = completed.length > 0
    ? Math.round(completed.reduce((s, a) => s + a.scoreResult!.overallScore, 0) / completed.length)
    : null
  const flags = completed.filter(a => hasCoachingFlag(a.scoreResult!)).length

  return (
    <div style={{ background: "#f7f6f3", minHeight: "100vh" }}>
      <nav style={{ background: "#fff", borderBottom: "1px solid rgba(0,0,0,0.09)", padding: "0 32px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 56, position: "sticky", top: 0, zIndex: 100 }}>
        <span style={{ fontFamily: "var(--font-dm-mono, monospace)", fontSize: 15, fontWeight: 500, color: "#1a1916" }}>
          Kasby<span style={{ color: "#639922" }}>IQ</span>
        </span>
        <span style={{ fontSize: 11, color: "#9c9b97", background: "#f2f1ee", padding: "4px 10px", borderRadius: 20, border: "1px solid rgba(0,0,0,0.09)" }}>
          Broker
        </span>
      </nav>

      <main style={{ padding: "24px 32px 48px", maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 500, color: "#1a1916" }}>Agent roster</h1>
          <p style={{ fontSize: 13, color: "#6b6a66", marginTop: 3 }}>{session.user.email}</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
          <MetricCard label="Active agents"   value={String(agents.length)} />
          <MetricCard label="Coaching flags"  value={String(flags)}  variant={flags > 0 ? "alert" : "normal"} />
          <MetricCard label="Avg fit score"   value={avgFit !== null ? String(avgFit) : "—"} />
          <MetricCard label="Surveys pending" value={String(agents.length - completed.length)} variant={agents.length - completed.length > 0 ? "warn" : "normal"} />
        </div>

        <div style={{ display: "flex", gap: 20, fontSize: 12, color: "#6b6a66", marginBottom: 16, alignItems: "center" }}>
          <span><span style={{ width: 10, height: 10, borderRadius: "50%", background: "#639922", display: "inline-block", marginRight: 5 }} />Strong fit</span>
          <span><span style={{ width: 10, height: 10, borderRadius: "50%", background: "#BA7517", display: "inline-block", marginRight: 5 }} />Monitor</span>
          <span><span style={{ width: 10, height: 10, borderRadius: "50%", background: "#E24B4A", display: "inline-block", marginRight: 5 }} />Needs attention</span>
        </div>

        {agents.length > 0 ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12, marginBottom: 20 }}>
            {agents.map(agent => {
              const score = agent.scoreResult
              const overall = score?.overallScore ?? 0
              const av = score ? avatarColor(overall) : { border: "#9c9b97", bg: "#f2f1ee", text: "#6b6a66" }
              const flag = score && hasCoachingFlag(score)

              return (
                <div key={agent.id} style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.09)", borderRadius: 10, padding: "16px 18px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                    <div style={{ width: 46, height: 46, borderRadius: "50%", border: `2.5px solid ${av.border}`, display: "flex", alignItems: "center", justifyContent: "center", background: av.bg, flexShrink: 0 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: av.text }}>{initials(agent.email)}</span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 500, color: "#1a1916", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{agent.email}</div>
                      <div style={{ fontSize: 12, color: "#6b6a66", marginTop: 1 }}>Day {daysSince(agent.createdAt)}</div>
                    </div>
                    {score && <div style={{ fontSize: 16, fontWeight: 600, color: scoreColor(overall) }}>{Math.round(overall)}</div>}
                  </div>

                  {flag && (
                    <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 6, padding: "8px 10px", marginBottom: 12 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: "#9B1C1C", marginBottom: 2 }}>Coaching flag</div>
                      <div style={{ fontSize: 12, color: "#7F1D1D", lineHeight: 1.5 }}>
                        {DIM_KEYS.filter(k => score[k] < 50).map(k => DIM_LABELS[k]).join(", ")} below threshold.
                      </div>
                    </div>
                  )}

                  {score ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                      {DIM_KEYS.map(key => {
                        const s = score[key]
                        return (
                          <div key={key}>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#6b6a66", marginBottom: 2 }}>
                              <span>{DIM_LABELS[key]}</span><span>{Math.round(s)}</span>
                            </div>
                            <div style={{ height: 4, background: "#eae9e5", borderRadius: 2, overflow: "hidden" }}>
                              <div style={{ width: `${s}%`, height: 4, background: barColor(s), borderRadius: 2 }} />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div style={{ fontSize: 12, color: "#9c9b97", fontStyle: "italic" }}>Survey pending</div>
                  )}

                  <div style={{ borderTop: "1px solid rgba(0,0,0,0.09)", marginTop: 12, paddingTop: 10, fontSize: 12, color: "#6b6a66" }}>
                    {agent.surveyCompleted ? "Baseline complete" : "Awaiting survey"}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.09)", borderRadius: 10, padding: "24px 18px", color: "#9c9b97", textAlign: "center", marginBottom: 20 }}>
            No agents linked yet. Add agents below.
          </div>
        )}

        <ManageAgents agents={agents.map(a => ({ id: a.id, email: a.email, surveyCompleted: a.surveyCompleted }))} />
      </main>
    </div>
  )
}

function MetricCard({ label, value, variant = "normal" }: { label: string; value: string; variant?: "normal" | "alert" | "warn" }) {
  const styles = {
    normal: { bg: "#fff",    border: "rgba(0,0,0,0.09)", labelColor: "#6b6a66", valueColor: "#1a1916" },
    alert:  { bg: "#FEF2F2", border: "#FECACA",          labelColor: "#9B1C1C", valueColor: "#E24B4A" },
    warn:   { bg: "#FFF8EC", border: "#FDE68A",          labelColor: "#7A4A00", valueColor: "#BA7517" },
  }[variant]

  return (
    <div style={{ background: styles.bg, border: `1px solid ${styles.border}`, borderRadius: 10, padding: "16px 18px" }}>
      <div style={{ fontSize: 12, color: styles.labelColor, marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 500, color: styles.valueColor }}>{value}</div>
    </div>
  )
}
