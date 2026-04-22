import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { SurveyFlow } from "@/components/survey/SurveyFlow"
import { agentQuestions, brokerQuestions } from "@/lib/questions"

export default async function SurveyPage() {
  const session = await auth()
  if (!session) redirect("/login")
  if (session.user.surveyCompleted) redirect(`/dashboard/${session.user.role}`)

  const questions =
    session.user.role === "agent" ? agentQuestions : brokerQuestions

  return <SurveyFlow questions={questions} role={session.user.role} />
}
