"use client"

interface Props {
  role: "agent" | "broker"
  onStart: () => void
}

const CONTENT = {
  agent: {
    heading: "Your Career Profile Starts Here.",
    sub: "This takes about 12 to 15 minutes. Your answers are confidential.",
    count: "78",
  },
  broker: {
    heading: "Know Your Environment. Develop Your People.",
    sub: "This takes about 12 to 15 minutes. Your answers are confidential.",
    count: "96",
  },
}

export function SurveyIntroScreen({ role, onStart }: Props) {
  const c = CONTENT[role]
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4"
         style={{ backgroundColor: "#1a73e8" }}>
      <div className="w-full max-w-2xl mx-auto rounded-lg overflow-hidden shadow-xl">
        <div className="bg-white px-10 py-12 text-center">
          <h1 className="text-3xl font-bold text-gray-900 leading-tight mb-3">
            {c.heading}
          </h1>
          <p className="text-gray-500 text-sm mb-6">{c.sub}</p>
          <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-full px-5 py-2 mb-10">
            <span className="text-2xl font-extrabold text-[#1a73e8]">{c.count}</span>
            <span className="text-sm font-medium text-[#1a73e8]">Questions</span>
          </div>
          <div>
            <button
              onClick={onStart}
              className="inline-flex items-center gap-2 bg-[#1a73e8] text-white font-bold text-sm px-8 py-3.5 rounded-lg hover:bg-[#1557b0] transition-colors"
            >
              Start
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </button>
          </div>
        </div>
        <div className="bg-[#4caf50] px-6 py-3" />
      </div>
    </div>
  )
}
