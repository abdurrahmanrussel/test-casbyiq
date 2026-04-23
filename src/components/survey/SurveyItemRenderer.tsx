"use client"
import { LIKERT_OPTIONS } from "@/lib/questions"

export interface SurveyQuestion {
  id: string
  text: string
  questionType: string
  options: unknown
  required: boolean
  isScored: boolean
  section: string
}

interface Props {
  question: SurveyQuestion
  answer: string | undefined
  onAnswer: (value: string) => void
}

function parseOptions(options: unknown): string[] {
  if (!options) return []
  if (Array.isArray(options)) return options as string[]
  return []
}

function parseChecked(answer: string | undefined): string[] {
  if (!answer) return []
  try { return JSON.parse(answer) } catch { return [] }
}

export function SurveyItemRenderer({ question, answer, onAnswer }: Props) {
  const opts = parseOptions(question.options)

  if (question.questionType === "likert") {
    return (
      <div className="flex flex-col gap-2">
        {LIKERT_OPTIONS.map((opt) => {
          const selected = answer === String(opt.value)
          return (
            <button
              key={opt.value}
              onClick={() => onAnswer(String(opt.value))}
              className={`flex items-center gap-3 w-full text-left px-4 py-3 border rounded transition-colors ${
                selected ? "border-[#1a73e8] bg-[#e8f0fe]" : "border-gray-300 hover:border-gray-400"
              }`}
            >
              <span className={`w-5 h-5 rounded-full border-2 shrink-0 transition-colors ${
                selected ? "border-[#1a73e8] bg-[#1a73e8]" : "border-gray-400"
              }`} />
              <span className="text-gray-800 text-sm">{opt.label}</span>
            </button>
          )
        })}
      </div>
    )
  }

  if (question.questionType === "scale") {
    const labels = opts.length === 5 ? opts : ["1", "2", "3", "4", "5"]
    return (
      <div className="flex flex-col gap-3">
        <div className="flex gap-2 justify-between">
          {labels.map((label, i) => {
            const val = String(i + 1)
            const selected = answer === val
            return (
              <button
                key={val}
                onClick={() => onAnswer(val)}
                className={`flex-1 flex flex-col items-center gap-1 px-2 py-3 border rounded transition-colors ${
                  selected ? "border-[#1a73e8] bg-[#e8f0fe]" : "border-gray-300 hover:border-gray-400"
                }`}
              >
                <span className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-semibold transition-colors ${
                  selected ? "border-[#1a73e8] bg-[#1a73e8] text-white" : "border-gray-400 text-gray-600"
                }`}>{i + 1}</span>
                <span className="text-gray-600 text-[10px] text-center leading-tight">{label}</span>
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  if (question.questionType === "multiple_choice") {
    return (
      <div className="flex flex-col gap-2">
        {opts.map((opt) => {
          const selected = answer === opt
          return (
            <button
              key={opt}
              onClick={() => onAnswer(opt)}
              className={`flex items-center gap-3 w-full text-left px-4 py-3 border rounded transition-colors ${
                selected ? "border-[#1a73e8] bg-[#e8f0fe]" : "border-gray-300 hover:border-gray-400"
              }`}
            >
              <span className={`w-5 h-5 rounded-full border-2 shrink-0 transition-colors ${
                selected ? "border-[#1a73e8] bg-[#1a73e8]" : "border-gray-400"
              }`} />
              <span className="text-gray-800 text-sm">{opt}</span>
            </button>
          )
        })}
      </div>
    )
  }

  if (question.questionType === "yes_no") {
    return (
      <div className="flex gap-3">
        {["Yes", "No"].map((opt) => {
          const selected = answer === opt
          return (
            <button
              key={opt}
              onClick={() => onAnswer(opt)}
              className={`flex-1 py-4 border-2 rounded-lg font-semibold text-sm transition-colors ${
                selected ? "border-[#1a73e8] bg-[#e8f0fe] text-[#1a73e8]" : "border-gray-300 text-gray-600 hover:border-gray-400"
              }`}
            >
              {opt}
            </button>
          )
        })}
      </div>
    )
  }

  if (question.questionType === "checkbox") {
    const checked = parseChecked(answer)
    function toggle(opt: string) {
      const next = checked.includes(opt) ? checked.filter((c) => c !== opt) : [...checked, opt]
      onAnswer(JSON.stringify(next))
    }
    return (
      <div className="flex flex-col gap-2">
        {opts.map((opt) => {
          const isChecked = checked.includes(opt)
          return (
            <button
              key={opt}
              onClick={() => toggle(opt)}
              className={`flex items-center gap-3 w-full text-left px-4 py-3 border rounded transition-colors ${
                isChecked ? "border-[#1a73e8] bg-[#e8f0fe]" : "border-gray-300 hover:border-gray-400"
              }`}
            >
              <span className={`w-5 h-5 rounded border-2 shrink-0 flex items-center justify-center transition-colors ${
                isChecked ? "border-[#1a73e8] bg-[#1a73e8]" : "border-gray-400"
              }`}>
                {isChecked && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
              </span>
              <span className="text-gray-800 text-sm">{opt}</span>
            </button>
          )
        })}
      </div>
    )
  }

  if (question.questionType === "rank") {
    const ranked: string[] = answer ? (() => { try { return JSON.parse(answer) } catch { return [] } })() : []
    const unranked = opts.filter((o) => !ranked.includes(o))
    function addToRank(opt: string) {
      onAnswer(JSON.stringify([...ranked, opt]))
    }
    function removeFromRank(opt: string) {
      onAnswer(JSON.stringify(ranked.filter((r) => r !== opt)))
    }
    return (
      <div className="flex flex-col gap-3">
        {ranked.length > 0 && (
          <div className="flex flex-col gap-1">
            <p className="text-xs text-gray-500 font-medium mb-1">Your ranking:</p>
            {ranked.map((opt, i) => (
              <button key={opt} onClick={() => removeFromRank(opt)}
                className="flex items-center gap-2 w-full text-left px-4 py-2 border border-[#1a73e8] bg-[#e8f0fe] rounded text-sm">
                <span className="w-5 h-5 rounded-full bg-[#1a73e8] text-white text-xs flex items-center justify-center shrink-0">{i + 1}</span>
                <span className="text-gray-800 flex-1">{opt}</span>
                <span className="text-gray-400 text-xs">✕</span>
              </button>
            ))}
          </div>
        )}
        {unranked.length > 0 && (
          <div className="flex flex-col gap-1">
            <p className="text-xs text-gray-500 font-medium mb-1">Tap to rank:</p>
            {unranked.map((opt) => (
              <button key={opt} onClick={() => addToRank(opt)}
                className="flex items-center gap-2 w-full text-left px-4 py-2 border border-gray-300 rounded text-sm hover:border-gray-400">
                <span className="w-5 h-5 rounded-full border-2 border-gray-400 shrink-0" />
                <span className="text-gray-800">{opt}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }

  if (question.questionType === "number") {
    return (
      <div className="flex flex-col gap-2">
        <input
          type="number"
          value={answer ?? ""}
          onChange={(e) => onAnswer(e.target.value)}
          placeholder="Enter a number"
          className="w-full px-4 py-3 border border-gray-300 rounded text-gray-800 text-sm focus:outline-none focus:border-[#1a73e8] focus:ring-2 focus:ring-[#1a73e8]/20"
        />
      </div>
    )
  }

  // text / fallback
  return (
    <div className="flex flex-col gap-2">
      <textarea
        value={answer ?? ""}
        onChange={(e) => onAnswer(e.target.value)}
        placeholder={question.required ? "Your answer..." : "Your answer (optional)"}
        rows={4}
        className="w-full px-4 py-3 border border-gray-300 rounded text-gray-800 text-sm focus:outline-none focus:border-[#1a73e8] focus:ring-2 focus:ring-[#1a73e8]/20 resize-none"
      />
    </div>
  )
}
