import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  const { agentId } = body ?? {}
  if (!agentId || typeof agentId !== "string") {
    return NextResponse.json({ error: "agentId required" }, { status: 400 })
  }

  const agent = await prisma.user.findUnique({ where: { id: agentId } })
  if (!agent || agent.brokerId !== session.user.id) {
    return NextResponse.json({ error: "Agent not found or not linked to you" }, { status: 404 })
  }

  await prisma.user.update({
    where: { id: agentId },
    data: { brokerId: null },
  })

  return NextResponse.json({ ok: true })
}
