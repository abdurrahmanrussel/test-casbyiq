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
