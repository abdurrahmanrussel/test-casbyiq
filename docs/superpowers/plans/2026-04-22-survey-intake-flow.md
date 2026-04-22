# Survey Intake Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add multi-screen intro/consent/intake phases before the existing 5 Likert questions, for both agent and broker roles.

**Architecture:** SurveyFlow gains a `phase` state machine (intro → explain → consent → [intake for broker] → questions). A new `IntakeQuestion` type covers text/date/dropdown/radio inputs. All answers (Likert + intake) are stored as strings in SurveyResponse so a single DB table handles everything.

**Tech Stack:** Next.js 14 App Router, Prisma v7 + @prisma/adapter-pg, NextAuth v5, Tailwind CSS v4, TypeScript

---

## File Map

| File | Action | Purpose |
|---|---|---|
| `prisma/schema.prisma` | Modify | Change `answer Int` → `answer String` |
| `src/app/api/survey/answer/route.ts` | Modify | Accept string answers instead of 1–5 integers |
| `src/lib/questions.ts` | Modify | Add `IntakeQuestion` type + all broker/agent intake questions |
| `src/components/survey/SurveyIntroScreen.tsx` | Create | Welcome screen (Start button) |
| `src/components/survey/SurveyExplainScreen.tsx` | Create | Explanation + privacy screen (Next button) |
| `src/components/survey/SurveyConsentScreen.tsx` | Create | Consent checkbox + license field (agent) or repeated text (broker) |
| `src/components/survey/SurveyIntakeQuestion.tsx` | Create | JotForm-style card for text/date/dropdown/radio intake questions |
| `src/components/survey/SurveyFlow.tsx` | Modify | Phase state machine wiring all screens together |

---

## Task 1: Schema — change answer to String

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Update schema**

Replace in `prisma/schema.prisma`:
```prisma
model SurveyResponse {
  id         String   @id @default(uuid())
  userId     String
  user       User     @relation(fields: [userId], references: [id])
  questionId String
  answer     String
  createdAt  DateTime @default(now())

  @@unique([userId, questionId])
}
```

- [ ] **Step 2: Run migration**

```bash
npx prisma migrate dev --name answer-string
```

Expected output: `The following migration(s) have been applied: 20..._answer-string`

- [ ] **Step 3: Verify Prisma client regenerated**

```bash
npx prisma generate
```

Expected: `Generated Prisma Client`

- [ ] **Step 4: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat: change SurveyResponse.answer from Int to String"
```

---

## Task 2: Update answer API to accept strings

**Files:**
- Modify: `src/app/api/survey/answer/route.ts`

- [ ] **Step 1: Rewrite the route**

```ts
import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  const { questionId, answer } = body ?? {}

  if (!questionId || typeof answer !== "string" || !answer.trim()) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
  }

  await prisma.surveyResponse.upsert({
    where: { userId_questionId: { userId: session.user.id, questionId } },
    update: { answer },
    create: { userId: session.user.id, questionId, answer },
  })

  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/survey/answer/route.ts
git commit -m "feat: update answer API to accept string values"
```

---

## Task 3: Add intake question types and definitions

**Files:**
- Modify: `src/lib/questions.ts`

- [ ] **Step 1: Rewrite the file**

```ts
export type QuestionType = "likert" | "text" | "date" | "dropdown" | "radio"

export interface Question {
  id: string
  text: string
  type: "likert"
}

export interface IntakeQuestion {
  id: string
  text: string
  type: Exclude<QuestionType, "likert">
  required: boolean
  placeholder?: string
  options?: { value: string; label: string }[]
  conditional?: { dependsOn: string; showWhen: string[] }
}

export const LIKERT_OPTIONS = [
  { value: "1", label: "1 - Strongly Disagree" },
  { value: "2", label: "2 - Disagree" },
  { value: "3", label: "3 - Neither Agree nor Disagree" },
  { value: "4", label: "4 - Agree" },
  { value: "5", label: "5 - Strongly Agree" },
]

