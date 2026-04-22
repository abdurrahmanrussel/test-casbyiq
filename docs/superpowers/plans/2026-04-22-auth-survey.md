# Auth + Survey Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Next.js app with email/password auth (NextAuth v5), role-based registration (agent/broker), and a gated JotForm-style onboarding survey (5 questions per role) that must be completed before reaching the dashboard.

**Architecture:** Single Next.js 14 App Router app. NextAuth Credentials provider issues a JWT containing `role` and `surveyCompleted`. `middleware.ts` enforces the gate — unauthenticated users go to `/login`, authenticated users with incomplete surveys go to `/onboarding/survey`. Survey answers are saved per-question via API; on the final question the DB marks `surveyCompleted = true` and the session token is refreshed.

**Tech Stack:** Next.js 14 (App Router), NextAuth v5 (Auth.js), Prisma ORM, PostgreSQL, Tailwind CSS, bcryptjs, Jest + @testing-library/react

---

## File Map

```
kasbyiq-project/
├── .env.local                              # DATABASE_URL, NEXTAUTH_SECRET
├── prisma/
│   └── schema.prisma                       # User + SurveyResponse tables
├── src/
│   ├── auth.ts                             # NextAuth config, signIn/signOut/handlers
│   ├── middleware.ts                       # Auth + survey gate redirects
│   ├── types/
│   │   └── next-auth.d.ts                  # Extend Session/JWT/User types
│   ├── lib/
│   │   ├── prisma.ts                       # Prisma client singleton
│   │   └── questions.ts                    # Agent + broker question arrays
│   ├── app/
│   │   ├── layout.tsx                      # Root layout with SessionProvider
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   │   ├── [...nextauth]/route.ts  # NextAuth GET/POST handlers
│   │   │   │   └── register/route.ts       # POST: create user
│   │   │   └── survey/
│   │   │       ├── answer/route.ts         # POST: save one answer
│   │   │       └── complete/route.ts       # POST: mark surveyCompleted=true
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx              # Login page (server shell)
│   │   │   └── register/page.tsx           # Register page (server shell)
│   │   ├── onboarding/
│   │   │   └── survey/page.tsx             # Survey page (server: loads role, renders SurveyFlow)
│   │   └── dashboard/
│   │       ├── agent/page.tsx              # Agent dashboard stub
│   │       └── broker/page.tsx             # Broker dashboard stub
│   └── components/
│       ├── auth/
│       │   ├── LoginForm.tsx               # Client: email+password form
│       │   └── RegisterForm.tsx            # Client: name+email+password+role form
│       └── survey/
│           ├── SurveyFlow.tsx              # Client: question state machine
│           ├── SurveyQuestion.tsx          # Client: JotForm-style question card
│           └── ProgressDots.tsx            # Client: dot progress indicator
├── __tests__/
│   ├── api/
│   │   ├── register.test.ts
│   │   ├── survey-answer.test.ts
│   │   └── survey-complete.test.ts
│   └── components/
│       ├── LoginForm.test.tsx
│       ├── RegisterForm.test.tsx
│       └── SurveyQuestion.test.tsx
└── jest.config.ts
```

---

## Task 1: Project Scaffold

**Files:**
- Create: `package.json` (via create-next-app)
- Create: `jest.config.ts`
- Create: `.env.local`

- [ ] **Step 1: Scaffold Next.js app**

```bash
cd /home/md-abdur-rahman/code/kasbyiq-project
npx create-next-app@latest . --typescript --tailwind --app --src-dir --import-alias "@/*" --no-git
```

When prompted: answer Yes to all defaults.

- [ ] **Step 2: Install dependencies**

```bash
npm install next-auth@beta @auth/prisma-adapter prisma @prisma/client bcryptjs
npm install -D @types/bcryptjs jest @testing-library/react @testing-library/jest-dom @testing-library/user-event jest-environment-jsdom ts-jest @types/jest
```

- [ ] **Step 3: Create jest.config.ts**

```ts
// jest.config.ts
import type { Config } from "jest"
import nextJest from "next/jest.js"

const createJestConfig = nextJest({ dir: "./" })

const config: Config = {
  coverageProvider: "v8",
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
}

export default createJestConfig(config)
```

- [ ] **Step 4: Create jest.setup.ts**

```ts
// jest.setup.ts
import "@testing-library/jest-dom"
```

- [ ] **Step 5: Create .env.local**

