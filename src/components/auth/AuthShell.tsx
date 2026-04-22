"use client"

interface Props {
  children: React.ReactNode
  heading: string
  subheading: string
}

export function AuthShell({ children, heading, subheading }: Props) {
  return (
    <div className="min-h-screen flex">
      {/* ── Left brand panel ── */}
      <div className="hidden lg:flex lg:w-[44%] relative flex-col justify-between p-12 overflow-hidden"
           style={{ backgroundColor: "#0b1426" }}>

        {/* Animated mesh gradient */}
        <div className="mesh-bg absolute inset-0 opacity-40 pointer-events-none"
             style={{
               background: `
                 radial-gradient(ellipse 70% 60% at 20% 20%, #1a3a6e 0%, transparent 60%),
                 radial-gradient(ellipse 50% 50% at 80% 70%, #0d2a52 0%, transparent 55%),
                 radial-gradient(ellipse 60% 40% at 60% 10%, #163158 0%, transparent 50%)
               `
             }} />

        {/* Geometric grid decoration */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.06]"
             style={{
               backgroundImage: `
                 linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px),
                 linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)
               `,
               backgroundSize: "48px 48px"
             }} />

        {/* Top: Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                 style={{ backgroundColor: "#1a73e8" }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <rect x="2" y="8" width="3" height="6" rx="1" fill="white" />
                <rect x="6.5" y="5" width="3" height="9" rx="1" fill="white" />
                <rect x="11" y="2" width="3" height="12" rx="1" fill="white" />
              </svg>
            </div>
            <span className="text-white font-bold text-xl tracking-tight">KasbyIQ</span>
          </div>
        </div>

        {/* Middle: Value prop */}
        <div className="relative z-10 space-y-8">
          <div>
            <h2 className="text-white text-4xl font-extrabold leading-tight tracking-tight">
              Know who fits<br />
              <span style={{ color: "#5b9cf6" }}>before they walk in.</span>
            </h2>
            <p className="mt-4 text-base leading-relaxed" style={{ color: "#8ba8cc" }}>
              Predictive psychographic analytics that match agents to brokerage environments — before the first conversation.
            </p>
          </div>

          {/* Feature list */}
          <div className="space-y-4">
            {[
              { icon: "◈", label: "6-dimension fit scoring" },
              { icon: "◈", label: "Longitudinal agent profiles" },
              { icon: "◈", label: "Coaching interventions, role-matched" },
            ].map((f) => (
              <div key={f.label} className="flex items-center gap-3">
                <span className="text-xs" style={{ color: "#1a73e8" }}>{f.icon}</span>
                <span className="text-sm font-medium" style={{ color: "#c8daf4" }}>{f.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom: Stat strip */}
        <div className="relative z-10 flex gap-8 pt-8 border-t" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
          {[
            { value: "6", label: "Dimensions" },
            { value: "72", label: "Survey items" },
            { value: "2", label: "Dashboards" },
          ].map((s) => (
            <div key={s.label}>
              <div className="text-2xl font-extrabold" style={{ color: "#5b9cf6" }}>{s.value}</div>
              <div className="text-xs mt-0.5" style={{ color: "#5a7a9e" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 bg-white">
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-2 mb-10">
          <div className="w-7 h-7 rounded-md flex items-center justify-center" style={{ backgroundColor: "#0b1426" }}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <rect x="2" y="8" width="3" height="6" rx="1" fill="white" />
              <rect x="6.5" y="5" width="3" height="9" rx="1" fill="white" />
              <rect x="11" y="2" width="3" height="12" rx="1" fill="white" />
            </svg>
          </div>
          <span className="font-bold text-lg tracking-tight" style={{ color: "#0b1426" }}>KasbyIQ</span>
        </div>

        <div className="w-full max-w-sm">
          {/* Heading */}
          <div className="mb-8 fade-up fade-up-1">
            <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: "#0b1426" }}>
              {heading}
            </h1>
            <p className="mt-1.5 text-sm" style={{ color: "#6b7a99" }}>{subheading}</p>
          </div>

          {children}
        </div>
      </div>
    </div>
  )
}
