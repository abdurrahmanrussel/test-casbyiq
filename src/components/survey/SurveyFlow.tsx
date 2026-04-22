"use client"
import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Question, IntakeQuestion } from "@/lib/questions"
import { SurveyIntroScreen } from "./SurveyIntroScreen"
import { SurveyExplainScreen } from "./SurveyExplainScreen"
import { SurveyConsentScreen } from "./SurveyConsentScreen"
import { SurveyIntakeQuestion } from "./SurveyIntakeQuestion"
import { SurveyQuestion } from "./SurveyQuestion"
import { ProgressDots } from "./ProgressDots"

type Phase = "intro" | "explain" | "consent" | "intake" | "questions"

interface Props {
  questions: Question[]
  intakeQuestions: IntakeQuestion[]
  role: "agent" | "broker"
}

async function saveAnswer(questionId: string, answer: string) {
  await fetch("/api/survey/answer", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ questionId, answer }),
  })
}

export function SurveyFlow({ questions, intakeQuestions, role }: Props) {
  const [phase, setPhase] = useState<Phase>("intro")
  const [intakeIndex, setIntakeIndex] = useState(0)
  const [intakeAnswers, setIntakeAnswers] = useState<Record<string, string>>({})
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [error, setError] = useState(false)
  const router = useRouter()
  const { update } = useSession()

  const visibleIntake = useMemo(() => {
    return intakeQuestions.filter((q) => {
      if (!q.conditional) return true
      return q.conditional.showWhen.includes(intakeAnswers[q.conditional.dependsOn] ?? "")
    })
  }, [intakeQuestions, intakeAnswers])

  const intakeQuestion = visibleIntake[intakeIndex]
  const likertQuestion = questions[current]
  const isLastLikert = current === questions.length - 1

  function handleStart() { setPhase("explain") }
  function handleExplainNext() { setPhase("consent") }
  function handleExplainPrev() { setPhase("intro") }
  function handleConsentPrev() { setPhase("explain") }

  async function handleConsentNext({ licenseNumber }: { licenseNumber?: string }) {
    await saveAnswer("INTAKE_CONSENT", "true")
    if (licenseNumber) await saveAnswer("AGENT_LICENSE", licenseNumber)
    if (role === "broker" && visibleIntake.length > 0) {
      setPhase("intake")
    } else {
      setPhase("questions")
    }
  }

  async function handleIntakeNext() {
    const answer = intakeAnswers[intakeQuestion.id] ?? ""
    if (intakeQuestion.required && !answer.trim()) { setError(true); return }
    setError(false)
    await saveAnswer(intakeQuestion.id, answer)
    if (intakeIndex < visibleIntake.length - 1) {
      setIntakeIndex((i) => i + 1)
    } else {
      setPhase("questions")
    }
  }

  function handleIntakePrev() {
    setError(false)
    if (intakeIndex > 0) {
      setIntakeIndex((i) => i - 1)
    } else {
      setPhase("consent")
    }
  }

  async function handleLikertNext() {
    const answer = answers[likertQuestion.id]
    if (!answer) { setError(true); return }
    setError(false)
    await saveAnswer(likertQuestion.id, String(answer))
    if (isLastLikert) {
      await fetch("/api/survey/complete", { method: "POST" })
      await update({ surveyCompleted: true })
      router.push(`/dashboard/${role}`)
    } else {
      setCurrent((c) => c + 1)
    }
  }

  function handleLikertPrev() {
    setError(false)
    if (current > 0) {
      setCurrent((c) => c - 1)
    } else if (role === "broker" && visibleIntake.length > 0) {
      setPhase("intake")
      setIntakeIndex(visibleIntake.length - 1)
    } else {
      setPhase("consent")
    }
  }

  if (phase === "intro") {
    return <SurveyIntroScreen role={role} onStart={handleStart} />
  }

  if (phase === "explain") {
    return <SurveyExplainScreen role={role} onNext={handleExplainNext} onPrev={handleExplainPrev} />
  }

  if (phase === "consent") {
    return <SurveyConsentScreen role={role} onNext={handleConsentNext} onPrev={handleConsentPrev} />
  }

  if (phase === "intake" && intakeQuestion) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4"
           style={{ backgroundColor: "#1a73e8" }}>
        <SurveyIntakeQuestion
          question={intakeQuestion}
          answer={intakeAnswers[intakeQuestion.id] ?? ""}
          onAnswer={(val) => {
            setIntakeAnswers((a) => ({ ...a, [intakeQuestion.id]: val }))
            setError(false)
          }}
          onNext={handleIntakeNext}
          onPrev={handleIntakePrev}
          canGoPrev={true}
          error={error}
          current={intakeIndex}
          total={visibleIntake.length}
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4"
         style={{ backgroundColor: "#1a73e8" }}>
      <SurveyQuestion
        question={likertQuestion}
        answer={answers[likertQuestion.id]}
        onAnswer={(val) => {
          setAnswers((a) => ({ ...a, [likertQuestion.id]: val }))
          setError(false)
        }}
        error={error}
        onNext={handleLikertNext}
        onPrev={handleLikertPrev}
        canGoPrev={true}
        current={current}
        total={questions.length}
      />
      <ProgressDots current={current} total={questions.length} />
    </div>
  )
}
