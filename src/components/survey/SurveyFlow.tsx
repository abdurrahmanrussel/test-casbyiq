"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { SurveyQuestion } from "./SurveyQuestion"
import { ProgressDots } from "./ProgressDots"
import { Question } from "@/lib/questions"

interface Props {
  questions: Question[]
  role: string
}

export function SurveyFlow({ questions, role }: Props) {
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [error, setError] = useState(false)
  const router = useRouter()
  const { update } = useSession()

  const question = questions[current]
  const answer = answers[question.id]
  const isLast = current === questions.length - 1

  async function handleNext() {
    if (!answer) {
      setError(true)
      return
    }
    setError(false)

    await fetch("/api/survey/answer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ questionId: question.id, answer }),
    })

    if (isLast) {
      await fetch("/api/survey/complete", { method: "POST" })
      await update({ surveyCompleted: true })
      router.push(`/dashboard/${role}`)
    } else {
      setCurrent((c) => c + 1)
    }
  }

  function handlePrev() {
    if (current > 0) {
      setError(false)
      setCurrent((c) => c - 1)
    }
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ backgroundColor: "#1a73e8" }}
    >
      <SurveyQuestion
        question={question}
        answer={answer}
        onAnswer={(val) => {
          setAnswers((a) => ({ ...a, [question.id]: val }))
          setError(false)
        }}
        error={error}
        onNext={handleNext}
        onPrev={handlePrev}
        canGoPrev={current > 0}
        current={current}
        total={questions.length}
      />
      <ProgressDots current={current} total={questions.length} />
    </div>
  )
}
