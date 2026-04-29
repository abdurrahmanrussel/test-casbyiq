export const runtime = 'edge'

import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { calculateScores } from "@/lib/scoring"

const SCORED_IDS = new Set([
  "AUT_A1","AUT_A2","AUT_A3","AUT_A4","AUT_A5","AUT_A6",
  "COM_A1","COM_A2","COM_A3","COM_A4","COM_A5","COM_A6",
  "REL_A1","REL_A2","REL_A3","REL_A4","REL_A5","REL_A6",
  "GRIT_A1","GRIT_A2","GRIT_A3","GRIT_A4","GRIT_A5","GRIT_A6",
  "SR_A1","SR_A2","SR_A3","SR_A4","SR_A5","SR_A6",
  "EI_A1","EI_A2","EI_A3","EI_A4","EI_A5","EI_A6",
])

export async function POST(_req?: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const allResponses = await prisma.surveyResponse.findMany({
    where: { userId: session.user.id },
    select: { questionId: true, answer: true },
  })

  const scoredResponses = allResponses.filter((r: { questionId: string; answer: string }) => SCORED_IDS.has(r.questionId))
  if (scoredResponses.length < 36) {
    return NextResponse.json({ error: "Incomplete survey" }, { status: 400 })
  }

  const scores = calculateScores(scoredResponses)

  await prisma.user.update({
    where: { id: session.user.id },
    data: { surveyCompleted: true },
  })
  await prisma.scoreResult.upsert({
    where: { userId: session.user.id },
    update: { ...scores, surveyType: "agent_intake" },
    create: { userId: session.user.id, surveyType: "agent_intake", ...scores },
  })

  return NextResponse.json({ ok: true })
}
