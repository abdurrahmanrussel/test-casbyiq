# Scoring & Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build fit score calculation at survey submission + replace both placeholder dashboards with the full warm-minimal UI from the approved mockup.

**Architecture:** Scores are calculated inline inside `/api/survey/complete` and stored in a new `ScoreResult` table (one row per user). Dashboards are server components that read pre-calculated scores from the DB. Broker agent management uses a client component (`ManageAgents`) backed by two API routes, with `router.refresh()` to re-render the server component after changes.

**Tech Stack:** Next.js 16 · Prisma v7 + @prisma/adapter-pg · NextAuth v5 · Tailwind v4 · Jest

---

## File Map

**Created:**
- `src/lib/scoring.ts` — pure scoring function, no DB access, fully testable
- `src/app/api/broker/add-agent/route.ts` — link agent to broker by email
- `src/app/api/broker/remove-agent/route.ts` — unlink agent from broker
- `src/app/dashboard/layout.tsx` — DM Sans + DM Mono fonts scoped to dashboard pages
- `src/components/dashboard/ManageAgents.tsx` — client component (email input + agent list)
- `__tests__/lib/scoring.test.ts`
- `__tests__/api/broker-add-agent.test.ts`
- `__tests__/api/broker-remove-agent.test.ts`

**Modified:**
- `prisma/schema.prisma` — add `brokerId` on User, add `ScoreResult` model
- `src/app/api/survey/complete/route.ts` — calculate + store scores in transaction
- `src/app/dashboard/agent/page.tsx` — full replacement
- `src/app/dashboard/broker/page.tsx` — full replacement
- `__tests__/api/survey-complete.test.ts` — rewrite for new behaviour

---

### Task 1: Schema — brokerId + ScoreResult

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Update schema.prisma**

Replace the existing `User` model and add `ScoreResult`. The full updated schema:

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
}

enum Role {
  agent
  broker
}

model User {
  id              String          @id @default(uuid())
  email           String          @unique
  passwordHash    String
  role            Role
  surveyCompleted Boolean         @default(false)
  createdAt       DateTime        @default(now())
  brokerId        String?
  broker          User?           @relation("BrokerAgents", fields: [brokerId], references: [id])
  agents          User[]          @relation("BrokerAgents")
  surveyResponses SurveyResponse[]
  scoreResult     ScoreResult?
}

model Question {
  id            String   @id
  text          String
  role          Role
  surveyType    String   @default("agent_intake")
  section       String   @default("1A")
  questionType  String   @default("likert")
  dimension     String?
  isScored      Boolean  @default(false)
  options       Json?
  required      Boolean  @default(true)
  sortOrder     Int
  storageTarget String   @default("raw_json")
  notes         String?
}

model SurveyResponse {
  id         String   @id @default(uuid())
  userId     String
  user       User     @relation(fields: [userId], references: [id])
  questionId String
  answer     String
  createdAt  DateTime @default(now())

  @@unique([userId, questionId])
}

model ScoreResult {
  id               String   @id @default(uuid())
  userId           String   @unique
  user             User     @relation(fields: [userId], references: [id])
  surveyType       String
  autonomyScore    Float
  competenceScore  Float
  relatednessScore Float
  gritScore        Float
  selfRegScore     Float
  eiScore          Float
  overallScore     Float
  createdAt        DateTime @default(now())
}
```

- [ ] **Step 2: Run migration**

```bash
npx prisma migrate dev --name add_broker_agent_score
```

Expected: migration file created, DB updated, Prisma client regenerated with new types.

- [ ] **Step 3: Verify client has new types**

```bash
npx tsc --noEmit
```

Expected: no errors referencing `brokerId` or `scoreResult`.

- [ ] **Step 4: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat: add brokerId and ScoreResult to schema"
```

---

### Task 2: Scoring logic

**Files:**
- Create: `src/lib/scoring.ts`
- Create: `__tests__/lib/scoring.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `__tests__/lib/scoring.test.ts`:

```typescript
import { calculateScores } from "@/lib/scoring"

const ALL_SCORED_IDS = [
  "AUT_A1","AUT_A2","AUT_A3","AUT_A4","AUT_A5","AUT_A6",
  "COM_A1","COM_A2","COM_A3","COM_A4","COM_A5","COM_A6",
  "REL_A1","REL_A2","REL_A3","REL_A4","REL_A5","REL_A6",
  "GRIT_A1","GRIT_A2","GRIT_A3","GRIT_A4","GRIT_A5","GRIT_A6",
  "SR_A1","SR_A2","SR_A3","SR_A4","SR_A5","SR_A6",
  "EI_A1","EI_A2","EI_A3","EI_A4","EI_A5","EI_A6",
]

function makeResponses(answer: string) {
  return ALL_SCORED_IDS.map(questionId => ({ questionId, answer }))
}

