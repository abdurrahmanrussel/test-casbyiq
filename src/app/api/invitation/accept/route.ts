import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  const { token, action } = body ?? {}
  if (!token || typeof token !== "string" || !["accept", "decline"].includes(action)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }

  const invitation = await prisma.brokerInvitation.findUnique({ where: { token } })
  if (!invitation) {
    return NextResponse.json({ error: "Invalid invitation" }, { status: 404 })
  }
  if (invitation.status !== "pending") {
    return NextResponse.json({ error: `Invitation already ${invitation.status}` }, { status: 400 })
  }
  if (new Date() > invitation.expiresAt) {
    return NextResponse.json({ error: "Invitation has expired" }, { status: 400 })
  }

  const agent = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!agent || agent.email !== invitation.agentEmail) {
    return NextResponse.json({ error: "This invitation is not for your account" }, { status: 403 })
  }
  if (agent.brokerId && agent.brokerId !== invitation.brokerId) {
    return NextResponse.json({ error: "You are already linked to another broker" }, { status: 400 })
  }

  if (action === "accept") {
    await prisma.$transaction([
      prisma.user.update({
        where: { id: session.user.id },
        data: { brokerId: invitation.brokerId },
      }),
      prisma.brokerInvitation.update({
        where: { token },
        data: { status: "accepted" },
      }),
    ])
  } else {
    await prisma.brokerInvitation.update({
      where: { token },
      data: { status: "declined" },
    })
  }

  return NextResponse.json({ ok: true })
}
