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
