export const runtime = 'edge'

import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  const { questionId, answer } = body ?? {}

  if (!questionId || typeof answer !== "string" || !answer.trim()) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
  }

  await prisma.surveyResponse.upsert({
    where: { userId_questionId: { userId: session.user.id, questionId } },
    update: { answer },
    create: { userId: session.user.id, questionId, answer },
  })

  return NextResponse.json({ ok: true })
}
