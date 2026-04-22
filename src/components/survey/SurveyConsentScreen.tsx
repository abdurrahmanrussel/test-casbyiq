"use client"
import { useState } from "react"

interface Props {
  role: "agent" | "broker"
  onNext: (data: { licenseNumber?: string }) => void
  onPrev: () => void
}

const BROKER_PARAS = [
  "The questions ahead build your brokerage profile: the environment you have created, what it demands, and what it rewards. That profile becomes the foundation for every fit score your agents generate.",
  "How this works: Each question advances automatically once you respond. Just move at your own pace.",
  "Your progress saves automatically. Step away and come back anytime. Your answers will be waiting.",
  "Privacy: Your brokerage profile data is used only within KasbyIQ to generate fit scores and coaching recommendations. It is never shared outside your account. Agents do not see your responses or brokerage evaluation scores.",
]

export function SurveyConsentScreen({ role, onNext, onPrev }: Props) {
  const [checked, setChecked] = useState(false)
  const [license, setLicense] = useState("")
  const [error, setError] = useState("")

  function handleNext() {
    if (!checked) { setError("This field is required."); return }
    if (role === "agent" && !license.trim()) { setError("License number is required."); return }
    setError("")
    onNext({ licenseNumber: role === "agent" ? license.trim() : undefined })
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4"
         style={{ backgroundColor: "#1a73e8" }}>
      <div className="w-full max-w-2xl mx-auto rounded-lg overflow-hidden shadow-xl">
        <div className="bg-white px-8 py-8 space-y-5">
          <p className="text-[#e53e3e] font-semibold text-base">
            Ready to begin?<span className="text-[#e53e3e]">*</span>
            <span className="text-gray-400 text-xs font-normal ml-2">This field is required.</span>
          </p>

          {role === "broker" && (
            <div className="space-y-3">
              {BROKER_PARAS.map((para, i) => (
                <p key={i} className="text-sm text-gray-600 leading-relaxed">{para}</p>
              ))}
            </div>
          )}

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={checked}
              onChange={(e) => { setChecked(e.target.checked); setError("") }}
              className="mt-0.5 w-4 h-4 accent-[#1a73e8] cursor-pointer"
            />
            <span className="text-sm text-gray-800 font-medium select-none">
              {role === "agent" ? "I understand" : "I understand, Let me get started"}
            </span>
          </label>

          {role === "agent" && (
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                License #
              </label>
              <input
                type="text"
                value={license}
                onChange={(e) => { setLicense(e.target.value); setError("") }}
                placeholder="Enter your real estate license number"
                className="w-full border border-gray-300 rounded px-3 py-2.5 text-sm focus:outline-none focus:border-[#1a73e8] focus:ring-2 focus:ring-[#1a73e8]/20"
              />
            </div>
          )}
        </div>

        <div className="bg-[#4caf50] px-6 py-3 flex items-center justify-between">
          <button onClick={onPrev} className="text-white font-semibold text-sm flex items-center gap-1">
            ← PREVIOUS
          </button>
          {error ? (
            <span className="bg-[#e53e3e] text-white text-xs font-medium px-3 py-1.5 rounded">
              {error}
            </span>
          ) : (
            <span />
          )}
          <button onClick={handleNext} className="text-white font-semibold text-sm flex items-center gap-1">
            NEXT →
          </button>
        </div>
      </div>
    </div>
  )
}