const YEARS_OPTIONS = [
  { value: "less_than_1", label: "Less than 1 year" },
  { value: "1_3", label: "1–3 years" },
  { value: "4_7", label: "4–7 years" },
  { value: "8_15", label: "8–15 years" },
  { value: "15_plus", label: "15+ years" },
]

export const US_STATES = [
  { value: "AL", label: "Alabama" }, { value: "AK", label: "Alaska" },
  { value: "AZ", label: "Arizona" }, { value: "AR", label: "Arkansas" },
  { value: "CA", label: "California" }, { value: "CO", label: "Colorado" },
  { value: "CT", label: "Connecticut" }, { value: "DE", label: "Delaware" },
  { value: "FL", label: "Florida" }, { value: "GA", label: "Georgia" },
  { value: "HI", label: "Hawaii" }, { value: "ID", label: "Idaho" },
  { value: "IL", label: "Illinois" }, { value: "IN", label: "Indiana" },
  { value: "IA", label: "Iowa" }, { value: "KS", label: "Kansas" },
  { value: "KY", label: "Kentucky" }, { value: "LA", label: "Louisiana" },
  { value: "ME", label: "Maine" }, { value: "MD", label: "Maryland" },
  { value: "MA", label: "Massachusetts" }, { value: "MI", label: "Michigan" },
  { value: "MN", label: "Minnesota" }, { value: "MS", label: "Mississippi" },
  { value: "MO", label: "Missouri" }, { value: "MT", label: "Montana" },
  { value: "NE", label: "Nebraska" }, { value: "NV", label: "Nevada" },
  { value: "NH", label: "New Hampshire" }, { value: "NJ", label: "New Jersey" },
  { value: "NM", label: "New Mexico" }, { value: "NY", label: "New York" },
  { value: "NC", label: "North Carolina" }, { value: "ND", label: "North Dakota" },
  { value: "OH", label: "Ohio" }, { value: "OK", label: "Oklahoma" },
  { value: "OR", label: "Oregon" }, { value: "PA", label: "Pennsylvania" },
  { value: "RI", label: "Rhode Island" }, { value: "SC", label: "South Carolina" },
  { value: "SD", label: "South Dakota" }, { value: "TN", label: "Tennessee" },
  { value: "TX", label: "Texas" }, { value: "UT", label: "Utah" },
  { value: "VT", label: "Vermont" }, { value: "VA", label: "Virginia" },
  { value: "WA", label: "Washington" }, { value: "WV", label: "West Virginia" },
  { value: "WI", label: "Wisconsin" }, { value: "WY", label: "Wyoming" },
]

// Agent license is collected on the consent screen, not as a separate intake step.
// Agent skips the intake phase entirely.
export const agentIntakeQuestions: IntakeQuestion[] = []