```bash
# .env.local
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/kasbyiq"
NEXTAUTH_SECRET="replace-with-32-char-random-string"
AUTH_SECRET="replace-with-32-char-random-string"
```

Generate a secret: `openssl rand -base64 32`

- [ ] **Step 6: Verify install**

```bash
npm run build 2>&1 | tail -5
```

Expected: build succeeds (or only type errors from empty app — that's fine).

- [ ] **Step 7: Commit**

```bash
git init
git add -A
git commit -m "feat: scaffold Next.js app with auth and testing dependencies"
```

---

## Task 2: Prisma Schema + Database

**Files:**
- Create: `prisma/schema.prisma`
- Create: `src/lib/prisma.ts`

- [ ] **Step 1: Initialise Prisma**

```bash
npx prisma init --datasource-provider postgresql
```

- [ ] **Step 2: Write schema.prisma**

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Role {
  agent
  broker
}

model User {
  id              String           @id @default(uuid())
  email           String           @unique
  passwordHash    String
  role            Role
  surveyCompleted Boolean          @default(false)
  createdAt       DateTime         @default(now())
  surveyResponses SurveyResponse[]
}

model SurveyResponse {
  id         String   @id @default(uuid())
  userId     String
  user       User     @relation(fields: [userId], references: [id])
  questionId String
  answer     Int
  createdAt  DateTime @default(now())
}
```

- [ ] **Step 3: Run migration**

Make sure PostgreSQL is running and `DATABASE_URL` in `.env.local` is correct (Prisma reads `.env`, not `.env.local` — copy DATABASE_URL to `.env` as well):

```bash
echo 'DATABASE_URL="postgresql://postgres:postgres@localhost:5432/kasbyiq"' > .env
npx prisma migrate dev --name init
```

Expected output: `✓ Generated Prisma Client`

- [ ] **Step 4: Create Prisma client singleton**

```ts
// src/lib/prisma.ts
import { PrismaClient } from "@prisma/client"

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma
```

- [ ] **Step 5: Commit**

```bash
git add prisma/ src/lib/prisma.ts .env
git commit -m "feat: add Prisma schema with User and SurveyResponse tables"
```

---

## Task 3: NextAuth Configuration

**Files:**
- Create: `src/auth.ts`
- Create: `src/types/next-auth.d.ts`
- Create: `src/app/api/auth/[...nextauth]/route.ts`

- [ ] **Step 1: Create TypeScript type extensions**

```ts
// src/types/next-auth.d.ts
import "next-auth"
import "next-auth/jwt"

declare module "next-auth" {
  interface User {
    role: string
    surveyCompleted: boolean
  }
  interface Session {
    user: {
      id: string
      email: string
      role: string
      surveyCompleted: boolean
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    role: string
    surveyCompleted: boolean
  }
}
```

- [ ] **Step 2: Create auth.ts**

```ts
// src/auth.ts
import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null
        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        })
        if (!user) return null
        const valid = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        )
        if (!valid) return null
        return {
          id: user.id,
          email: user.email,
          role: user.role,
          surveyCompleted: user.surveyCompleted,
        }
      },
    }),
  ],
  callbacks: {
    jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id as string
        token.role = user.role
        token.surveyCompleted = user.surveyCompleted
      }
      if (trigger === "update" && session?.surveyCompleted !== undefined) {
        token.surveyCompleted = session.surveyCompleted
      }
      return token
    },
    session({ session, token }) {
      session.user.id = token.id
      session.user.role = token.role
      session.user.surveyCompleted = token.surveyCompleted
      return session
    },
  },
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt" },
})
```

- [ ] **Step 3: Create NextAuth route handler**

```ts
// src/app/api/auth/[...nextauth]/route.ts
import { handlers } from "@/auth"
export const { GET, POST } = handlers
```

- [ ] **Step 4: Add SessionProvider to root layout**

```tsx
// src/app/layout.tsx
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { SessionProvider } from "next-auth/react"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "KasbyIQ",
  description: "Psychographic fit for real estate",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  )
}
```

- [ ] **Step 5: Commit**

```bash
git add src/auth.ts src/types/ src/app/api/auth/ src/app/layout.tsx
git commit -m "feat: configure NextAuth v5 with Credentials provider and JWT callbacks"
```

---

## Task 4: Register API Route

**Files:**
- Create: `src/app/api/auth/register/route.ts`
- Create: `__tests__/api/register.test.ts`

- [ ] **Step 1: Write failing test**

```ts
// __tests__/api/register.test.ts
import { POST } from "@/app/api/auth/register/route"
import { prisma } from "@/lib/prisma"

