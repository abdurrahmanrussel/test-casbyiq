/**
 * auto-survey.ts
 *
 * Creates test users and fills their intake surveys with random answers.
 *
 * Usage:
 *   npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/auto-survey.ts
 *   npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/auto-survey.ts --role agent
 *   npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/auto-survey.ts --role broker
 *   npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/auto-survey.ts --email test@example.com --password pass1234 --role agent
 *   npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/auto-survey.ts --count 3
 */

import { PrismaClient } from "@prisma/client"
import { PrismaNeonHttp } from "@prisma/adapter-neon"
import { neonConfig } from "@neondatabase/serverless"
import { Agent, fetch as undiciF } from "undici"
import * as dotenv from "dotenv"
import * as bcrypt from "bcryptjs"

dotenv.config({ path: ".env.local" })

// Force IPv4 — Node 25 prefers IPv6 but Neon is only reachable via IPv4 here
const agent = new Agent({ connect: { family: 4 } } as never)
neonConfig.fetchFunction = (url: string, init?: RequestInit) =>
  undiciF(url, { ...(init as Parameters<typeof undiciF>[1]), dispatcher: agent })

const prisma = new PrismaClient({
  adapter: new PrismaNeonHttp(process.env.DATABASE_URL!, {}),
})

// ─── CLI args ────────────────────────────────────────────────────────────────

const args = process.argv.slice(2)
function getArg(flag: string): string | undefined {
  const i = args.indexOf(flag)
  return i !== -1 ? args[i + 1] : undefined
}

const cliRole    = getArg("--role") as "agent" | "broker" | undefined
const cliEmail   = getArg("--email")
const cliPass    = getArg("--password") ?? "Password123"
const cliCount   = parseInt(getArg("--count") ?? "1", 10)

