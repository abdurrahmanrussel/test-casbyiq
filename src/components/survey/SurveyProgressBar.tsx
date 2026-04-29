"use client"
import { useState } from "react"

export interface StepInfo {
  id: string
  answered: boolean
}

interface Props {
  steps: StepInfo[]
  current: number
  onJump: (globalIndex: number) => void
  onShowAll: () => void
}

export function SurveyProgressBar({ steps, current, onJump, onShowAll }: Props) {
  const [pillHovered, setPillHovered] = useState(false)
  const total = steps.length

  return (
    <div className="w-full mt-5 px-2">
      {/* Horizontal track */}
      <div className="relative mx-4" style={{ height: 28 }}>
        <div
          className="absolute left-0 right-0 bg-white/25 rounded-full"
          style={{ top: "50%", height: 2, transform: "translateY(-50%)" }}
        />
        <div
          className="absolute left-0 bg-[#4caf50]/50 rounded-full transition-all duration-300"
          style={{
            top: "50%",
            height: 2,
            transform: "translateY(-50%)",
            width: total > 1 ? `${(current / (total - 1)) * 100}%` : "0%",
          }}
        />

        {steps.map((step, i) => {
          const pct = total > 1 ? (i / (total - 1)) * 100 : 50
          const isCurrent = i === current
          const isPast = i < current

          return (
            <button
              key={step.id}
              onClick={() => onJump(i)}
              title={`${i + 1}`}
              style={{
                position: "absolute",
                left: `${pct}%`,
                top: "50%",
                transform: "translate(-50%, -50%)",
                zIndex: isCurrent ? 10 : 1,
              }}
              className="flex items-center justify-center hover:scale-150 transition-transform"
            >
              {isCurrent ? (
                <span
                  className="block rounded-full bg-white"
                  style={{ width: 18, height: 18, boxShadow: "0 0 0 3px white", border: "2.5px solid #1a73e8" }}
                />
              ) : step.answered ? (
                <span className="block rounded-full bg-[#4caf50]" style={{ width: 10, height: 10 }} />
              ) : isPast ? (
                <span className="block rounded-full bg-[#e53e3e]" style={{ width: 8, height: 8 }} />
              ) : (
                <span className="block rounded-full bg-white/35" style={{ width: 6, height: 6 }} />
              )}
            </button>
          )
        })}
      </div>

      {/* Counter pill */}
      <div className="flex justify-center mt-3 gap-2 items-center">
        <button
          onMouseEnter={() => setPillHovered(true)}
          onMouseLeave={() => setPillHovered(false)}
          onClick={onShowAll}
          className="flex items-center gap-2 rounded-full px-5 py-2 text-sm font-medium text-white transition-all hover:opacity-90 active:scale-95"
          style={{ backgroundColor: "rgba(11,20,38,0.82)", minWidth: 120, justifyContent: "center" }}
        >
          {pillHovered ? (
            <span>See All ▲</span>
          ) : (
            <>
              <span>{current + 1} of {total}</span>
              <svg className="w-3.5 h-3.5 opacity-60" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z"/>
              </svg>
            </>
          )}
        </button>
      </div>
    </div>
  )
}
