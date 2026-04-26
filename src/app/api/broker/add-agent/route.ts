import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const caller = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (caller?.role !== "broker") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await req.json().catch(() => null)
  const { email } = body ?? {}
  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "Email required" }, { status: 400 })
  }

  const agent = await prisma.user.findUnique({ where: { email } })
  if (!agent) {
    return NextResponse.json({ error: "No agent found with that email" }, { status: 404 })
  }
  if (agent.role !== "agent") {
    return NextResponse.json({ error: "User is not an agent" }, { status: 400 })
  }
  if (agent.brokerId && agent.brokerId !== session.user.id) {
    return NextResponse.json({ error: "Agent is linked to another broker" }, { status: 400 })
  }

  await prisma.user.update({
    where: { id: agent.id },
    data: { brokerId: session.user.id },
  })

  return NextResponse.json({ ok: true })
}
