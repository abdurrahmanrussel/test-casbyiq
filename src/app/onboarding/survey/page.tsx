export const runtime = 'edge'

import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { SurveyFlow } from "@/components/survey/SurveyFlow"

export default async function SurveyPage() {
  const session = await auth()
  if (!session) redirect("/login")
  if (session.user.surveyCompleted) redirect(`/dashboard/${session.user.role}`)

  const surveyType = session.user.role === "agent" ? "agent_intake" : "broker_intake"
  const questions = await prisma.question.findMany({
    where: { surveyType },
    orderBy: { sortOrder: "asc" },
    select: { id: true, text: true, questionType: true, options: true, required: true, isScored: true, section: true },
  })

  return <SurveyFlow questions={questions} role={session.user.role} />
}