// ─── Random helpers ──────────────────────────────────────────────────────────

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function pick<T>(arr: T[]): T {
  return arr[randInt(0, arr.length - 1)]
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = randInt(0, i);
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function randomSubset<T>(arr: T[], min = 1, max?: number): T[] {
  const n = randInt(min, Math.min(max ?? arr.length, arr.length))
  return shuffle(arr).slice(0, n)
}

// ─── Answer generator ────────────────────────────────────────────────────────

function randomAnswer(q: { questionType: string; options: unknown }): string {
  const opts = Array.isArray(q.options) ? (q.options as string[]) : []

  switch (q.questionType) {
    case "likert":
      return String(randInt(1, 5))

    case "scale":
      return opts.length > 0 ? pick(opts) : String(randInt(1, 5))

    case "multiple_choice":
      return opts.length > 0 ? pick(opts) : "Option A"

    case "checkbox":
      return JSON.stringify(opts.length > 0 ? randomSubset(opts, 1, 3) : ["Option A"])

    case "rank":
      return JSON.stringify(opts.length > 0 ? shuffle(opts) : ["Option A"])

    case "yes_no":
      return pick(["yes", "no"])

    case "number":
      return String(randInt(0, 100))

    case "text":
      return pick([
        "Things are going well overall.",
        "Still learning and adjusting.",
        "Making progress each week.",
        "Focused on building better habits.",
        "Nothing specific to add.",
      ])

    default:
      return "yes"
  }
}

// ─── Scoring (mirrors src/lib/scoring.ts) ────────────────────────────────────

const AGENT_DIMS: Record<string, string[]> = {
  autonomyScore:    ["AUT_A1","AUT_A2","AUT_A3","AUT_A4","AUT_A5","AUT_A6"],
  competenceScore:  ["COM_A1","COM_A2","COM_A3","COM_A4","COM_A5","COM_A6"],
  relatednessScore: ["REL_A1","REL_A2","REL_A3","REL_A4","REL_A5","REL_A6"],
  gritScore:        ["GRIT_A1","GRIT_A2","GRIT_A3","GRIT_A4","GRIT_A5","GRIT_A6"],
  selfRegScore:     ["SR_A1","SR_A2","SR_A3","SR_A4","SR_A5","SR_A6"],
  eiScore:          ["EI_A1","EI_A2","EI_A3","EI_A4","EI_A5","EI_A6"],
}

function calcScore(answers: Record<string, string>, ids: string[]): number {
  const nums = ids.map(id => parseInt(answers[id] ?? "0", 10)).filter(n => n >= 1 && n <= 5)
  if (nums.length === 0) return 0
  const avg = nums.reduce((s, n) => s + n, 0) / nums.length
  return Math.round(((avg - 1) / 4) * 1000) / 10
}

function calculateAgentScores(answers: Record<string, string>) {
  const autonomyScore    = calcScore(answers, AGENT_DIMS.autonomyScore)
  const competenceScore  = calcScore(answers, AGENT_DIMS.competenceScore)
  const relatednessScore = calcScore(answers, AGENT_DIMS.relatednessScore)
  const gritScore        = calcScore(answers, AGENT_DIMS.gritScore)
  const selfRegScore     = calcScore(answers, AGENT_DIMS.selfRegScore)
  const eiScore          = calcScore(answers, AGENT_DIMS.eiScore)
  const overallScore     = Math.round(
    ((autonomyScore + competenceScore + relatednessScore + gritScore + selfRegScore + eiScore) / 6) * 10
  ) / 10
  return { autonomyScore, competenceScore, relatednessScore, gritScore, selfRegScore, eiScore, overallScore }
}

// ─── Core logic ──────────────────────────────────────────────────────────────

async function runForUser(email: string, password: string, role: "agent" | "broker") {
  const surveyType = role === "agent" ? "agent_intake" : "broker_intake"

  // Create or update user (verified, survey not yet complete)
  const passwordHash = await bcrypt.hash(password, 12)
  const user = await prisma.user.upsert({
    where: { email },
    update: { emailVerified: true, surveyCompleted: false },
    create: { email, passwordHash, role, emailVerified: true },
  })

  console.log(`  User: ${email} (${role}) — id: ${user.id}`)

  // Fetch questions
  const questions = await prisma.question.findMany({
    where: { surveyType },
    orderBy: { sortOrder: "asc" },
    select: { id: true, questionType: true, options: true, required: true },
  })

  console.log(`  Questions: ${questions.length}`)

  // Generate answers
  const answers: Record<string, string> = {}
  for (const q of questions) {
    answers[q.id] = randomAnswer(q)
  }

  // Write responses
  await Promise.all(
    questions.map(q =>
      prisma.surveyResponse.upsert({
        where: { userId_questionId: { userId: user.id, questionId: q.id } },
        update: { answer: answers[q.id] },
        create: { userId: user.id, questionId: q.id, answer: answers[q.id] },
      })
    )
  )

  // Calculate & store scores (agents only)
  if (role === "agent") {
    const scores = calculateAgentScores(answers)
    await prisma.user.update({
      where: { id: user.id },
      data: { surveyCompleted: true },
    })
    await prisma.scoreResult.upsert({
      where: { userId: user.id },
      update: { ...scores, surveyType },
      create: { userId: user.id, surveyType, ...scores },
    })
    console.log(
      `  Scores: overall=${scores.overallScore} | aut=${scores.autonomyScore} com=${scores.competenceScore} ` +
      `rel=${scores.relatednessScore} grit=${scores.gritScore} sr=${scores.selfRegScore} ei=${scores.eiScore}`
    )
  } else {
    await prisma.user.update({
      where: { id: user.id },
      data: { surveyCompleted: true },
    })
    console.log(`  Survey marked complete (broker — no dimension scores)`)
  }

  console.log(`  Password: ${password}`)
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const roles: Array<"agent" | "broker"> = cliRole ? [cliRole] : ["agent", "broker"]

  for (let i = 0; i < cliCount; i++) {
    for (const role of roles) {
      const email = cliEmail
        ? (cliCount > 1 || roles.length > 1 ? `${i + 1}.${role}.${cliEmail}` : cliEmail)
        : `test.${role}.${Date.now() + i}@kasbyiq.dev`

      console.log(`\n[${i + 1}/${cliCount}] Creating ${role}...`)
      await runForUser(email, cliPass, role)
    }
  }

  console.log("\nDone.")
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
