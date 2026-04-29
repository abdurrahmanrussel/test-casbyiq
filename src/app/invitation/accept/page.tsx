export const runtime = 'edge'

import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { InvitationActions } from "@/components/invitation/InvitationActions"

export default async function InvitationAcceptPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const { token } = await searchParams

  if (!token) return <Shell><ErrorCard message="Invalid invitation link." /></Shell>

  const invitation = await prisma.brokerInvitation.findUnique({
    where: { token },
    include: { broker: { select: { email: true } } },
  })

  if (!invitation) return <Shell><ErrorCard message="Invalid invitation link." /></Shell>
  if (new Date() > invitation.expiresAt) return <Shell><ErrorCard message="This invitation has expired." /></Shell>
  if (invitation.status === "accepted") return <Shell><ErrorCard message="This invitation has already been accepted." success /></Shell>
  if (invitation.status === "declined") return <Shell><ErrorCard message="This invitation has already been declined." /></Shell>

  const session = await auth()
  if (!session) {
    redirect(`/login?redirect=/invitation/accept?token=${token}`)
  }

  const agent = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!agent || agent.email !== invitation.agentEmail) {
    return (
      <Shell>
        <ErrorCard message={`This invitation was sent to ${invitation.agentEmail}. Please sign in with that account.`} />
      </Shell>
    )
  }

  if (agent.brokerId === invitation.brokerId) {
    return <Shell><ErrorCard message="You are already connected with this broker." success /></Shell>
  }

  return (
    <Shell>
      <div style={{ fontSize: 18, fontWeight: 600, color: "#1a1916", marginBottom: 6, textAlign: "center" }}>
        Kasby<span style={{ color: "#639922" }}>IQ</span>
      </div>
      <div style={{ width: 40, height: 1, background: "#eae9e5", margin: "12px auto 20px" }} />
      <div style={{ fontSize: 15, fontWeight: 500, color: "#1a1916", marginBottom: 8, textAlign: "center" }}>
        Connection request
      </div>
      <div style={{ fontSize: 13, color: "#6b6a66", lineHeight: 1.6, marginBottom: 6, textAlign: "center" }}>
        <strong style={{ color: "#1a1916" }}>{invitation.broker.email}</strong> has invited you to share your KasbyIQ fit profile.
      </div>
      <div style={{ fontSize: 12, color: "#9c9b97", marginBottom: 24, textAlign: "center" }}>
        Accepting lets your broker see your dimension scores to support your growth.
      </div>
      <InvitationActions token={token} brokerEmail={invitation.broker.email} />
    </Shell>
  )
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: "#f7f6f3", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.09)", borderRadius: 12, padding: "32px 28px", maxWidth: 400, width: "100%" }}>
        {children}
      </div>
    </div>
  )
}

function ErrorCard({ message, success = false }: { message: string; success?: boolean }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: 18, fontWeight: 600, color: "#1a1916", marginBottom: 16 }}>
        Kasby<span style={{ color: "#639922" }}>IQ</span>
      </div>
      <div style={{ fontSize: 13, color: success ? "#2A5200" : "#6b6a66", marginBottom: 16 }}>{message}</div>
      <a href="/dashboard/agent" style={{ fontSize: 13, color: "#639922", textDecoration: "none" }}>
        Go to dashboard →
      </a>
    </div>
  )
}
