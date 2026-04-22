"use client"
import { IntakeQuestion } from "@/lib/questions"

interface Props {
  question: IntakeQuestion
  answer: string
  onAnswer: (value: string) => void
  onNext: () => void
  onPrev: () => void
  canGoPrev: boolean
  error: boolean
  current: number
  total: number
}

export function SurveyIntakeQuestion({
  question,
  answer,
  onAnswer,
  onNext,
  onPrev,
  canGoPrev,
  error,
  current,
  total,
}: Props) {
  return (
    <div className="w-full max-w-2xl mx-auto rounded-lg overflow-hidden shadow-xl">
      <div className="bg-white px-8 py-8 min-h-80">
        <p className="text-[#e53e3e] font-semibold text-xl leading-snug mb-6">
          {question.text}
          {question.required && <span className="text-[#e53e3e]"> *</span>}
        </p>

        {question.type === "text" && (
          <input
            type="text"
            value={answer}
            onChange={(e) => onAnswer(e.target.value)}
            placeholder={question.placeholder}
            className="w-full border border-gray-300 rounded px-3 py-2.5 text-sm focus:outline-none focus:border-[#1a73e8] focus:ring-2 focus:ring-[#1a73e8]/20"
          />
        )}

        {question.type === "date" && (
          <input
            type="date"
            value={answer}
            onChange={(e) => onAnswer(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2.5 text-sm focus:outline-none focus:border-[#1a73e8] focus:ring-2 focus:ring-[#1a73e8]/20"
          />
        )}

        {question.type === "dropdown" && (
          <select
            value={answer}
            onChange={(e) => onAnswer(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2.5 text-sm focus:outline-none focus:border-[#1a73e8] focus:ring-2 focus:ring-[#1a73e8]/20 bg-white"
          >
            <option value="">Please Select</option>
            {question.options?.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        )}

        {question.type === "radio" && (
          <div className="flex flex-col gap-2">
            {question.options?.map((opt) => {
              const selected = answer === opt.value
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => onAnswer(opt.value)}
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
        )}
      </div>

      <div className="bg-[#4caf50] px-6 py-3 flex items-center justify-between">
        <button
          onClick={onPrev}
          disabled={!canGoPrev}
          className="text-white font-semibold text-sm disabled:opacity-40 flex items-center gap-1"
        >
          ← PREVIOUS
        </button>

        {error ? (
          <span className="bg-[#e53e3e] text-white text-xs font-medium px-3 py-1.5 rounded">
            This field is required.
          </span>
        ) : (
          <span className="text-white text-xs opacity-70">{current + 1} of {total}</span>
        )}

        <button
          onClick={onNext}
          className="text-white font-semibold text-sm flex items-center gap-1"
        >
          NEXT →
        </button>
      </div>
    </div>
  )
}
