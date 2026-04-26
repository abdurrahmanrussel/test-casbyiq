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