describe("calculateScores", () => {
  it("returns 100 for all max (5) answers", () => {
    const scores = calculateScores(makeResponses("5"))
    expect(scores.autonomyScore).toBe(100)
    expect(scores.competenceScore).toBe(100)
    expect(scores.relatednessScore).toBe(100)
    expect(scores.gritScore).toBe(100)
    expect(scores.selfRegScore).toBe(100)
    expect(scores.eiScore).toBe(100)
    expect(scores.overallScore).toBe(100)
  })

  it("returns 0 for all min (1) answers", () => {
    const scores = calculateScores(makeResponses("1"))
    expect(scores.autonomyScore).toBe(0)
    expect(scores.overallScore).toBe(0)
  })

  it("returns 50 for all midpoint (3) answers", () => {
    const scores = calculateScores(makeResponses("3"))
    expect(scores.autonomyScore).toBe(50)
    expect(scores.overallScore).toBe(50)
  })

  it("calculates per-dimension scores independently", () => {
    const mixed = [
      ...["AUT_A1","AUT_A2","AUT_A3","AUT_A4","AUT_A5","AUT_A6"].map(id => ({ questionId: id, answer: "5" })),
      ...["COM_A1","COM_A2","COM_A3","COM_A4","COM_A5","COM_A6"].map(id => ({ questionId: id, answer: "1" })),
      ...["REL_A1","REL_A2","REL_A3","REL_A4","REL_A5","REL_A6"].map(id => ({ questionId: id, answer: "3" })),
      ...["GRIT_A1","GRIT_A2","GRIT_A3","GRIT_A4","GRIT_A5","GRIT_A6"].map(id => ({ questionId: id, answer: "3" })),
      ...["SR_A1","SR_A2","SR_A3","SR_A4","SR_A5","SR_A6"].map(id => ({ questionId: id, answer: "3" })),
      ...["EI_A1","EI_A2","EI_A3","EI_A4","EI_A5","EI_A6"].map(id => ({ questionId: id, answer: "3" })),
    ]
    const scores = calculateScores(mixed)
    expect(scores.autonomyScore).toBe(100)
    expect(scores.competenceScore).toBe(0)
    expect(scores.relatednessScore).toBe(50)
    expect(scores.gritScore).toBe(50)
  })

  it("ignores non-scored question IDs", () => {
    const responses = [
      ...makeResponses("5"),
      { questionId: "CTX_A1", answer: "1" },
      { questionId: "UNM_A1", answer: "1" },
    ]
    const scores = calculateScores(responses)
    expect(scores.autonomyScore).toBe(100)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test -- __tests__/lib/scoring.test.ts
```

Expected: FAIL — `Cannot find module '@/lib/scoring'`

- [ ] **Step 3: Implement scoring.ts**

Create `src/lib/scoring.ts`:

```typescript
export type DimensionScores = {
  autonomyScore: number
  competenceScore: number
  relatednessScore: number
  gritScore: number
  selfRegScore: number
  eiScore: number
  overallScore: number
}

const DIMENSIONS: Record<keyof Omit<DimensionScores, "overallScore">, string[]> = {
  autonomyScore:    ["AUT_A1","AUT_A2","AUT_A3","AUT_A4","AUT_A5","AUT_A6"],
  competenceScore:  ["COM_A1","COM_A2","COM_A3","COM_A4","COM_A5","COM_A6"],
  relatednessScore: ["REL_A1","REL_A2","REL_A3","REL_A4","REL_A5","REL_A6"],
  gritScore:        ["GRIT_A1","GRIT_A2","GRIT_A3","GRIT_A4","GRIT_A5","GRIT_A6"],
  selfRegScore:     ["SR_A1","SR_A2","SR_A3","SR_A4","SR_A5","SR_A6"],
  eiScore:          ["EI_A1","EI_A2","EI_A3","EI_A4","EI_A5","EI_A6"],
}

function likertToScore(answers: string[]): number {
  const nums = answers.map(a => parseInt(a, 10)).filter(n => n >= 1 && n <= 5)
  if (nums.length === 0) return 0
  const avg = nums.reduce((s, n) => s + n, 0) / nums.length
  return Math.round(((avg - 1) / 4) * 1000) / 10
}

export function calculateScores(
  responses: { questionId: string; answer: string }[]
): DimensionScores {
  const map = new Map(responses.map(r => [r.questionId, r.answer]))

  const autonomyScore    = likertToScore(DIMENSIONS.autonomyScore.map(id => map.get(id) ?? ""))
  const competenceScore  = likertToScore(DIMENSIONS.competenceScore.map(id => map.get(id) ?? ""))
  const relatednessScore = likertToScore(DIMENSIONS.relatednessScore.map(id => map.get(id) ?? ""))
  const gritScore        = likertToScore(DIMENSIONS.gritScore.map(id => map.get(id) ?? ""))
  const selfRegScore     = likertToScore(DIMENSIONS.selfRegScore.map(id => map.get(id) ?? ""))
  const eiScore          = likertToScore(DIMENSIONS.eiScore.map(id => map.get(id) ?? ""))

  const overallScore = Math.round(
    ((autonomyScore + competenceScore + relatednessScore + gritScore + selfRegScore + eiScore) / 6) * 10
  ) / 10

  return { autonomyScore, competenceScore, relatednessScore, gritScore, selfRegScore, eiScore, overallScore }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- __tests__/lib/scoring.test.ts
```

Expected: PASS — 5 tests passing

- [ ] **Step 5: Commit**

```bash
git add src/lib/scoring.ts __tests__/lib/scoring.test.ts
git commit -m "feat: add scoring calculation with tests"
```

---

### Task 3: Update /api/survey/complete

**Files:**
- Modify: `src/app/api/survey/complete/route.ts`
- Modify: `__tests__/api/survey-complete.test.ts`

- [ ] **Step 1: Rewrite the test file**

Replace entire `__tests__/api/survey-complete.test.ts`:

```typescript
import { POST } from "@/app/api/survey/complete/route"
import { prisma } from "@/lib/prisma"

jest.mock("@/lib/prisma", () => ({
  prisma: {
    surveyResponse: { findMany: jest.fn() },
    scoreResult: { upsert: jest.fn() },
    user: { update: jest.fn() },
    $transaction: jest.fn((ops: Promise<unknown>[]) => Promise.all(ops)),
  },
}))

jest.mock("@/auth", () => ({ auth: jest.fn() }))
import { auth } from "@/auth"

const ALL_SCORED_IDS = [
  "AUT_A1","AUT_A2","AUT_A3","AUT_A4","AUT_A5","AUT_A6",
  "COM_A1","COM_A2","COM_A3","COM_A4","COM_A5","COM_A6",
  "REL_A1","REL_A2","REL_A3","REL_A4","REL_A5","REL_A6",
  "GRIT_A1","GRIT_A2","GRIT_A3","GRIT_A4","GRIT_A5","GRIT_A6",
  "SR_A1","SR_A2","SR_A3","SR_A4","SR_A5","SR_A6",
  "EI_A1","EI_A2","EI_A3","EI_A4","EI_A5","EI_A6",
]

function makeResponses(answer: string) {
  return ALL_SCORED_IDS.map(questionId => ({ questionId, answer }))
}

function makeReq() {
  return new Request("http://localhost/api/survey/complete", { method: "POST" })
}

describe("POST /api/survey/complete", () => {
  beforeEach(() => jest.clearAllMocks())

  it("returns 401 when not authenticated", async () => {
    ;(auth as jest.Mock).mockResolvedValue(null)
    const res = await POST(makeReq())
    expect(res.status).toBe(401)
  })

  it("returns 400 when fewer than 36 scored responses exist", async () => {
    ;(auth as jest.Mock).mockResolvedValue({ user: { id: "u1" } })
    ;(prisma.surveyResponse.findMany as jest.Mock).mockResolvedValue([
      { questionId: "AUT_A1", answer: "4" },
    ])
    const res = await POST(makeReq())
    expect(res.status).toBe(400)
  })

  it("returns 200 and runs transaction when all 36 responses present", async () => {
    ;(auth as jest.Mock).mockResolvedValue({ user: { id: "u1" } })
    ;(prisma.surveyResponse.findMany as jest.Mock).mockResolvedValue(makeResponses("4"))
    ;(prisma.$transaction as jest.Mock).mockResolvedValue([{}, {}])
    const res = await POST(makeReq())
    expect(res.status).toBe(200)
    expect(prisma.$transaction).toHaveBeenCalledTimes(1)
  })

  it("includes scoreResult upsert in the transaction", async () => {
    ;(auth as jest.Mock).mockResolvedValue({ user: { id: "u1" } })
    ;(prisma.surveyResponse.findMany as jest.Mock).mockResolvedValue(makeResponses("5"))
    let transactionOps: unknown[] = []
    ;(prisma.$transaction as jest.Mock).mockImplementation((ops: unknown[]) => {
      transactionOps = ops
      return Promise.resolve([{}, {}])
    })
    await POST(makeReq())
    expect(transactionOps).toHaveLength(2)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test -- __tests__/api/survey-complete.test.ts
```

Expected: some tests FAIL (route doesn't match new behaviour yet)

- [ ] **Step 3: Update the route**

Replace entire `src/app/api/survey/complete/route.ts`:

```typescript
import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { calculateScores } from "@/lib/scoring"

const SCORED_IDS = new Set([
  "AUT_A1","AUT_A2","AUT_A3","AUT_A4","AUT_A5","AUT_A6",
  "COM_A1","COM_A2","COM_A3","COM_A4","COM_A5","COM_A6",
  "REL_A1","REL_A2","REL_A3","REL_A4","REL_A5","REL_A6",
  "GRIT_A1","GRIT_A2","GRIT_A3","GRIT_A4","GRIT_A5","GRIT_A6",
  "SR_A1","SR_A2","SR_A3","SR_A4","SR_A5","SR_A6",
  "EI_A1","EI_A2","EI_A3","EI_A4","EI_A5","EI_A6",
])

export async function POST(_req?: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const allResponses = await prisma.surveyResponse.findMany({
    where: { userId: session.user.id },
    select: { questionId: true, answer: true },
  })

  const scoredResponses = allResponses.filter(r => SCORED_IDS.has(r.questionId))
  if (scoredResponses.length < 36) {
    return NextResponse.json({ error: "Incomplete survey" }, { status: 400 })
  }

  const scores = calculateScores(scoredResponses)

  await prisma.$transaction([
    prisma.user.update({
      where: { id: session.user.id },
      data: { surveyCompleted: true },
    }),
    prisma.scoreResult.upsert({
      where: { userId: session.user.id },
      update: { ...scores, surveyType: "agent_intake" },
      create: { userId: session.user.id, surveyType: "agent_intake", ...scores },
    }),
  ])

  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- __tests__/api/survey-complete.test.ts
```

Expected: PASS — 4 tests passing

- [ ] **Step 5: Run full test suite**

```bash
npm test
```

Expected: all 15+ tests passing

- [ ] **Step 6: Commit**

```bash
git add src/app/api/survey/complete/route.ts __tests__/api/survey-complete.test.ts
git commit -m "feat: calculate and store scores on survey completion"
```

---

### Task 4: Add-agent API

**Files:**
- Create: `src/app/api/broker/add-agent/route.ts`
- Create: `__tests__/api/broker-add-agent.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `__tests__/api/broker-add-agent.test.ts`:

```typescript
import { POST } from "@/app/api/broker/add-agent/route"
import { prisma } from "@/lib/prisma"

jest.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}))

jest.mock("@/auth", () => ({ auth: jest.fn() }))
import { auth } from "@/auth"

function makeReq(body: object) {
  return new Request("http://localhost/api/broker/add-agent", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}

describe("POST /api/broker/add-agent", () => {
  beforeEach(() => jest.clearAllMocks())

  it("returns 401 when not authenticated", async () => {
    ;(auth as jest.Mock).mockResolvedValue(null)
    const res = await POST(makeReq({ email: "agent@test.com" }))
    expect(res.status).toBe(401)
  })

  it("returns 403 when caller is not a broker", async () => {
    ;(auth as jest.Mock).mockResolvedValue({ user: { id: "b1" } })
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: "b1", role: "agent" })
    const res = await POST(makeReq({ email: "agent@test.com" }))
    expect(res.status).toBe(403)
  })

  it("returns 400 when email is missing", async () => {
    ;(auth as jest.Mock).mockResolvedValue({ user: { id: "b1" } })
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: "b1", role: "broker" })
    const res = await POST(makeReq({}))
    expect(res.status).toBe(400)
  })

  it("returns 404 when agent email not found", async () => {
    ;(auth as jest.Mock).mockResolvedValue({ user: { id: "b1" } })
    ;(prisma.user.findUnique as jest.Mock)
      .mockResolvedValueOnce({ id: "b1", role: "broker" })
      .mockResolvedValueOnce(null)
    const res = await POST(makeReq({ email: "nobody@test.com" }))
    expect(res.status).toBe(404)
  })

  it("returns 400 when target user is not an agent", async () => {
    ;(auth as jest.Mock).mockResolvedValue({ user: { id: "b1" } })
    ;(prisma.user.findUnique as jest.Mock)
      .mockResolvedValueOnce({ id: "b1", role: "broker" })
      .mockResolvedValueOnce({ id: "a1", role: "broker", brokerId: null })
    const res = await POST(makeReq({ email: "other@test.com" }))
    expect(res.status).toBe(400)
  })

  it("returns 400 when agent is already linked to a different broker", async () => {
    ;(auth as jest.Mock).mockResolvedValue({ user: { id: "b1" } })
    ;(prisma.user.findUnique as jest.Mock)
      .mockResolvedValueOnce({ id: "b1", role: "broker" })
      .mockResolvedValueOnce({ id: "a1", role: "agent", brokerId: "other-broker" })
    const res = await POST(makeReq({ email: "agent@test.com" }))
    expect(res.status).toBe(400)
  })

  it("returns 200 and links agent when valid", async () => {
    ;(auth as jest.Mock).mockResolvedValue({ user: { id: "b1" } })
    ;(prisma.user.findUnique as jest.Mock)
      .mockResolvedValueOnce({ id: "b1", role: "broker" })
      .mockResolvedValueOnce({ id: "a1", role: "agent", brokerId: null })
    ;(prisma.user.update as jest.Mock).mockResolvedValue({})
    const res = await POST(makeReq({ email: "agent@test.com" }))
    expect(res.status).toBe(200)
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: "a1" },
      data: { brokerId: "b1" },
    })
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test -- __tests__/api/broker-add-agent.test.ts
```

Expected: FAIL — `Cannot find module '@/app/api/broker/add-agent/route'`

- [ ] **Step 3: Implement the route**

Create `src/app/api/broker/add-agent/route.ts`:

```typescript
import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const caller = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (caller?.role !== "broker") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await req.json().catch(() => null)
  const { email } = body ?? {}
  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "Email required" }, { status: 400 })
  }

  const agent = await prisma.user.findUnique({ where: { email } })
  if (!agent) {
    return NextResponse.json({ error: "No agent found with that email" }, { status: 404 })
  }
  if (agent.role !== "agent") {
    return NextResponse.json({ error: "User is not an agent" }, { status: 400 })
  }
  if (agent.brokerId && agent.brokerId !== session.user.id) {
    return NextResponse.json({ error: "Agent is linked to another broker" }, { status: 400 })
  }

  await prisma.user.update({
    where: { id: agent.id },
    data: { brokerId: session.user.id },
  })

  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- __tests__/api/broker-add-agent.test.ts
```

Expected: PASS — 7 tests passing

- [ ] **Step 5: Commit**

```bash
git add src/app/api/broker/add-agent/route.ts __tests__/api/broker-add-agent.test.ts
git commit -m "feat: add broker/add-agent API route"
```

---

### Task 5: Remove-agent API

**Files:**
- Create: `src/app/api/broker/remove-agent/route.ts`
- Create: `__tests__/api/broker-remove-agent.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `__tests__/api/broker-remove-agent.test.ts`:

```typescript
import { POST } from "@/app/api/broker/remove-agent/route"
import { prisma } from "@/lib/prisma"

jest.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}))

jest.mock("@/auth", () => ({ auth: jest.fn() }))
import { auth } from "@/auth"

function makeReq(body: object) {
  return new Request("http://localhost/api/broker/remove-agent", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}

describe("POST /api/broker/remove-agent", () => {
  beforeEach(() => jest.clearAllMocks())

  it("returns 401 when not authenticated", async () => {
    ;(auth as jest.Mock).mockResolvedValue(null)
    const res = await POST(makeReq({ agentId: "a1" }))
    expect(res.status).toBe(401)
  })

  it("returns 400 when agentId is missing", async () => {
    ;(auth as jest.Mock).mockResolvedValue({ user: { id: "b1" } })
    const res = await POST(makeReq({}))
    expect(res.status).toBe(400)
  })

  it("returns 404 when agent not linked to this broker", async () => {
    ;(auth as jest.Mock).mockResolvedValue({ user: { id: "b1" } })
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: "a1", brokerId: "other" })
    const res = await POST(makeReq({ agentId: "a1" }))
    expect(res.status).toBe(404)
  })

  it("returns 200 and unlinks agent when valid", async () => {
    ;(auth as jest.Mock).mockResolvedValue({ user: { id: "b1" } })
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: "a1", brokerId: "b1" })
    ;(prisma.user.update as jest.Mock).mockResolvedValue({})
    const res = await POST(makeReq({ agentId: "a1" }))
    expect(res.status).toBe(200)
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: "a1" },
      data: { brokerId: null },
    })
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test -- __tests__/api/broker-remove-agent.test.ts
```

Expected: FAIL — module not found

- [ ] **Step 3: Implement the route**

Create `src/app/api/broker/remove-agent/route.ts`:

```typescript
import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  const { agentId } = body ?? {}
  if (!agentId || typeof agentId !== "string") {
    return NextResponse.json({ error: "agentId required" }, { status: 400 })
  }

  const agent = await prisma.user.findUnique({ where: { id: agentId } })
  if (!agent || agent.brokerId !== session.user.id) {
    return NextResponse.json({ error: "Agent not found or not linked to you" }, { status: 404 })
  }

  await prisma.user.update({
    where: { id: agentId },
    data: { brokerId: null },
  })

  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- __tests__/api/broker-remove-agent.test.ts
```

Expected: PASS — 4 tests passing

- [ ] **Step 5: Run full test suite to confirm nothing broken**

```bash
npm test
```

Expected: all tests passing

- [ ] **Step 6: Commit**

```bash
git add src/app/api/broker/remove-agent/route.ts __tests__/api/broker-remove-agent.test.ts
git commit -m "feat: add broker/remove-agent API route"
```

---

### Task 6: Dashboard layout — fonts

**Files:**
- Create: `src/app/dashboard/layout.tsx`

- [ ] **Step 1: Create the dashboard layout**

Create `src/app/dashboard/layout.tsx`:

```typescript
import { DM_Sans, DM_Mono } from "next/font/google"

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  weight: ["300", "400", "500", "600"],
})

const dmMono = DM_Mono({
  subsets: ["latin"],
  variable: "--font-dm-mono",
  weight: ["400", "500"],
})

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={`${dmSans.variable} ${dmMono.variable}`}
      style={{ fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif" }}
    >
      {children}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/dashboard/layout.tsx
git commit -m "feat: add dashboard layout with DM Sans and DM Mono fonts"
```

---

### Task 7: Agent dashboard page

**Files:**
- Modify: `src/app/dashboard/agent/page.tsx`

Note: `User` has no `name` field — display name is derived from email prefix (everything before `@`), capitalized.

- [ ] **Step 1: Replace the agent dashboard page**

Replace entire `src/app/dashboard/agent/page.tsx`:

```tsx
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"

type ScoreKey = "gritScore" | "selfRegScore" | "eiScore" | "autonomyScore" | "competenceScore" | "relatednessScore"

const DIMENSION_INFO: Record<ScoreKey, { label: string; description: string }> = {
  gritScore:        { label: "Follow-through",    description: "You stay with tasks even when results are slow. This is one of your strongest signals." },
  selfRegScore:     { label: "Business systems",  description: "You have structure in place. Strengthening your CRM habits is your next leverage point." },
  eiScore:          { label: "Client connection", description: "Clients feel heard when working with you. This is a clear competitive edge." },
  autonomyScore:    { label: "Independent drive",  description: "You work well on your own and own your outcomes. Self-direction comes naturally." },
  competenceScore:  { label: "Skill confidence",  description: "Your confidence is growing. Tracking small wins will reinforce what's already working." },
  relatednessScore: { label: "Team connection",   description: "You draw energy from your work relationships. This supports long-term momentum." },
}

const SCORE_KEYS: ScoreKey[] = ["gritScore","selfRegScore","eiScore","autonomyScore","competenceScore","relatednessScore"]

function scoreColor(s: number) {
  if (s >= 70) return "#3B6D11"
  if (s >= 50) return "#BA7517"
  return "#E24B4A"
}

function barColor(s: number) {
  if (s >= 70) return "#639922"
  if (s >= 50) return "#BA7517"
  return "#E24B4A"
}

function displayName(email: string) {
  const prefix = email.split("@")[0]
  return prefix.charAt(0).toUpperCase() + prefix.slice(1)
}

export default async function AgentDashboard() {
  const session = await auth()
  if (!session) redirect("/login")

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { scoreResult: true, broker: true },
  })
  if (!user) redirect("/login")

  const dayCount = Math.floor((Date.now() - new Date(user.createdAt).getTime()) / 86_400_000)
  const score = user.scoreResult

  return (
    <div style={{ background: "#f7f6f3", minHeight: "100vh" }}>
      {/* Nav */}
      <nav style={{ background: "#fff", borderBottom: "1px solid rgba(0,0,0,0.09)", padding: "0 32px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 56, position: "sticky", top: 0, zIndex: 100 }}>
        <span style={{ fontFamily: "var(--font-dm-mono, monospace)", fontSize: 15, fontWeight: 500, color: "#1a1916" }}>
          Kasby<span style={{ color: "#639922" }}>IQ</span>
        </span>
        <span style={{ fontSize: 11, color: "#9c9b97", background: "#f2f1ee", padding: "4px 10px", borderRadius: 20, border: "1px solid rgba(0,0,0,0.09)" }}>
          Agent
        </span>
      </nav>

      <main style={{ padding: "24px 32px 48px", maxWidth: 1100, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 500, color: "#1a1916" }}>Welcome back, {displayName(user.email)}</h1>
          <p style={{ fontSize: 13, color: "#6b6a66", marginTop: 3 }}>
            Your growth journey · Day {dayCount}
          </p>
        </div>

        {/* Journey bar */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", border: "1px solid rgba(0,0,0,0.14)", borderRadius: 10, overflow: "hidden", marginBottom: 24 }}>
          <JourneyStep
            status="done"
            label="Step 1 · Complete"
            title="Your starting point"
            date={`Completed ${new Date(user.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`}
            last={false}
          />
          <JourneyStep
            status="next"
            label="Step 2 · Up next"
            title="90-day check-in"
            date="Due at day 90"
            last={false}
          />
          <JourneyStep
            status="later"
            label="Step 3 · Coming soon"
            title="180-day check-in"
            date="Unlocks after step 2"
            last={true}
          />
        </div>

        {/* Growth cards */}
        {score ? (
          <>
            <h2 style={{ fontSize: 15, fontWeight: 500, color: "#1a1916", marginBottom: 4 }}>Your growth areas</h2>
            <p style={{ fontSize: 13, color: "#6b6a66", marginBottom: 18, lineHeight: 1.6 }}>
              These six areas shape how you work. Your scores reflect patterns from your baseline survey — not your ceiling.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 20 }}>
              {SCORE_KEYS.map(key => {
                const s = score[key]
                const info = DIMENSION_INFO[key]
                return (
                  <div key={key} style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.09)", borderRadius: 10, padding: "16px 18px" }}>
                    <div style={{ fontSize: 11, color: "#6b6a66", marginBottom: 4 }}>{info.label}</div>
                    <div style={{ fontSize: 24, fontWeight: 500, color: scoreColor(s), marginBottom: 6 }}>{Math.round(s)}</div>
                    <div style={{ height: 6, background: "#eae9e5", borderRadius: 3, marginBottom: 12, overflow: "hidden" }}>
                      <div style={{ width: `${s}%`, height: 6, background: barColor(s), borderRadius: 3 }} />
                    </div>
                    <div style={{ fontSize: 12, color: "#6b6a66", lineHeight: 1.6 }}>{info.description}</div>
                  </div>
                )
              })}
            </div>
          </>
        ) : (
          <div style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.09)", borderRadius: 10, padding: "24px 18px", color: "#6b6a66", textAlign: "center" }}>
            Complete your survey to see your growth areas.
          </div>
        )}

        {/* Broker note */}
        {user.broker && (
          <div style={{ background: "#E6F1FB", border: "1px solid #B5D4F4", borderRadius: 10, padding: "16px 18px" }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#0C447C", marginBottom: 5 }}>From your broker</div>
            <div style={{ fontSize: 13, color: "#185FA5", lineHeight: 1.65 }}>
              Your next check-in will be available at day 90. We&apos;ll send you a heads-up a few days before — no pressure, just a reminder.
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

function JourneyStep({ status, label, title, date, last }: {
  status: "done" | "next" | "later"
  label: string
  title: string
  date: string
  last: boolean
}) {
  const theme = {
    done:  { bg: "#EAF3DE", labelColor: "#2A5200", titleColor: "#1a1916", dateColor: "#6b6a66" },
    next:  { bg: "#FFF8EC", labelColor: "#7A4A00", titleColor: "#1a1916", dateColor: "#7A4A00" },
    later: { bg: "#f2f1ee", labelColor: "#9c9b97", titleColor: "#6b6a66", dateColor: "#9c9b97" },
  }[status]

  return (
    <div style={{ padding: "16px 18px", background: theme.bg, borderRight: last ? "none" : "1px solid rgba(0,0,0,0.14)" }}>
      <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.4px", color: theme.labelColor, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 500, color: theme.titleColor }}>{title}</div>
      <div style={{ fontSize: 12, marginTop: 3, color: theme.dateColor }}>{date}</div>
    </div>
  )
}
```

- [ ] **Step 2: Run type check**

```bash
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/app/dashboard/agent/page.tsx
git commit -m "feat: replace agent dashboard with warm-minimal UI"
```

---

### Task 8: ManageAgents client component

**Files:**
- Create: `src/components/dashboard/ManageAgents.tsx`

- [ ] **Step 1: Create the component**

Create `src/components/dashboard/ManageAgents.tsx`:

```tsx
"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"

type Agent = {
  id: string
  email: string
  surveyCompleted: boolean
}

export function ManageAgents({ agents }: { agents: Agent[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null)

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setMessage(null)
    const res = await fetch("/api/broker/add-agent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    })
    const data = await res.json()
    if (res.ok) {
      setMessage({ type: "ok", text: "Agent added." })
      setEmail("")
      startTransition(() => router.refresh())
    } else {
      setMessage({ type: "err", text: data.error ?? "Failed to add agent." })
    }
  }

  async function handleRemove(agentId: string) {
    setMessage(null)
    const res = await fetch("/api/broker/remove-agent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agentId }),
    })
    if (res.ok) {
      startTransition(() => router.refresh())
    } else {
      const data = await res.json()
      setMessage({ type: "err", text: data.error ?? "Failed to remove agent." })
    }
  }

  return (
    <div style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.09)", borderRadius: 10, padding: "16px 18px" }}>
      <div style={{ fontSize: 14, fontWeight: 500, color: "#1a1916", marginBottom: 12 }}>Manage agents</div>

      <form onSubmit={handleAdd} style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="agent@example.com"
          required
          style={{ flex: 1, fontSize: 13, padding: "7px 12px", border: "1px solid rgba(0,0,0,0.14)", borderRadius: 6, outline: "none", fontFamily: "inherit" }}
        />
        <button
          type="submit"
          disabled={isPending}
          style={{ fontSize: 13, padding: "7px 16px", border: "1px solid rgba(0,0,0,0.14)", borderRadius: 6, background: "#1a1916", color: "#fff", cursor: "pointer", fontFamily: "inherit" }}
        >
          Add
        </button>
      </form>

      {message && (
        <div style={{ fontSize: 12, marginBottom: 12, color: message.type === "ok" ? "#2A5200" : "#E24B4A" }}>
          {message.text}
        </div>
      )}

      {agents.length === 0 ? (
        <div style={{ fontSize: 13, color: "#9c9b97" }}>No agents linked yet.</div>
      ) : (
        <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 6 }}>
          {agents.map(agent => (
            <li key={agent.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 13, color: "#1a1916" }}>
              <span>
                {agent.email}
                <span style={{ marginLeft: 8, fontSize: 11, color: agent.surveyCompleted ? "#2A5200" : "#9c9b97" }}>
                  {agent.surveyCompleted ? "Survey complete" : "Pending"}
                </span>
              </span>
              <button
                onClick={() => handleRemove(agent.id)}
                style={{ fontSize: 11, color: "#E24B4A", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/dashboard/ManageAgents.tsx
git commit -m "feat: add ManageAgents client component"
```

---

### Task 9: Broker dashboard page

**Files:**
- Modify: `src/app/dashboard/broker/page.tsx`

- [ ] **Step 1: Replace the broker dashboard page**

Replace entire `src/app/dashboard/broker/page.tsx`:

```tsx
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { ManageAgents } from "@/components/dashboard/ManageAgents"

type ScoreKey = "gritScore" | "selfRegScore" | "eiScore" | "autonomyScore" | "competenceScore" | "relatednessScore"

const DIM_LABELS: Record<ScoreKey, string> = {
  gritScore:        "Grit",
  selfRegScore:     "Self-regulation",
  eiScore:          "Emotional intelligence",
  autonomyScore:    "Autonomy",
  competenceScore:  "Competence",
  relatednessScore: "Relatedness",
}

const DIM_KEYS: ScoreKey[] = ["gritScore","selfRegScore","eiScore","autonomyScore","competenceScore","relatednessScore"]

function scoreColor(s: number) {
  if (s >= 70) return "#3B6D11"
  if (s >= 50) return "#BA7517"
  return "#E24B4A"
}

function barColor(s: number) {
  if (s >= 70) return "#639922"
  if (s >= 50) return "#BA7517"
  return "#E24B4A"
}

function avatarColor(s: number): { border: string; bg: string; text: string } {
  if (s >= 70) return { border: "#639922", bg: "#EAF3DE", text: "#3B6D11" }
  if (s >= 50) return { border: "#BA7517", bg: "#FAEEDA", text: "#633806" }
  return { border: "#E24B4A", bg: "#FCEBEB", text: "#501313" }
}

function initials(email: string) {
  return email.slice(0, 2).toUpperCase()
}

function dayCount(createdAt: Date) {
  return Math.floor((Date.now() - new Date(createdAt).getTime()) / 86_400_000)
}

function hasCoachingFlag(score: { [k: string]: number }) {
  return DIM_KEYS.some(k => score[k] < 50)
}

export default async function BrokerDashboard() {
  const session = await auth()
  if (!session) redirect("/login")

  const agents = await prisma.user.findMany({
    where: { brokerId: session.user.id },
    include: { scoreResult: true },
    orderBy: { createdAt: "asc" },
  })

  const completed = agents.filter(a => a.scoreResult)
  const avgFit = completed.length > 0
    ? Math.round(completed.reduce((s, a) => s + a.scoreResult!.overallScore, 0) / completed.length)
    : null
  const flags = completed.filter(a => hasCoachingFlag(a.scoreResult as Record<string, number>)).length

  return (
    <div style={{ background: "#f7f6f3", minHeight: "100vh" }}>
      {/* Nav */}
      <nav style={{ background: "#fff", borderBottom: "1px solid rgba(0,0,0,0.09)", padding: "0 32px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 56, position: "sticky", top: 0, zIndex: 100 }}>
        <span style={{ fontFamily: "var(--font-dm-mono, monospace)", fontSize: 15, fontWeight: 500, color: "#1a1916" }}>
          Kasby<span style={{ color: "#639922" }}>IQ</span>
        </span>
        <span style={{ fontSize: 11, color: "#9c9b97", background: "#f2f1ee", padding: "4px 10px", borderRadius: 20, border: "1px solid rgba(0,0,0,0.09)" }}>
          Broker
        </span>
      </nav>

      <main style={{ padding: "24px 32px 48px", maxWidth: 1100, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 500, color: "#1a1916" }}>Agent roster</h1>
          <p style={{ fontSize: 13, color: "#6b6a66", marginTop: 3 }}>{session.user.email}</p>
        </div>

        {/* Metric cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
          <MetricCard label="Active agents" value={String(agents.length)} />
          <MetricCard label="Coaching flags" value={String(flags)} variant={flags > 0 ? "alert" : "normal"} />
          <MetricCard label="Avg fit score" value={avgFit !== null ? String(avgFit) : "—"} />
          <MetricCard label="Surveys pending" value={String(agents.length - completed.length)} variant={agents.length - completed.length > 0 ? "warn" : "normal"} />
        </div>

        {/* Legend */}
        <div style={{ display: "flex", gap: 20, fontSize: 12, color: "#6b6a66", marginBottom: 16, alignItems: "center" }}>
          <span><span style={{ width: 10, height: 10, borderRadius: "50%", background: "#639922", display: "inline-block", marginRight: 5 }} />Strong fit</span>
          <span><span style={{ width: 10, height: 10, borderRadius: "50%", background: "#BA7517", display: "inline-block", marginRight: 5 }} />Monitor</span>
          <span><span style={{ width: 10, height: 10, borderRadius: "50%", background: "#E24B4A", display: "inline-block", marginRight: 5 }} />Needs attention</span>
        </div>

        {/* Agent cards */}
        {agents.length > 0 ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12, marginBottom: 20 }}>
            {agents.map(agent => {
              const score = agent.scoreResult
              const days = dayCount(agent.createdAt)
              const overall = score?.overallScore ?? 0
              const av = score ? avatarColor(overall) : { border: "#9c9b97", bg: "#f2f1ee", text: "#6b6a66" }
              const flag = score && hasCoachingFlag(score as Record<string, number>)

              return (
                <div key={agent.id} style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.09)", borderRadius: 10, padding: "16px 18px" }}>
                  {/* Card header */}
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                    <div style={{ width: 46, height: 46, borderRadius: "50%", border: `2.5px solid ${av.border}`, display: "flex", alignItems: "center", justifyContent: "center", background: av.bg, flexShrink: 0 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: av.text }}>{initials(agent.email)}</span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 500, color: "#1a1916", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{agent.email}</div>
                      <div style={{ fontSize: 12, color: "#6b6a66", marginTop: 1 }}>Day {days}</div>
                    </div>
                    {score && (
                      <div style={{ fontSize: 16, fontWeight: 600, color: scoreColor(overall) }}>{Math.round(overall)}</div>
                    )}
                  </div>

                  {/* Coaching flag */}
                  {flag && (
                    <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 6, padding: "8px 10px", marginBottom: 12 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: "#9B1C1C", marginBottom: 2 }}>Coaching flag</div>
                      <div style={{ fontSize: 12, color: "#7F1D1D", lineHeight: 1.5 }}>
                        {DIM_KEYS.filter(k => (score as Record<string, number>)[k] < 50)
                          .map(k => DIM_LABELS[k])
                          .join(", ")} below threshold.
                      </div>
                    </div>
                  )}

                  {/* Dimension bars */}
                  {score ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                      {DIM_KEYS.map(key => {
                        const s = (score as Record<string, number>)[key]
                        return (
                          <div key={key}>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#6b6a66", marginBottom: 2 }}>
                              <span>{DIM_LABELS[key]}</span>
                              <span>{Math.round(s)}</span>
                            </div>
                            <div style={{ height: 4, background: "#eae9e5", borderRadius: 2, overflow: "hidden" }}>
                              <div style={{ width: `${s}%`, height: 4, background: barColor(s), borderRadius: 2 }} />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div style={{ fontSize: 12, color: "#9c9b97", fontStyle: "italic" }}>Survey pending</div>
                  )}

                  {/* Footer */}
                  <div style={{ borderTop: "1px solid rgba(0,0,0,0.09)", marginTop: 12, paddingTop: 10, fontSize: 12, color: "#6b6a66" }}>
                    {agent.surveyCompleted ? "Baseline complete" : "Awaiting survey"}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.09)", borderRadius: 10, padding: "24px 18px", color: "#9c9b97", textAlign: "center", marginBottom: 20 }}>
            No agents linked yet. Add agents below.
          </div>
        )}

        {/* Manage agents */}
        <ManageAgents agents={agents.map(a => ({ id: a.id, email: a.email, surveyCompleted: a.surveyCompleted }))} />
      </main>
    </div>
  )
}

function MetricCard({ label, value, variant = "normal" }: { label: string; value: string; variant?: "normal" | "alert" | "warn" }) {
  const styles = {
    normal: { bg: "#fff",     border: "rgba(0,0,0,0.09)", labelColor: "#6b6a66",  valueColor: "#1a1916" },
    alert:  { bg: "#FEF2F2",  border: "#FECACA",          labelColor: "#9B1C1C",  valueColor: "#E24B4A" },
    warn:   { bg: "#FFF8EC",  border: "#FDE68A",          labelColor: "#7A4A00",  valueColor: "#BA7517" },
  }[variant]

  return (
    <div style={{ background: styles.bg, border: `1px solid ${styles.border}`, borderRadius: 10, padding: "16px 18px" }}>
      <div style={{ fontSize: 12, color: styles.labelColor, marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 500, color: styles.valueColor }}>{value}</div>
    </div>
  )
}
```

- [ ] **Step 2: Run type check**

```bash
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 3: Run full test suite**

```bash
npm test
```

Expected: all tests passing

- [ ] **Step 4: Commit**

```bash
git add src/app/dashboard/broker/page.tsx src/components/dashboard/ManageAgents.tsx
git commit -m "feat: replace broker dashboard with warm-minimal UI and agent roster"
```

---

### Task 10: Smoke test in browser

- [ ] **Step 1: Start dev server**

```bash
npm run dev
```

- [ ] **Step 2: Verify agent dashboard**

1. Log in as an agent who has completed the survey
2. Navigate to `/dashboard/agent`
3. Confirm: warm background, DM Sans font, journey bar (Step 1 complete), 6 growth area cards with scores and bars
4. Log in as an agent who has NOT completed the survey → confirm "Complete your survey" placeholder shown

- [ ] **Step 3: Verify broker dashboard**

1. Log in as a broker
2. Navigate to `/dashboard/broker`
3. Confirm: metric strip shows 0 agents / 0 flags, empty roster, ManageAgents panel visible
4. Add a valid agent email → confirm agent appears in roster
5. For agent with completed survey → confirm score cards + dimension bars show
6. For agent without completed survey → confirm "Survey pending" shown
7. Remove agent → confirm they disappear from roster

- [ ] **Step 4: Final commit if any fixes applied**

```bash
git add -A
git commit -m "fix: smoke test fixes for scoring and dashboards"
```
