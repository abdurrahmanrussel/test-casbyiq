"use client"

interface Props {
  current: number
  total: number
}

export function ProgressDots({ current, total }: Props) {
  return (
    <div className="flex items-center gap-2 mt-6">
      {Array.from({ length: total }).map((_, i) => {
        const completed = i < current
        const active = i === current
        return (
          <span
            key={i}
            className={`rounded-full transition-all ${
              completed
                ? "w-4 h-4 bg-[#4caf50]"
                : active
                ? "w-4 h-4 border-2 border-white bg-transparent ring-2 ring-white"
                : "w-3 h-3 border border-white opacity-50"
            }`}
          />
        )
      })}
    </div>
  )
}
