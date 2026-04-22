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
