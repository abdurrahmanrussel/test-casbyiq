"use client"
import { useState, useCallback, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { SurveyItemRenderer } from "./SurveyItemRenderer"
import { SurveyProgressBar } from "./SurveyProgressBar"
import type { SurveyQuestion } from "./SurveyItemRenderer"

interface Props {
  questions: SurveyQuestion[]
  role: string
}

const AUTO_ADVANCE_TYPES = new Set(["likert", "multiple_choice", "yes_no", "scale"])

export function SurveyFlow({ questions, role }: Props) {
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [error, setError] = useState(false)
  const [slideState, setSlideState] = useState<"idle" | "exiting" | "entering">("idle")
  const [showCarousel, setShowCarousel] = useState(false)
  const autoAdvanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const carouselRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const { update } = useSession()

  const question = questions[current]
  const answer = answers[question?.id]
  const isLast = current === questions.length - 1

  // Scroll carousel to current card when it opens
  useEffect(() => {
    if (!showCarousel || !carouselRef.current) return
    const el = carouselRef.current.querySelector(`[data-idx="${current}"]`) as HTMLElement | null
    if (el) el.scrollIntoView({ behavior: "instant", inline: "center", block: "nearest" })
  }, [showCarousel, current])

  function isValidAnswer(q: SurveyQuestion, a: string | undefined): boolean {
    if (!q.required) return true
    if (!a) return false
    if (q.questionType === "checkbox" || q.questionType === "rank") {
      try { return JSON.parse(a).length > 0 } catch { return false }
    }
    return a.trim() !== ""
  }

  const advanceTo = useCallback(async (nextIndex: number | "submit") => {
    if (autoAdvanceTimer.current) clearTimeout(autoAdvanceTimer.current)
    setSlideState("exiting")
    await new Promise((r) => setTimeout(r, 280))

    if (nextIndex === "submit") {
      await fetch("/api/survey/complete", { method: "POST" })
      await update({ surveyCompleted: true })
      router.push(`/dashboard/${role}`)
      return
    }

    setCurrent(nextIndex)
    setSlideState("entering")
    setTimeout(() => setSlideState("idle"), 280)
  }, [router, role, update])

  async function saveAnswer(questionId: string, ans: string) {
    await fetch("/api/survey/answer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ questionId, answer: ans }),
    })
  }

  function handleAnswer(val: string) {
    setError(false)
    const q = question
    setAnswers((prev) => ({ ...prev, [q.id]: val }))
    if (AUTO_ADVANCE_TYPES.has(q.questionType)) {
      if (autoAdvanceTimer.current) clearTimeout(autoAdvanceTimer.current)
      autoAdvanceTimer.current = setTimeout(async () => {
        await saveAnswer(q.id, val)
        advanceTo(isLast ? "submit" : current + 1)
      }, 400)
    }
  }

  async function handleNext() {
    if (autoAdvanceTimer.current) clearTimeout(autoAdvanceTimer.current)
    if (!isValidAnswer(question, answer)) { setError(true); return }
    setError(false)
    await saveAnswer(question.id, answer ?? "")
    advanceTo(isLast ? "submit" : current + 1)
  }

  function handlePrev() {
    if (autoAdvanceTimer.current) clearTimeout(autoAdvanceTimer.current)
    if (current > 0) { setError(false); advanceTo(current - 1) }
  }

  function handleJump(index: number) {
    if (autoAdvanceTimer.current) clearTimeout(autoAdvanceTimer.current)
    setError(false)
    advanceTo(index)
  }

  const needsManualNext = !AUTO_ADVANCE_TYPES.has(question?.questionType ?? "")

  return (
    <>
      {/* ── Main survey view ── */}
      <div
        className="min-h-screen flex flex-col items-center justify-center px-4 py-8"
        style={{ backgroundColor: "#1a73e8" }}
      >
        <div className="w-full max-w-2xl">
          <div className="overflow-hidden rounded-lg shadow-xl">
            <div
              className={
                slideState === "exiting"
                  ? "survey-slide-out"
                  : slideState === "entering"
                  ? "survey-slide-in"
                  : ""
              }
            >
              {/* Question card */}
              <div className="bg-white px-8 pt-10 pb-8 min-h-88">
                <p className="text-[#1a1a2e] font-semibold text-xl leading-snug mb-1 text-center">
                  {question?.text}
                  {question?.required && <span className="text-[#e53e3e]"> *</span>}
                </p>
                {!question?.required && (
                  <p className="text-center text-gray-400 text-sm mb-1">Optional</p>
                )}
                <div className="mt-6">
                  <SurveyItemRenderer question={question} answer={answer} onAnswer={handleAnswer} />
                </div>
              </div>

              {/* Footer */}
              <div className="bg-[#4caf50] px-6 py-3 flex items-center justify-between">
                <button
                  onClick={handlePrev}
                  disabled={current === 0}
                  className="text-white font-semibold text-sm disabled:opacity-30 tracking-wide"
                >
                  ← PREVIOUS
                </button>
                {error && (
                  <span className="bg-[#e53e3e] text-white text-xs font-medium px-3 py-1.5 rounded">
                    This field is required.
                  </span>
                )}
                {needsManualNext ? (
                  <button onClick={handleNext} className="text-white font-semibold text-sm tracking-wide">
                    {isLast ? "SUBMIT →" : "NEXT →"}
                  </button>
                ) : (
                  <button onClick={handleNext} className="text-white font-semibold text-sm tracking-wide opacity-50 hover:opacity-80 transition-opacity">
                    SKIP →
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <SurveyProgressBar
            questions={questions}
            answers={answers}
            current={current}
            onJump={handleJump}
            onShowAll={() => setShowCarousel(true)}
          />
        </div>
      </div>

      {/* ── Carousel "See All" overlay ── */}
      {showCarousel && (
        <div
          className="fixed inset-0 z-50 flex flex-col"
          style={{ backgroundColor: "#1a73e8" }}
        >
          {/* Close bar */}
          <div className="flex items-center justify-between px-6 pt-4 pb-2 shrink-0">
            <p className="text-white/60 text-sm">
              {Object.values(answers).filter(Boolean).length} of {questions.length} answered
            </p>
            <button
              onClick={() => setShowCarousel(false)}
              className="text-white/70 hover:text-white text-sm font-medium transition-colors px-3 py-1 rounded-full hover:bg-white/10"
            >
              ✕ Close
            </button>
          </div>

          {/* Scrollable cards row */}
          <div
            ref={carouselRef}
            className="flex-1 flex items-center overflow-x-auto"
            style={{
              scrollSnapType: "x mandatory",
              scrollBehavior: "smooth",
              WebkitOverflowScrolling: "touch",
              paddingLeft: "calc(50vw - 230px)",
              paddingRight: "calc(50vw - 230px)",
              gap: 28,
              msOverflowStyle: "none",
              scrollbarWidth: "none",
            } as React.CSSProperties}
          >
            {questions.map((q, i) => {
              const isActive = i === current
              const ans = answers[q.id]
              return (
                <div
                  key={q.id}
                  data-idx={i}
                  className="shrink-0 flex flex-col items-center"
                  style={{
                    scrollSnapAlign: "center",
                    width: 460,
                  }}
                >
                  {/* Large question number */}
                  <div
                    className="text-center font-bold leading-none mb-3 select-none"
                    style={{
                      fontSize: "7rem",
                      color: isActive ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.18)",
                      letterSpacing: "-0.04em",
                    }}
                  >
                    {i + 1}
                  </div>

                  {/* Card */}
                  <button
                    onClick={() => { handleJump(i); setShowCarousel(false) }}
                    className={`w-full rounded-lg overflow-hidden shadow-xl text-left transition-all duration-200 ${
                      isActive ? "shadow-2xl scale-100" : "scale-95 opacity-80 hover:opacity-100 hover:scale-[0.97]"
                    }`}
                  >
                    {/* Card body */}
                    <div className="bg-white px-6 py-6" style={{ minHeight: 240 }}>
                      <p className="text-[#1a1a2e] font-semibold text-[15px] leading-snug text-center mb-4">
                        {q.text}
                        {q.required && <span className="text-[#e53e3e]"> *</span>}
                      </p>
                      {/* Read-only preview of options */}
                      <CarouselCardPreview question={q} answer={ans} />
                    </div>
                    {/* Card footer */}
                    <div className="bg-[#4caf50] px-5 py-2.5 flex items-center justify-between">
                      <span className="text-white text-xs font-semibold tracking-wide">← PREVIOUS</span>
                      <span className="text-white text-xs font-semibold tracking-wide">NEXT →</span>
                    </div>
                  </button>
                </div>
              )
            })}
          </div>

          {/* Progress bar at bottom */}
          <div className="shrink-0 pb-4">
            <SurveyProgressBar
              questions={questions}
              answers={answers}
              current={current}
              onJump={(i) => { handleJump(i); setShowCarousel(false) }}
              onShowAll={() => {}}
            />
          </div>
        </div>
      )}
    </>
  )
}

// Lightweight read-only option preview for carousel cards
function CarouselCardPreview({ question, answer }: { question: SurveyQuestion; answer: string | undefined }) {
  const { questionType, options } = question
  const opts = Array.isArray(options) ? (options as string[]) : []

  if (questionType === "likert") {
    const labels = ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"]
    return (
      <div className="flex flex-col gap-1.5">
        {labels.map((label, i) => {
          const val = String(i + 1)
          const selected = answer === val
          return (
            <div key={val} className={`flex items-center gap-2 px-3 py-1.5 border rounded text-xs ${
              selected ? "border-[#1a73e8] bg-[#e8f0fe]" : "border-gray-200"
            }`}>
              <span className={`w-3.5 h-3.5 rounded-full border-2 shrink-0 ${
                selected ? "border-[#1a73e8] bg-[#1a73e8]" : "border-gray-300"
              }`} />
              <span className="text-gray-700">{i + 1} – {label}</span>
            </div>
          )
        })}
      </div>
    )
  }

  if ((questionType === "multiple_choice" || questionType === "checkbox") && opts.length > 0) {
    const checked = answer ? (() => { try { return JSON.parse(answer) } catch { return [] } })() : []
    const show = opts.slice(0, 5)
    return (
      <div className="flex flex-col gap-1.5">
        {show.map((opt) => {
          const selected = answer === opt || checked.includes(opt)
          return (
            <div key={opt} className={`flex items-center gap-2 px-3 py-1.5 border rounded text-xs ${
              selected ? "border-[#1a73e8] bg-[#e8f0fe]" : "border-gray-200"
            }`}>
              <span className={`w-3.5 h-3.5 rounded-full border-2 shrink-0 ${
                selected ? "border-[#1a73e8] bg-[#1a73e8]" : "border-gray-300"
              }`} />
              <span className="text-gray-700 truncate">{opt}</span>
            </div>
          )
        })}
        {opts.length > 5 && (
          <p className="text-gray-400 text-[10px] pl-3">+{opts.length - 5} more options</p>
        )}
      </div>
    )
  }

  if (questionType === "yes_no") {
    return (
      <div className="flex gap-3">
        {["Yes", "No"].map((opt) => (
          <div key={opt} className={`flex-1 py-2 border-2 rounded text-xs font-semibold text-center ${
            answer === opt ? "border-[#1a73e8] bg-[#e8f0fe] text-[#1a73e8]" : "border-gray-200 text-gray-500"
          }`}>{opt}</div>
        ))}
      </div>
    )
  }

  if (questionType === "text") {
    return (
      <div className="px-3 py-2 border border-gray-200 rounded text-xs text-gray-400 min-h-15">
        {answer ? <span className="text-gray-700">{answer.slice(0, 100)}{answer.length > 100 ? "…" : ""}</span> : "Open text response…"}
      </div>
    )
  }

  return (
    <div className="text-center text-gray-400 text-xs py-4 capitalize">
      {questionType.replace("_", " ")} question
    </div>
  )
}