export const brokerIntakeQuestions: IntakeQuestion[] = [
  {
    id: "INTAKE_ORG_NAME",
    text: "Organization Name",
    type: "text",
    required: true,
    placeholder: "Enter your brokerage or team name",
  },
  {
    id: "INTAKE_EST_DATE",
    text: "Brokerage Established Date",
    type: "date",
    required: true,
  },
  {
    id: "INTAKE_MLS",
    text: "Market / MLS",
    type: "text",
    required: true,
    placeholder: "Enter the primary market or MLS your brokerage operates in",
  },
  {
    id: "INTAKE_ORG_TYPE",
    text: "Organization Type",
    type: "radio",
    required: true,
    options: [
      { value: "brokerage", label: "Brokerage (independent or franchise)" },
      { value: "team_within", label: "Team operating within a brokerage" },
      { value: "expansion_team", label: "Expansion team (multi-market)" },
      { value: "hybrid", label: "Hybrid (team + brokerage functions)" },
    ],
  },
  {
    id: "INTAKE_PARENT_BROKERAGE",
    text: "If a Team: Parent Brokerage Name",
    type: "text",
    required: false,
    placeholder: "Enter parent brokerage name",
    conditional: {
      dependsOn: "INTAKE_ORG_TYPE",
      showWhen: ["team_within", "expansion_team", "hybrid"],
    },
  },
  {
    id: "INTAKE_CITY",
    text: "Primary Market / City",
    type: "text",
    required: true,
    placeholder: "Enter your primary city or market",
  },
  {
    id: "INTAKE_STATE",
    text: "State",
    type: "dropdown",
    required: true,
    options: US_STATES,
  },
  {
    id: "INTAKE_AGENT_COUNT",
    text: "Approximate Number of Agents in This Organization",
    type: "radio",
    required: true,
    options: [
      { value: "1_5", label: "1–5" },
      { value: "6_15", label: "6–15" },
      { value: "16_30", label: "16–30" },
      { value: "31_50", label: "31–50" },
      { value: "50_plus", label: "50+" },
    ],
  },
  {
    id: "INTAKE_YEARS_RE",
    text: "Total years in real estate",
    type: "dropdown",
    required: true,
    options: YEARS_OPTIONS,
  },
  {
    id: "INTAKE_YEARS_ROLE",
    text: "Years in current role",
    type: "dropdown",
    required: true,
    options: YEARS_OPTIONS,
  },
  {
    id: "INTAKE_BROKER_ROLE",
    text: "Your role at the brokerage",
    type: "dropdown",
    required: true,
    options: [
      { value: "broker_owner", label: "Broker-Owner" },
      { value: "managing_broker", label: "Managing Broker (non-owner)" },
      { value: "team_leader", label: "Team Leader" },
      { value: "office_manager", label: "Office Manager" },
      { value: "other", label: "Other" },
    ],
  },
]

export const agentQuestions: Question[] = [
  { id: "AUT_A1", text: "I perform better when I can decide how to approach my work.", type: "likert" },
  { id: "COM_A1", text: "I feel unsettled if I go long periods without specific feedback on my work.", type: "likert" },
  { id: "REL_A1", text: "Extended periods of working independently reduce my motivation.", type: "likert" },
  { id: "GRIT_A1", text: "I continue working toward goals even when progress is slow or unclear.", type: "likert" },
  { id: "SR_A1", text: "I follow a consistent structure when completing my responsibilities.", type: "likert" },
]

export const brokerQuestions: Question[] = [
  { id: "AUT_B1", text: "This brokerage allows individuals to decide how they approach their work.", type: "likert" },
  { id: "COM_B1", text: "This brokerage provides specific actionable feedback that helps people understand how they are performing.", type: "likert" },
  { id: "REL_B1", text: "This brokerage fosters meaningful connection among the people who work here.", type: "likert" },
  { id: "GRIT_B1", text: "Agents here are expected to maintain consistent outreach even during extended slow periods.", type: "likert" },
  { id: "SR_B1", text: "Clear weekly activity expectations are defined for agents here.", type: "likert" },
]
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/questions.ts
git commit -m "feat: add IntakeQuestion type and broker/agent intake question definitions"
```

---

## Task 4: SurveyIntroScreen component

**Files:**
- Create: `src/components/survey/SurveyIntroScreen.tsx`

- [ ] **Step 1: Create the component**

```tsx
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
```

- [ ] **Step 2: Commit**

```bash
git add src/components/survey/SurveyIntroScreen.tsx
git commit -m "feat: add SurveyIntroScreen welcome component"
```

---

## Task 5: SurveyExplainScreen component

**Files:**
- Create: `src/components/survey/SurveyExplainScreen.tsx`

- [ ] **Step 1: Create the component**

```tsx
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
```

- [ ] **Step 2: Commit**

```bash
git add src/components/survey/SurveyExplainScreen.tsx
git commit -m "feat: add SurveyExplainScreen explanation component"
```

---

## Task 6: SurveyConsentScreen component

**Files:**
- Create: `src/components/survey/SurveyConsentScreen.tsx`

- [ ] **Step 1: Create the component**

```tsx
"use client"
import { useState } from "react"

