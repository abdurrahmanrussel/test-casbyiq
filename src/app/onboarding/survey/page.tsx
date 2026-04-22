import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { SurveyFlow } from "@/components/survey/SurveyFlow"
import {
  agentQuestions,
  brokerQuestions,
  agentIntakeQuestions,
  brokerIntakeQuestions,
} from "@/lib/questions"

export default async function SurveyPage() {
  const session = await auth()
  if (!session) redirect("/login")
  if (session.user.surveyCompleted) redirect(`/dashboard/${session.user.role}`)

  const isAgent = session.user.role === "agent"
  const questions = isAgent ? agentQuestions : brokerQuestions
  const intakeQuestions = isAgent ? agentIntakeQuestions : brokerIntakeQuestions

  return <SurveyFlow questions={questions} intakeQuestions={intakeQuestions} role={session.user.role as "agent" | "broker"} />
}