jest.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  },
}))

const mockPrisma = prisma as jest.Mocked<typeof prisma>

function makeRequest(body: object) {
  return new Request("http://localhost/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}

describe("POST /api/auth/register", () => {
  beforeEach(() => jest.clearAllMocks())

  it("returns 400 when email is missing", async () => {
    const res = await POST(makeRequest({ password: "pass123", role: "agent" }))
    expect(res.status).toBe(400)
  })

  it("returns 409 when email already exists", async () => {
    ;(mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({ id: "1" })
    const res = await POST(makeRequest({ email: "a@b.com", password: "pass123", role: "agent" }))
    expect(res.status).toBe(409)
  })

  it("returns 201 and creates user on valid input", async () => {
    ;(mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(null)
    ;(mockPrisma.user.create as jest.Mock).mockResolvedValue({
      id: "uuid-1",
      email: "a@b.com",
      role: "agent",
      surveyCompleted: false,
    })
    const res = await POST(makeRequest({ email: "a@b.com", password: "pass123", role: "agent" }))
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.id).toBe("uuid-1")
    expect(body.role).toBe("agent")
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx jest __tests__/api/register.test.ts --no-coverage
```

Expected: FAIL — `Cannot find module '@/app/api/auth/register/route'`

- [ ] **Step 3: Implement register route**

```ts
// src/app/api/auth/register/route.ts
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function POST(req: Request) {
  const body = await req.json().catch(() => null)
  if (!body?.email || !body?.password || !body?.role) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  const { email, password, role } = body

  if (!["agent", "broker"].includes(role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 })
  }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return NextResponse.json({ error: "Email already registered" }, { status: 409 })
  }

  const passwordHash = await bcrypt.hash(password, 12)
  const user = await prisma.user.create({
    data: { email, passwordHash, role },
    select: { id: true, email: true, role: true, surveyCompleted: true },
  })

  return NextResponse.json(user, { status: 201 })
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx jest __tests__/api/register.test.ts --no-coverage
```

Expected: 3 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/app/api/auth/register/ __tests__/api/register.test.ts
git commit -m "feat: add register API route with validation and duplicate email check"
```

---

## Task 5: Survey API Routes

**Files:**
- Create: `src/app/api/survey/answer/route.ts`
- Create: `src/app/api/survey/complete/route.ts`
- Create: `__tests__/api/survey-answer.test.ts`
- Create: `__tests__/api/survey-complete.test.ts`

- [ ] **Step 1: Write failing tests for answer route**

```ts
// __tests__/api/survey-answer.test.ts
import { POST } from "@/app/api/survey/answer/route"
import { prisma } from "@/lib/prisma"

jest.mock("@/lib/prisma", () => ({
  prisma: { surveyResponse: { upsert: jest.fn() } },
}))

jest.mock("@/auth", () => ({
  auth: jest.fn(),
}))

import { auth } from "@/auth"

function makeRequest(body: object) {
  return new Request("http://localhost/api/survey/answer", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}

describe("POST /api/survey/answer", () => {
  beforeEach(() => jest.clearAllMocks())

  it("returns 401 when not authenticated", async () => {
    ;(auth as jest.Mock).mockResolvedValue(null)
    const res = await POST(makeRequest({ questionId: "AUT_A1", answer: 4 }))
    expect(res.status).toBe(401)
  })

  it("returns 400 when answer is out of range", async () => {
    ;(auth as jest.Mock).mockResolvedValue({ user: { id: "u1" } })
    const res = await POST(makeRequest({ questionId: "AUT_A1", answer: 6 }))
    expect(res.status).toBe(400)
  })

  it("returns 200 and upserts answer", async () => {
    ;(auth as jest.Mock).mockResolvedValue({ user: { id: "u1" } })
    ;(prisma.surveyResponse.upsert as jest.Mock).mockResolvedValue({})
    const res = await POST(makeRequest({ questionId: "AUT_A1", answer: 4 }))
    expect(res.status).toBe(200)
  })
})
```

- [ ] **Step 2: Write failing test for complete route**

```ts
// __tests__/api/survey-complete.test.ts
import { POST } from "@/app/api/survey/complete/route"
import { prisma } from "@/lib/prisma"

jest.mock("@/lib/prisma", () => ({
  prisma: { user: { update: jest.fn() } },
}))

jest.mock("@/auth", () => ({
  auth: jest.fn(),
}))

import { auth } from "@/auth"

describe("POST /api/survey/complete", () => {
  beforeEach(() => jest.clearAllMocks())

  it("returns 401 when not authenticated", async () => {
    ;(auth as jest.Mock).mockResolvedValue(null)
    const res = await POST(new Request("http://localhost/api/survey/complete", { method: "POST" }))
    expect(res.status).toBe(401)
  })

  it("returns 200 and updates user", async () => {
    ;(auth as jest.Mock).mockResolvedValue({ user: { id: "u1" } })
    ;(prisma.user.update as jest.Mock).mockResolvedValue({})
    const res = await POST(new Request("http://localhost/api/survey/complete", { method: "POST" }))
    expect(res.status).toBe(200)
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: "u1" },
      data: { surveyCompleted: true },
    })
  })
})
```

- [ ] **Step 3: Run tests to verify they fail**

```bash
npx jest __tests__/api/survey-answer.test.ts __tests__/api/survey-complete.test.ts --no-coverage
```

Expected: FAIL — modules not found

- [ ] **Step 4: Implement answer route**

```ts
// src/app/api/survey/answer/route.ts
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

  if (!questionId || typeof answer !== "number" || answer < 1 || answer > 5) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
  }

  await prisma.surveyResponse.upsert({
    where: {
      userId_questionId: { userId: session.user.id, questionId },
    },
    update: { answer },
    create: { userId: session.user.id, questionId, answer },
  })

  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 5: Add unique constraint to Prisma schema for upsert**

Edit `prisma/schema.prisma` — update `SurveyResponse` model to add a compound unique index:

```prisma
model SurveyResponse {
  id         String   @id @default(uuid())
  userId     String
  user       User     @relation(fields: [userId], references: [id])
  questionId String
  answer     Int
  createdAt  DateTime @default(now())

  @@unique([userId, questionId])
}
```

Run migration:

```bash
npx prisma migrate dev --name add-survey-response-unique
```

- [ ] **Step 6: Implement complete route**

```ts
// src/app/api/survey/complete/route.ts
import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function POST() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { surveyCompleted: true },
  })

  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 7: Run all tests**

```bash
npx jest __tests__/api/survey-answer.test.ts __tests__/api/survey-complete.test.ts --no-coverage
```

Expected: all tests PASS

- [ ] **Step 8: Commit**

```bash
git add src/app/api/survey/ __tests__/api/survey-answer.test.ts __tests__/api/survey-complete.test.ts prisma/
git commit -m "feat: add survey answer and complete API routes"
```

---

## Task 6: Middleware

**Files:**
- Create: `src/middleware.ts`

- [ ] **Step 1: Write middleware**

```ts
// src/middleware.ts
import { auth } from "@/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const { nextUrl } = req
  const session = req.auth
  const isLoggedIn = !!session

  const isPublicPath =
    nextUrl.pathname === "/login" || nextUrl.pathname === "/register"
  const isSurveyPath = nextUrl.pathname === "/onboarding/survey"
  const isDashboardPath = nextUrl.pathname.startsWith("/dashboard")

  // Not logged in — send to login (except public pages)
  if (!isLoggedIn && !isPublicPath) {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  // Logged in + visiting public page — route based on survey status
  if (isLoggedIn && isPublicPath) {
    if (!session.user.surveyCompleted) {
      return NextResponse.redirect(new URL("/onboarding/survey", req.url))
    }
    return NextResponse.redirect(new URL(`/dashboard/${session.user.role}`, req.url))
  }

  // Logged in + survey not done + trying to reach dashboard — send to survey
  if (isLoggedIn && isDashboardPath && !session.user.surveyCompleted) {
    return NextResponse.redirect(new URL("/onboarding/survey", req.url))
  }

  // Logged in + survey done + on survey page — send to dashboard
  if (isLoggedIn && isSurveyPath && session.user.surveyCompleted) {
    return NextResponse.redirect(new URL(`/dashboard/${session.user.role}`, req.url))
  }

  // Logged in + dashboard — enforce role-matching path
  if (isLoggedIn && isDashboardPath) {
    const expectedPath = `/dashboard/${session.user.role}`
    if (nextUrl.pathname !== expectedPath) {
      return NextResponse.redirect(new URL(expectedPath, req.url))
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors (or only pre-existing errors from stub pages).

- [ ] **Step 3: Commit**

```bash
git add src/middleware.ts
git commit -m "feat: add auth and survey-gate middleware"
```

---

## Task 7: Survey Questions Data

**Files:**
- Create: `src/lib/questions.ts`

- [ ] **Step 1: Write questions module**

```ts
// src/lib/questions.ts
export interface Question {
  id: string
  text: string
}

export const agentQuestions: Question[] = [
  {
    id: "AUT_A1",
    text: "I perform better when I can decide how to approach my work.",
  },
  {
    id: "COM_A1",
    text: "I feel unsettled if I go long periods without specific feedback on my work.",
  },
  {
    id: "REL_A1",
    text: "Extended periods of working independently reduce my motivation.",
  },
  {
    id: "GRIT_A1",
    text: "I continue working toward goals even when progress is slow or unclear.",
  },
  {
    id: "SR_A1",
    text: "I follow a consistent structure when completing my responsibilities.",
  },
]

export const brokerQuestions: Question[] = [
  {
    id: "AUT_B1",
    text: "This brokerage allows individuals to decide how they approach their work.",
  },
  {
    id: "COM_B1",
    text: "This brokerage provides specific actionable feedback that helps people understand how they are performing.",
  },
  {
    id: "REL_B1",
    text: "This brokerage fosters meaningful connection among the people who work here.",
  },
  {
    id: "GRIT_B1",
    text: "Agents here are expected to maintain consistent outreach even during extended slow periods.",
  },
  {
    id: "SR_B1",
    text: "Clear weekly activity expectations are defined for agents here.",
  },
]

export const LIKERT_OPTIONS = [
  { value: 1, label: "1 - Strongly Disagree" },
  { value: 2, label: "2 - Disagree" },
  { value: 3, label: "3 - Neither Agree nor Disagree" },
  { value: 4, label: "4 - Agree" },
  { value: 5, label: "5 - Strongly Agree" },
]
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/questions.ts
git commit -m "feat: add survey question data for agent and broker roles"
```

---

## Task 8: Survey UI Components (JotForm Style)

**Files:**
- Create: `src/components/survey/SurveyQuestion.tsx`
- Create: `src/components/survey/ProgressDots.tsx`
- Create: `src/components/survey/SurveyFlow.tsx`
- Create: `__tests__/components/SurveyQuestion.test.tsx`

- [ ] **Step 1: Write failing test for SurveyQuestion**

```tsx
// __tests__/components/SurveyQuestion.test.tsx
import { render, screen, fireEvent } from "@testing-library/react"
import { SurveyQuestion } from "@/components/survey/SurveyQuestion"
import { LIKERT_OPTIONS } from "@/lib/questions"

const question = { id: "AUT_A1", text: "I perform better when I can decide how to approach my work." }

describe("SurveyQuestion", () => {
  it("renders question text", () => {
    render(
      <SurveyQuestion
        question={question}
        answer={undefined}
        onAnswer={jest.fn()}
        error={false}
        onNext={jest.fn()}
        onPrev={jest.fn()}
        canGoPrev={false}
        current={0}
        total={5}
      />
    )
    expect(screen.getByText(/I perform better/i)).toBeInTheDocument()
  })

  it("shows error message when error=true", () => {
    render(
      <SurveyQuestion
        question={question}
        answer={undefined}
        onAnswer={jest.fn()}
        error={true}
        onNext={jest.fn()}
        onPrev={jest.fn()}
        canGoPrev={false}
        current={0}
        total={5}
      />
    )
    expect(screen.getByText("This field is required.")).toBeInTheDocument()
  })

  it("calls onAnswer when a radio option is clicked", () => {
    const onAnswer = jest.fn()
    render(
      <SurveyQuestion
        question={question}
        answer={undefined}
        onAnswer={onAnswer}
        error={false}
        onNext={jest.fn()}
        onPrev={jest.fn()}
        canGoPrev={false}
        current={0}
        total={5}
      />
    )
    fireEvent.click(screen.getByText("4 - Agree"))
    expect(onAnswer).toHaveBeenCalledWith(4)
  })

  it("shows page counter", () => {
    render(
      <SurveyQuestion
        question={question}
        answer={undefined}
        onAnswer={jest.fn()}
        error={false}
        onNext={jest.fn()}
        onPrev={jest.fn()}
        canGoPrev={false}
        current={2}
        total={5}
      />
    )
    expect(screen.getByText("3 of 5")).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx jest __tests__/components/SurveyQuestion.test.tsx --no-coverage
```

Expected: FAIL — module not found

- [ ] **Step 3: Implement SurveyQuestion component**

```tsx
// src/components/survey/SurveyQuestion.tsx
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
      {/* White card body */}
      <div className="bg-white px-8 py-8 min-h-[320px]">
        <p className="text-[#e53e3e] font-semibold text-xl leading-snug mb-6">
          {question.text}
          <span className="text-[#e53e3e]"> *</span>
        </p>
        <div className="flex flex-col gap-2">
          {LIKERT_OPTIONS.map((opt) => {
            const selected = answer === opt.value
            return (
              <button
                key={opt.value}
                onClick={() => onAnswer(opt.value)}
                className={`flex items-center gap-3 w-full text-left px-4 py-3 border rounded transition-colors
                  ${selected
                    ? "border-[#1a73e8] bg-[#e8f0fe]"
                    : "border-gray-300 hover:border-gray-400"
                  }`}
              >
                <span
                  className={`w-5 h-5 rounded-full border-2 flex-shrink-0 transition-colors
                    ${selected ? "border-[#1a73e8] bg-[#1a73e8]" : "border-gray-400"}`}
                />
                <span className="text-gray-800 text-sm">{opt.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Green footer bar */}
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

- [ ] **Step 4: Implement ProgressDots component**

```tsx
// src/components/survey/ProgressDots.tsx
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
            className={`rounded-full transition-all
              ${completed ? "w-4 h-4 bg-[#4caf50]" : ""}
              ${active ? "w-4 h-4 border-2 border-white bg-transparent ring-2 ring-white" : ""}
              ${!completed && !active ? "w-3 h-3 border border-white opacity-50" : ""}
            `}
          />
        )
      })}
    </div>
  )
}
```

- [ ] **Step 5: Implement SurveyFlow component**

```tsx
// src/components/survey/SurveyFlow.tsx
"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { SurveyQuestion } from "./SurveyQuestion"
import { ProgressDots } from "./ProgressDots"
import { Question } from "@/lib/questions"

interface Props {
  questions: Question[]
  role: string
}

export function SurveyFlow({ questions, role }: Props) {
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [error, setError] = useState(false)
  const router = useRouter()
  const { update } = useSession()

  const question = questions[current]
  const answer = answers[question.id]
  const isLast = current === questions.length - 1

  async function handleNext() {
    if (!answer) {
      setError(true)
      return
    }
    setError(false)

    await fetch("/api/survey/answer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ questionId: question.id, answer }),
    })

    if (isLast) {
      await fetch("/api/survey/complete", { method: "POST" })
      await update({ surveyCompleted: true })
      router.push(`/dashboard/${role}`)
    } else {
      setCurrent((c) => c + 1)
    }
  }

  function handlePrev() {
    if (current > 0) {
      setError(false)
      setCurrent((c) => c - 1)
    }
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ backgroundColor: "#1a73e8" }}
    >
      <SurveyQuestion
        question={question}
        answer={answer}
        onAnswer={(val) => {
          setAnswers((a) => ({ ...a, [question.id]: val }))
          setError(false)
        }}
        error={error}
        onNext={handleNext}
        onPrev={handlePrev}
        canGoPrev={current > 0}
        current={current}
        total={questions.length}
      />
      <ProgressDots current={current} total={questions.length} />
    </div>
  )
}
```

- [ ] **Step 6: Run tests**

```bash
npx jest __tests__/components/SurveyQuestion.test.tsx --no-coverage
```

Expected: all 4 tests PASS

- [ ] **Step 7: Commit**

```bash
git add src/components/survey/ __tests__/components/SurveyQuestion.test.tsx
git commit -m "feat: add JotForm-style survey UI components"
```

---

## Task 9: Survey Page

**Files:**
- Create: `src/app/onboarding/survey/page.tsx`

- [ ] **Step 1: Create survey page**

```tsx
// src/app/onboarding/survey/page.tsx
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { SurveyFlow } from "@/components/survey/SurveyFlow"
import { agentQuestions, brokerQuestions } from "@/lib/questions"

export default async function SurveyPage() {
  const session = await auth()
  if (!session) redirect("/login")
  if (session.user.surveyCompleted) redirect(`/dashboard/${session.user.role}`)

  const questions =
    session.user.role === "agent" ? agentQuestions : brokerQuestions

  return <SurveyFlow questions={questions} role={session.user.role} />
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/onboarding/
git commit -m "feat: add survey onboarding page"
```

---

## Task 10: Auth UI Components + Login Page

**Files:**
- Create: `src/components/auth/LoginForm.tsx`
- Create: `src/app/(auth)/login/page.tsx`
- Create: `__tests__/components/LoginForm.test.tsx`

- [ ] **Step 1: Write failing test**

```tsx
// __tests__/components/LoginForm.test.tsx
import { render, screen, fireEvent } from "@testing-library/react"
import { LoginForm } from "@/components/auth/LoginForm"

jest.mock("next-auth/react", () => ({ signIn: jest.fn() }))
jest.mock("next/navigation", () => ({ useRouter: () => ({ push: jest.fn() }) }))

describe("LoginForm", () => {
  it("renders email and password fields", () => {
    render(<LoginForm />)
    expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/password/i)).toBeInTheDocument()
  })

  it("shows error when fields are empty on submit", async () => {
    render(<LoginForm />)
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }))
    expect(await screen.findByText(/email is required/i)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx jest __tests__/components/LoginForm.test.tsx --no-coverage
```

Expected: FAIL

- [ ] **Step 3: Implement LoginForm**

```tsx
// src/components/auth/LoginForm.tsx
"use client"
import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"

export function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email) { setError("Email is required"); return }
    if (!password) { setError("Password is required"); return }

    setLoading(true)
    setError("")

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    })

    setLoading(false)

    if (res?.error) {
      setError("Invalid email or password")
    } else {
      router.push("/onboarding/survey")
      router.refresh()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full max-w-sm">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#1a73e8]"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#1a73e8]"
        />
      </div>
      {error && <p className="text-[#e53e3e] text-sm">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="bg-[#1a73e8] text-white rounded px-4 py-2 font-semibold text-sm hover:bg-[#1557b0] disabled:opacity-60"
      >
        {loading ? "Signing in…" : "Sign In"}
      </button>
      <p className="text-sm text-gray-500 text-center">
        No account?{" "}
        <Link href="/register" className="text-[#1a73e8] font-medium">
          Register
        </Link>
      </p>
    </form>
  )
}
```

- [ ] **Step 4: Create login page**

```tsx
// src/app/(auth)/login/page.tsx
import { LoginForm } from "@/components/auth/LoginForm"

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-xl shadow-md px-8 py-10 w-full max-w-sm">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Welcome back</h1>
        <p className="text-sm text-gray-500 mb-6">Sign in to KasbyIQ</p>
        <LoginForm />
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Run tests**

```bash
npx jest __tests__/components/LoginForm.test.tsx --no-coverage
```

Expected: 2 tests PASS

- [ ] **Step 6: Commit**

```bash
git add src/components/auth/LoginForm.tsx src/app/\(auth\)/login/ __tests__/components/LoginForm.test.tsx
git commit -m "feat: add login form and login page"
```

---

## Task 11: Register Page

**Files:**
- Create: `src/components/auth/RegisterForm.tsx`
- Create: `src/app/(auth)/register/page.tsx`
- Create: `__tests__/components/RegisterForm.test.tsx`

- [ ] **Step 1: Write failing test**

```tsx
// __tests__/components/RegisterForm.test.tsx
import { render, screen } from "@testing-library/react"
import { RegisterForm } from "@/components/auth/RegisterForm"

jest.mock("next/navigation", () => ({ useRouter: () => ({ push: jest.fn() }) }))

describe("RegisterForm", () => {
  it("renders all fields including role selector", () => {
    render(<RegisterForm />)
    expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/password/i)).toBeInTheDocument()
    expect(screen.getByText("Agent")).toBeInTheDocument()
    expect(screen.getByText("Broker")).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx jest __tests__/components/RegisterForm.test.tsx --no-coverage
```

Expected: FAIL

- [ ] **Step 3: Implement RegisterForm**

```tsx
// src/components/auth/RegisterForm.tsx
"use client"
import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"

export function RegisterForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState<"agent" | "broker">("agent")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !password) { setError("All fields are required"); return }
    if (password.length < 8) { setError("Password must be at least 8 characters"); return }

    setLoading(true)
    setError("")

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, role }),
    })

    if (!res.ok) {
      const data = await res.json()
      setError(data.error ?? "Registration failed")
      setLoading(false)
      return
    }

    await signIn("credentials", { email, password, redirect: false })
    router.push("/onboarding/survey")
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full max-w-sm">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#1a73e8]"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#1a73e8]"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">I am a…</label>
        <div className="flex gap-3">
          {(["agent", "broker"] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRole(r)}
              className={`flex-1 py-2 rounded border font-medium text-sm capitalize transition-colors
                ${role === r
                  ? "border-[#1a73e8] bg-[#e8f0fe] text-[#1a73e8]"
                  : "border-gray-300 text-gray-600 hover:border-gray-400"
                }`}
            >
              {r.charAt(0).toUpperCase() + r.slice(1)}
            </button>
          ))}
        </div>
      </div>
      {error && <p className="text-[#e53e3e] text-sm">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="bg-[#1a73e8] text-white rounded px-4 py-2 font-semibold text-sm hover:bg-[#1557b0] disabled:opacity-60"
      >
        {loading ? "Creating account…" : "Create Account"}
      </button>
      <p className="text-sm text-gray-500 text-center">
        Already have an account?{" "}
        <Link href="/login" className="text-[#1a73e8] font-medium">
          Sign in
        </Link>
      </p>
    </form>
  )
}
```

- [ ] **Step 4: Create register page**

```tsx
// src/app/(auth)/register/page.tsx
import { RegisterForm } from "@/components/auth/RegisterForm"

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-xl shadow-md px-8 py-10 w-full max-w-sm">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Create account</h1>
        <p className="text-sm text-gray-500 mb-6">Join KasbyIQ</p>
        <RegisterForm />
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Run tests**

```bash
npx jest __tests__/components/RegisterForm.test.tsx --no-coverage
```

Expected: 1 test PASS

- [ ] **Step 6: Commit**

```bash
git add src/components/auth/RegisterForm.tsx src/app/\(auth\)/register/ __tests__/components/RegisterForm.test.tsx
git commit -m "feat: add register form with role selector and register page"
```

---

## Task 12: Dashboard Stubs + Final Checks

**Files:**
- Create: `src/app/dashboard/agent/page.tsx`
- Create: `src/app/dashboard/broker/page.tsx`

- [ ] **Step 1: Create agent dashboard stub**

```tsx
// src/app/dashboard/agent/page.tsx
import { auth } from "@/auth"
import { redirect } from "next/navigation"

export default async function AgentDashboard() {
  const session = await auth()
  if (!session) redirect("/login")

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Agent Dashboard</h1>
        <p className="text-gray-500">Welcome, {session.user.email}</p>
        <p className="text-sm text-gray-400 mt-2">Full dashboard coming in Phase 2.</p>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create broker dashboard stub**

```tsx
// src/app/dashboard/broker/page.tsx
import { auth } from "@/auth"
import { redirect } from "next/navigation"

export default async function BrokerDashboard() {
  const session = await auth()
  if (!session) redirect("/login")

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Broker Dashboard</h1>
        <p className="text-gray-500">Welcome, {session.user.email}</p>
        <p className="text-sm text-gray-400 mt-2">Full dashboard coming in Phase 2.</p>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Run full test suite**

```bash
npx jest --no-coverage
```

Expected: all tests PASS

- [ ] **Step 4: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 5: Run dev server and manually verify the full flow**

```bash
npm run dev
```

Test the following:
1. Go to `http://localhost:3000` → should redirect to `/login`
2. Go to `/register` → create an agent account → should redirect to `/onboarding/survey`
3. Answer all 5 questions → should redirect to `/dashboard/agent`
4. Log out and register a broker account → verify broker questions appear
5. Try navigating to `/dashboard/broker` while logged in as agent → should redirect to `/dashboard/agent`

- [ ] **Step 6: Final commit**

```bash
git add src/app/dashboard/
git commit -m "feat: add agent and broker dashboard stubs — Phase 1 complete"
```

---

## Self-Review Checklist (for implementer)

- [ ] All 5 agent questions visible in survey when logged in as agent
- [ ] All 5 broker questions visible in survey when logged in as broker
- [ ] Error pill appears when clicking NEXT without selecting an answer
- [ ] PREVIOUS button disabled on question 1
- [ ] Progress dots advance correctly
- [ ] Completing survey sets `surveyCompleted = true` in DB
- [ ] Revisiting `/onboarding/survey` after completion redirects to dashboard
- [ ] Agent cannot access `/dashboard/broker` and vice versa
