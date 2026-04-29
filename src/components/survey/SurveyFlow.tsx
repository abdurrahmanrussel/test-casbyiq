"use client"
import { useState, useCallback, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { SurveyItemRenderer } from "./SurveyItemRenderer"
import { SurveyProgressBar } from "./SurveyProgressBar"
import type { StepInfo } from "./SurveyProgressBar"
import type { SurveyQuestion } from "./SurveyItemRenderer"

interface Props {
  questions: SurveyQuestion[]
  role: string
}

const AUTO_ADVANCE_TYPES = new Set(["likert", "multiple_choice", "yes_no", "scale"])

type IntroStep = 0 | 1 | 2 | "done"

export function SurveyFlow({ questions, role }: Props) {
  const [introStep, setIntroStep] = useState<IntroStep>(role === "agent" ? 0 : "done")
  const [consentChecked, setConsentChecked] = useState(false)
  const [licenseNumber, setLicenseNumber] = useState("")
  const [licenseError, setLicenseError] = useState(false)
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [error, setError] = useState(false)
  const [slideState, setSlideState] = useState<"idle" | "exiting" | "entering">("idle")
  const [showCarousel, setShowCarousel] = useState(false)
  const autoAdvanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const carouselRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const { update } = useSession()

  const showIntro = introStep !== "done"
  const INTRO_COUNT = role === "agent" ? 3 : 0

  function isAnsweredQ(q: SurveyQuestion): boolean {
    const a = answers[q.id]
    if (!a) return false
    if (q.questionType === "checkbox" || q.questionType === "rank") {
      try { return JSON.parse(a).length > 0 } catch { return false }
    }
    return a.trim() !== ""
  }

  const globalCurrent = showIntro
    ? (introStep as number)
    : INTRO_COUNT + current

  const allSteps: StepInfo[] = [
    ...(role === "agent" ? [
      { id: "__intro_0", answered: introStep === "done" || (typeof introStep === "number" && 0 < introStep) },
      { id: "__intro_1", answered: introStep === "done" || (typeof introStep === "number" && 1 < introStep) },
      { id: "__intro_2", answered: introStep === "done" },
    ] : []),
    ...questions.map(q => ({ id: q.id, answered: isAnsweredQ(q) })),
  ]

  async function handleIntroNext() {
    if (autoAdvanceTimer.current) clearTimeout(autoAdvanceTimer.current)
    if (introStep === 1 && !consentChecked) return
    if (introStep === 2) {
      if (!licenseNumber.trim()) { setLicenseError(true); return }
      setLicenseError(false)
    }

    setSlideState("exiting")
    await new Promise((r) => setTimeout(r, 280))

    if (introStep === 0) {
      setIntroStep(1)
    } else if (introStep === 1) {
      setIntroStep(2)
    } else if (introStep === 2) {
      await fetch("/api/survey/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId: "INTRO_AGENT_LICENSE", answer: licenseNumber.trim() }),
      })
      setIntroStep("done")
    }

    setSlideState("entering")
    setTimeout(() => setSlideState("idle"), 280)
  }

  async function handleIntroBack() {
    if (introStep === 0) return
    if (autoAdvanceTimer.current) clearTimeout(autoAdvanceTimer.current)

    setSlideState("exiting")
    await new Promise((r) => setTimeout(r, 280))

    if (introStep === 1) setIntroStep(0)
    else if (introStep === 2) setIntroStep(1)

    setSlideState("entering")
    setTimeout(() => setSlideState("idle"), 280)
  }

  function handleConsentToggle() {
    const next = !consentChecked
    setConsentChecked(next)
    if (next) {
      autoAdvanceTimer.current = setTimeout(() => handleIntroNext(), 400)
    } else {
      if (autoAdvanceTimer.current) clearTimeout(autoAdvanceTimer.current)
    }
  }

  const question = questions[current]
  const answer = answers[question?.id]
  const isLast = current === questions.length - 1

  // Scroll carousel to current card when it opens
  useEffect(() => {
    if (!showCarousel || !carouselRef.current) return
    const el = carouselRef.current.querySelector(`[data-global="${globalCurrent}"]`) as HTMLElement | null
    if (el) el.scrollIntoView({ behavior: "instant", inline: "center", block: "nearest" })
  }, [showCarousel, globalCurrent])

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

  async function handlePrev() {
    if (autoAdvanceTimer.current) clearTimeout(autoAdvanceTimer.current)
    setError(false)
    if (current > 0) {
      advanceTo(current - 1)
    } else if (role === "agent") {
      setSlideState("exiting")
      await new Promise((r) => setTimeout(r, 280))
      setIntroStep(2)
      setSlideState("entering")
      setTimeout(() => setSlideState("idle"), 280)
    }
  }

  async function handleGlobalJump(globalIndex: number) {
    if (autoAdvanceTimer.current) clearTimeout(autoAdvanceTimer.current)
    setError(false)
    setSlideState("exiting")
    await new Promise((r) => setTimeout(r, 280))
    if (role === "agent" && globalIndex < INTRO_COUNT) {
      setIntroStep(globalIndex as 0 | 1 | 2)
    } else {
      setCurrent(globalIndex - INTRO_COUNT)
    }
    setSlideState("entering")
    setTimeout(() => setSlideState("idle"), 280)
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
          <div className={`overflow-hidden rounded-lg shadow-xl ${
            slideState === "exiting" ? "survey-slide-out" :
            slideState === "entering" ? "survey-slide-in" : ""
          } ${slideState !== "idle" ? "pointer-events-none" : ""}`}>

            {/* ── Intro pages (agent only) ── */}
            {showIntro ? (
              <>
                {/* Intro card body */}
                <div className="bg-white px-8 pt-10 pb-8 min-h-88">
                  {introStep === 0 && (
                    <div className="flex flex-col gap-5">
                      <h2 className="text-[#1a1a2e] font-bold text-xl text-center leading-snug">
                        Your KasbyIQ Profile
                      </h2>
                      <p className="text-gray-700 text-sm leading-relaxed">
                        Over the next 12 to 15 minutes, you will build a picture of how you work best: the kind of environment where you thrive, how you approach challenges, and what support actually moves the needle for you. Answer honestly. Your broker will use what you share to support you better. You will use it to understand yourself.
                      </p>
                      <div className="flex flex-col gap-2.5 text-sm text-gray-600">
                        <div className="flex gap-2.5">
                          <span className="text-[#1a73e8] font-bold shrink-0">→</span>
                          <span><strong>How this works:</strong> Each question advances on its own once you answer. Just move at your own pace.</span>
                        </div>
                        <div className="flex gap-2.5">
                          <span className="text-[#1a73e8] font-bold shrink-0">→</span>
                          <span><strong>Your progress saves automatically.</strong> If you need to stop and come back, pick up right where you left off. Nothing resets.</span>
                        </div>
                        <div className="flex gap-2.5">
                          <span className="text-[#1a73e8] font-bold shrink-0">→</span>
                          <span><strong>Privacy:</strong> Your individual responses are confidential. Your broker sees coaching insights drawn from your results, not your word-for-word answers.</span>
                        </div>
                        <div className="flex gap-2.5">
                          <span className="text-[#1a73e8] font-bold shrink-0">→</span>
                          <span>This is the first step in a 180-day journey. You will check in again at 90 days and 180 days. Each time, you will see how you have grown.</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {introStep === 1 && (
                    <div className="flex flex-col items-center gap-6 pt-4">
                      <h2 className="text-[#1a1a2e] font-bold text-xl text-center">Ready to begin?</h2>
                      <button
                        type="button"
                        onClick={handleConsentToggle}
                        className={`flex items-center gap-3 w-full px-5 py-4 border-2 rounded-lg text-left transition-colors ${
                          consentChecked ? "border-[#1a73e8] bg-[#e8f0fe]" : "border-gray-300 hover:border-gray-400"
                        }`}
                      >
                        <span className={`w-6 h-6 rounded border-2 shrink-0 flex items-center justify-center transition-colors ${
                          consentChecked ? "border-[#1a73e8] bg-[#1a73e8]" : "border-gray-400"
                        }`}>
                          {consentChecked && (
                            <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </span>
                        <span className="text-gray-800 text-sm font-medium">I understand. Let me get started.</span>
                      </button>
                      {!consentChecked && (
                        <p className="text-gray-400 text-xs">Check the box above to continue.</p>
                      )}
                    </div>
                  )}

                  {introStep === 2 && (
                    <div className="flex flex-col gap-4">
                      <div className="text-center">
                        <h2 className="text-[#1a1a2e] font-bold text-xl">License #</h2>
                        <p className="text-gray-500 text-sm mt-1">Enter your real estate license number</p>
                      </div>
                      <input
                        type="text"
                        value={licenseNumber}
                        onChange={(e) => { setLicenseNumber(e.target.value); setLicenseError(false) }}
                        placeholder="e.g. 12345678"
                        className={`w-full px-4 py-3.5 border-2 rounded-lg text-gray-800 text-sm focus:outline-none transition-colors ${
                          licenseError ? "border-[#e53e3e] focus:border-[#e53e3e]" : "border-gray-300 focus:border-[#1a73e8]"
                        }`}
                      />
                      {licenseError && (
                        <p className="text-[#e53e3e] text-xs font-medium">License number is required.</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Intro footer */}
                <div className="bg-[#4caf50] px-6 py-3 flex items-center justify-between">
                  <button
                    onClick={handleIntroBack}
                    disabled={introStep === 0}
                    className="text-white font-semibold text-sm disabled:opacity-30 tracking-wide"
                  >
                    ← PREVIOUS
                  </button>
                  <button
                    onClick={handleIntroNext}
                    disabled={introStep === 1 && !consentChecked}
                    className="text-white font-semibold text-sm tracking-wide disabled:opacity-40"
                  >
                    {introStep === 0 ? "BEGIN →" : "CONTINUE →"}
                  </button>
                </div>
              </>
            ) : (
              /* ── Survey questions ── */
              <div>
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
                    disabled={current === 0 && role !== "agent"}
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
            )}
          </div>

          <SurveyProgressBar
            steps={allSteps}
            current={globalCurrent}
            onJump={handleGlobalJump}
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
              {allSteps.filter(s => s.answered).length} of {allSteps.length} answered
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
            {/* Intro step cards (agent only) */}
            {role === "agent" && ([0, 1, 2] as const).map((step) => {
              const globalIdx = step
              const isActive = globalIdx === globalCurrent
              return (
                <div
                  key={`intro-${step}`}
                  data-global={globalIdx}
                  className="shrink-0 flex flex-col items-center"
                  style={{ scrollSnapAlign: "center", width: 460 }}
                >
                  <div
                    className="text-center font-bold leading-none mb-3 select-none"
                    style={{
                      fontSize: "7rem",
                      color: isActive ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.18)",
                      letterSpacing: "-0.04em",
                    }}
                  >
                    {step + 1}
                  </div>
                  <button
                    onClick={() => { handleGlobalJump(globalIdx); setShowCarousel(false) }}
                    className={`w-full rounded-lg overflow-hidden shadow-xl text-left transition-all duration-200 ${
                      isActive ? "shadow-2xl scale-100" : "scale-95 opacity-80 hover:opacity-100 hover:scale-[0.97]"
                    }`}
                  >
                    <div className="bg-white px-6 py-6" style={{ minHeight: 240 }}>
                      <IntroCarouselPreview step={step} consentChecked={consentChecked} licenseNumber={licenseNumber} />
                    </div>
                    <div className="bg-[#4caf50] px-5 py-2.5 flex items-center justify-between">
                      <span className="text-white text-xs font-semibold tracking-wide">← PREVIOUS</span>
                      <span className="text-white text-xs font-semibold tracking-wide">NEXT →</span>
                    </div>
                  </button>
                </div>
              )
            })}

            {/* Survey question cards */}
            {questions.map((q, i) => {
              const globalIdx = INTRO_COUNT + i
              const isActive = globalIdx === globalCurrent
              const ans = answers[q.id]
              return (
                <div
                  key={q.id}
                  data-global={globalIdx}
                  className="shrink-0 flex flex-col items-center"
                  style={{ scrollSnapAlign: "center", width: 460 }}
                >
                  <div
                    className="text-center font-bold leading-none mb-3 select-none"
                    style={{
                      fontSize: "7rem",
                      color: isActive ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.18)",
                      letterSpacing: "-0.04em",
                    }}
                  >
                    {globalIdx + 1}
                  </div>
                  <button
                    onClick={() => { handleGlobalJump(globalIdx); setShowCarousel(false) }}
                    className={`w-full rounded-lg overflow-hidden shadow-xl text-left transition-all duration-200 ${
                      isActive ? "shadow-2xl scale-100" : "scale-95 opacity-80 hover:opacity-100 hover:scale-[0.97]"
                    }`}
                  >
                    <div className="bg-white px-6 py-6" style={{ minHeight: 240 }}>
                      <p className="text-[#1a1a2e] font-semibold text-[15px] leading-snug text-center mb-4">
                        {q.text}
                        {q.required && <span className="text-[#e53e3e]"> *</span>}
                      </p>
                      <CarouselCardPreview question={q} answer={ans} />
                    </div>
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
              steps={allSteps}
              current={globalCurrent}
              onJump={(i) => { handleGlobalJump(i); setShowCarousel(false) }}
              onShowAll={() => {}}
            />
          </div>
        </div>
      )}
    </>
  )
}

function IntroCarouselPreview({ step, consentChecked, licenseNumber }: {
  step: 0 | 1 | 2
  consentChecked: boolean
  licenseNumber: string
}) {
  if (step === 0) return (
    <div className="flex flex-col gap-3">
      <p className="text-[#1a1a2e] font-semibold text-[15px] leading-snug text-center">Your KasbyIQ Profile</p>
      <p className="text-gray-500 text-xs leading-relaxed line-clamp-5">
        Over the next 12 to 15 minutes, you will build a picture of how you work best: the kind of environment where you thrive, how you approach challenges, and what support actually moves the needle for you.
      </p>
      <div className="flex flex-col gap-1.5 text-xs text-gray-500">
        <div className="flex gap-2"><span className="text-[#1a73e8] font-bold shrink-0">→</span><span><strong>How this works:</strong> Each question advances on its own.</span></div>
        <div className="flex gap-2"><span className="text-[#1a73e8] font-bold shrink-0">→</span><span><strong>Progress saves automatically.</strong></span></div>
        <div className="flex gap-2"><span className="text-[#1a73e8] font-bold shrink-0">→</span><span><strong>Privacy:</strong> Individual responses are confidential.</span></div>
      </div>
    </div>
  )
  if (step === 1) return (
    <div className="flex flex-col gap-3">
      <p className="text-[#1a1a2e] font-semibold text-[15px] text-center">Ready to begin?<span className="text-[#e53e3e]"> *</span></p>
      <div className={`flex items-center gap-2 px-3 py-1.5 border rounded text-xs ${consentChecked ? "border-[#1a73e8] bg-[#e8f0fe]" : "border-gray-200"}`}>
        <span className={`w-3.5 h-3.5 rounded border-2 shrink-0 ${consentChecked ? "border-[#1a73e8] bg-[#1a73e8]" : "border-gray-400"}`} />
        <span className="text-gray-700">I understand. Let me get started.</span>
      </div>
    </div>
  )
  return (
    <div className="flex flex-col gap-3">
      <p className="text-[#1a1a2e] font-semibold text-[15px] text-center">License #</p>
      <p className="text-gray-500 text-xs text-center">Enter your real estate license number</p>
      <div className="px-3 py-2 border border-gray-200 rounded text-xs">
        {licenseNumber
          ? <span className="text-gray-700">{licenseNumber}</span>
          : <span className="text-gray-400">e.g. 12345678</span>}
      </div>
    </div>
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
