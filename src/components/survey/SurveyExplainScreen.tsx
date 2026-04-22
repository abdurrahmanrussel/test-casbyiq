"use client"

interface Props {
  role: "agent" | "broker"
  onNext: () => void
  onPrev: () => void
}

const AGENT_BODY = `Over the next 12 to 15 minutes, you will build a picture of how you work best: the kind of environment where you thrive, how you approach challenges, and what support actually moves the needle for you. Answer honestly. Your broker will use what you share to support you better. You will use it to understand yourself.`

const BROKER_BODY = `The questions ahead build your brokerage profile: the environment you have created, what it demands, and what it rewards. That profile becomes the foundation for every fit score your agents generate.`

const HOW_IT_WORKS = `Each question advances on its own once you answer. Just move at your own pace.`
const SAVE_NOTE = `Your progress saves automatically. If you need to stop and come back, pick up right where you left off. Nothing resets.`

const AGENT_PRIVACY = `Your individual responses are confidential. Your broker sees coaching insights drawn from your results, not your word-for-word answers.`
const BROKER_PRIVACY = `Your brokerage profile data is used only within KasbyIQ to generate fit scores and coaching recommendations. It is never shared outside your account. Agents do not see your responses or brokerage evaluation scores.`

const AGENT_JOURNEY = `This is the first step in a 180-day journey. You will check in again at 90 days and 180 days. Each time, you will see how you have grown.`

export function SurveyExplainScreen({ role, onNext, onPrev }: Props) {
  const body = role === "agent" ? AGENT_BODY : BROKER_BODY
  const privacy = role === "agent" ? AGENT_PRIVACY : BROKER_PRIVACY

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4"
         style={{ backgroundColor: "#1a73e8" }}>
      <div className="w-full max-w-2xl mx-auto rounded-lg overflow-hidden shadow-xl">
        <div className="bg-white px-8 py-8 space-y-5">
          <p className="text-gray-700 text-sm leading-relaxed">{body}</p>

          <div>
            <span className="font-semibold text-gray-800 text-sm">How this works: </span>
            <span className="text-gray-600 text-sm">{HOW_IT_WORKS}</span>
          </div>

          <p className="text-gray-600 text-sm leading-relaxed">{SAVE_NOTE}</p>

          <div>
            <span className="font-semibold text-gray-800 text-sm">Privacy: </span>
            <span className="text-gray-600 text-sm">{privacy}</span>
          </div>

          {role === "agent" && (
            <p className="text-gray-600 text-sm leading-relaxed">{AGENT_JOURNEY}</p>
          )}
        </div>

        <div className="bg-[#4caf50] px-6 py-3 flex items-center justify-between">
          <button
            onClick={onPrev}
            className="text-white font-semibold text-sm flex items-center gap-1"
          >
            ← PREVIOUS
          </button>
          <button
            onClick={onNext}
            className="text-white font-semibold text-sm flex items-center gap-1"
          >
            NEXT →
          </button>
        </div>
      </div>
    </div>
  )
}
