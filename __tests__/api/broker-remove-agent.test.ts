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