interface Props {
  role: "agent" | "broker"
  onNext: (data: { licenseNumber?: string }) => void
  onPrev: () => void
}

const BROKER_BODY = `The questions ahead build your brokerage profile: the environment you have created, what it demands, and what it rewards. That profile becomes the foundation for every fit score your agents generate.\n\nHow this works: Each question advances automatically once you respond. Just move at your own pace.\n\nYour progress saves automatically. Step away and come back anytime. Your answers will be waiting.\n\nPrivacy: Your brokerage profile data is used only within KasbyIQ to generate fit scores and coaching recommendations. It is never shared outside your account. Agents do not see your responses or brokerage evaluation scores.`

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
            <span className="text-gray-500 text-xs font-normal ml-2">This field is required.</span>
          </p>

          {role === "broker" && (
            <div className="space-y-3 text-sm text-gray-600 leading-relaxed">
              {BROKER_BODY.split("\n\n").map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          )}

          <label className="flex items-start gap-3 cursor-pointer group">
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

          {error && (
            <p className="text-[#e53e3e] text-xs font-medium">{error}</p>
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
```

- [ ] **Step 2: Commit**

```bash
git add src/components/survey/SurveyConsentScreen.tsx
git commit -m "feat: add SurveyConsentScreen with consent checkbox and license field"
```

---

## Task 7: SurveyIntakeQuestion component

**Files:**
- Create: `src/components/survey/SurveyIntakeQuestion.tsx`

- [ ] **Step 1: Create the component**

```tsx
"use client"
import { IntakeQuestion, US_STATES } from "@/lib/questions"

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
      <div className="bg-white px-8 py-8 min-h-[320px]">
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
                  <span className={`w-5 h-5 rounded-full border-2 flex-shrink-0 transition-colors ${
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
```

- [ ] **Step 2: Commit**

```bash
git add src/components/survey/SurveyIntakeQuestion.tsx
git commit -m "feat: add SurveyIntakeQuestion component for text/date/dropdown/radio inputs"
```

---

## Task 8: Update SurveyFlow with phase state machine

**Files:**
- Modify: `src/components/survey/SurveyFlow.tsx`

- [ ] **Step 1: Rewrite the file**

```tsx
"use client"
import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Question, IntakeQuestion } from "@/lib/questions"
import { SurveyIntroScreen } from "./SurveyIntroScreen"
import { SurveyExplainScreen } from "./SurveyExplainScreen"
import { SurveyConsentScreen } from "./SurveyConsentScreen"
import { SurveyIntakeQuestion } from "./SurveyIntakeQuestion"
import { SurveyQuestion } from "./SurveyQuestion"
import { ProgressDots } from "./ProgressDots"

type Phase = "intro" | "explain" | "consent" | "intake" | "questions"

interface Props {
  questions: Question[]
  intakeQuestions: IntakeQuestion[]
  role: "agent" | "broker"
}

async function saveAnswer(questionId: string, answer: string) {
  await fetch("/api/survey/answer", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ questionId, answer }),
  })
}

export function SurveyFlow({ questions, intakeQuestions, role }: Props) {
  const [phase, setPhase] = useState<Phase>("intro")
  const [intakeIndex, setIntakeIndex] = useState(0)
  const [intakeAnswers, setIntakeAnswers] = useState<Record<string, string>>({})
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [error, setError] = useState(false)
  const router = useRouter()
  const { update } = useSession()

  // Filter intake questions: hide conditional ones whose condition is not met
  const visibleIntake = useMemo(() => {
    return intakeQuestions.filter((q) => {
      if (!q.conditional) return true
      return q.conditional.showWhen.includes(intakeAnswers[q.conditional.dependsOn] ?? "")
    })
  }, [intakeQuestions, intakeAnswers])

  const intakeQuestion = visibleIntake[intakeIndex]
  const likertQuestion = questions[current]
  const isLastLikert = current === questions.length - 1

  // ── Phase transitions ──

  function handleStart() { setPhase("explain") }
  function handleExplainNext() { setPhase("consent") }
  function handleExplainPrev() { setPhase("intro") }
  function handleConsentPrev() { setPhase("explain") }

  async function handleConsentNext({ licenseNumber }: { licenseNumber?: string }) {
    await saveAnswer("INTAKE_CONSENT", "true")
    if (licenseNumber) {
      await saveAnswer("AGENT_LICENSE", licenseNumber)
    }
    if (role === "broker" && visibleIntake.length > 0) {
      setPhase("intake")
    } else {
      setPhase("questions")
    }
  }

  async function handleIntakeNext() {
    const answer = intakeAnswers[intakeQuestion.id] ?? ""
    if (intakeQuestion.required && !answer.trim()) { setError(true); return }
    setError(false)
    await saveAnswer(intakeQuestion.id, answer)
    if (intakeIndex < visibleIntake.length - 1) {
      setIntakeIndex((i) => i + 1)
    } else {
      setPhase("questions")
    }
  }

  function handleIntakePrev() {
    setError(false)
    if (intakeIndex > 0) {
      setIntakeIndex((i) => i - 1)
    } else {
      setPhase("consent")
    }
  }

  async function handleLikertNext() {
    const answer = answers[likertQuestion.id]
    if (!answer) { setError(true); return }
    setError(false)
    await saveAnswer(likertQuestion.id, String(answer))
    if (isLastLikert) {
      await fetch("/api/survey/complete", { method: "POST" })
      await update({ surveyCompleted: true })
      router.push(`/dashboard/${role}`)
    } else {
      setCurrent((c) => c + 1)
    }
  }

  function handleLikertPrev() {
    setError(false)
    if (current > 0) {
      setCurrent((c) => c - 1)
    } else if (role === "broker" && visibleIntake.length > 0) {
      setPhase("intake")
      setIntakeIndex(visibleIntake.length - 1)
    } else {
      setPhase("consent")
    }
  }

  // ── Render ──

  if (phase === "intro") {
    return <SurveyIntroScreen role={role} onStart={handleStart} />
  }

  if (phase === "explain") {
    return <SurveyExplainScreen role={role} onNext={handleExplainNext} onPrev={handleExplainPrev} />
  }

  if (phase === "consent") {
    return <SurveyConsentScreen role={role} onNext={handleConsentNext} onPrev={handleConsentPrev} />
  }

  if (phase === "intake" && intakeQuestion) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4"
           style={{ backgroundColor: "#1a73e8" }}>
        <SurveyIntakeQuestion
          question={intakeQuestion}
          answer={intakeAnswers[intakeQuestion.id] ?? ""}
          onAnswer={(val) => {
            setIntakeAnswers((a) => ({ ...a, [intakeQuestion.id]: val }))
            setError(false)
          }}
          onNext={handleIntakeNext}
          onPrev={handleIntakePrev}
          canGoPrev={true}
          error={error}
          current={intakeIndex}
          total={visibleIntake.length}
        />
      </div>
    )
  }

  // questions phase
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4"
         style={{ backgroundColor: "#1a73e8" }}>
      <SurveyQuestion
        question={likertQuestion}
        answer={answers[likertQuestion.id]}
        onAnswer={(val) => {
          setAnswers((a) => ({ ...a, [likertQuestion.id]: val }))
          setError(false)
        }}
        error={error}
        onNext={handleLikertNext}
        onPrev={handleLikertPrev}
        canGoPrev={true}
        current={current}
        total={questions.length}
      />
      <ProgressDots current={current} total={questions.length} />
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/survey/SurveyFlow.tsx
git commit -m "feat: add phase state machine to SurveyFlow (intro → explain → consent → intake → questions)"
```

---

## Task 9: Update SurveyQuestion for string-based LIKERT_OPTIONS + update survey page

**Files:**
- Modify: `src/components/survey/SurveyQuestion.tsx`
- Modify: `src/app/onboarding/survey/page.tsx`

- [ ] **Step 1: Update SurveyQuestion to use string option values**

`LIKERT_OPTIONS` now has `value: string` (was `number`). Update props and rendering in `src/components/survey/SurveyQuestion.tsx`:

```tsx
"use client"
import { LIKERT_OPTIONS, Question } from "@/lib/questions"

interface Props {
  question: Question
  answer: number | undefined
  onAnswer: (value: number) => void
  error: boolean
  onNext: () => void
  onPrev: () => void
  canGoPrev: boolean
  current: number
  total: number
}

export function SurveyQuestion({
  question,
  answer,
  onAnswer,
  error,
  onNext,
  onPrev,
  canGoPrev,
  current,
  total,
}: Props) {
  return (
    <div className="w-full max-w-2xl mx-auto rounded-lg overflow-hidden shadow-xl">
      <div className="bg-white px-8 py-8 min-h-[320px]">
        <p className="text-[#e53e3e] font-semibold text-xl leading-snug mb-6">
          {question.text}
          <span className="text-[#e53e3e]"> *</span>
        </p>
        <div className="flex flex-col gap-2">
          {LIKERT_OPTIONS.map((opt) => {
            const selected = answer === Number(opt.value)
            return (
              <button
                key={opt.value}
                onClick={() => onAnswer(Number(opt.value))}
                className={`flex items-center gap-3 w-full text-left px-4 py-3 border rounded transition-colors ${
                  selected ? "border-[#1a73e8] bg-[#e8f0fe]" : "border-gray-300 hover:border-gray-400"
                }`}
              >
                <span className={`w-5 h-5 rounded-full border-2 flex-shrink-0 transition-colors ${
                  selected ? "border-[#1a73e8] bg-[#1a73e8]" : "border-gray-400"
                }`} />
                <span className="text-gray-800 text-sm">{opt.label}</span>
              </button>
            )
          })}
        </div>
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
```

- [ ] **Step 2: Update survey page to pass intakeQuestions prop**

```tsx
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { SurveyFlow } from "@/components/survey/SurveyFlow"
import { agentQuestions, brokerQuestions, agentIntakeQuestions, brokerIntakeQuestions } from "@/lib/questions"

export default async function SurveyPage() {
  const session = await auth()
  if (!session) redirect("/login")
  if (session.user.surveyCompleted) redirect(`/dashboard/${session.user.role}`)

  const isAgent = session.user.role === "agent"
  const questions = isAgent ? agentQuestions : brokerQuestions
  const intakeQuestions = isAgent ? agentIntakeQuestions : brokerIntakeQuestions

  return <SurveyFlow questions={questions} intakeQuestions={intakeQuestions} role={session.user.role} />
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/survey/SurveyQuestion.tsx src/app/onboarding/survey/page.tsx
git commit -m "feat: wire intake questions into survey page and fix Likert option types"
```

---

## Task 10: Verify end-to-end and push

- [ ] **Step 1: Run the dev server**

```bash
npm run dev
```

- [ ] **Step 2: Test agent flow**

1. Register a new agent account (or use retake survey button)
2. Go to `/onboarding/survey`
3. Confirm screens: Intro → Explain → Consent + License field → 5 Likert questions → Agent dashboard
4. Confirm DB: open pgAdmin or `npx prisma studio`, check `SurveyResponse` table has rows for `INTAKE_CONSENT`, `AGENT_LICENSE`, and `AUT_A1`–`SR_A1` with string values

- [ ] **Step 3: Test broker flow**

1. Register a new broker account
2. Go to `/onboarding/survey`
3. Confirm screens: Intro → Explain → Consent → 11 intake questions (with Parent Brokerage conditional on org type) → 5 Likert → Broker dashboard
4. Check org type = "brokerage" hides Parent Brokerage field; "team_within" shows it

- [ ] **Step 4: Push**

```bash
git push origin main
```
