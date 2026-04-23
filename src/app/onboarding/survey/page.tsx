import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { SurveyFlow } from "@/components/survey/SurveyFlow"

export default async function SurveyPage() {
  const session = await auth()
  if (!session) redirect("/login")
  if (session.user.surveyCompleted) redirect(`/dashboard/${session.user.role}`)

  const questions = await prisma.question.findMany({
    where: { role: session.user.role as "agent" | "broker" },
    orderBy: { sortOrder: "asc" },
    select: { id: true, text: true },
  })

  return <SurveyFlow questions={questions} role={session.user.role} />
}
