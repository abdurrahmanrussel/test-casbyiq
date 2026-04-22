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
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: "1" })
    const res = await POST(makeRequest({ email: "a@b.com", password: "pass123", role: "agent" }))
    expect(res.status).toBe(409)
  })

  it("returns 201 and creates user on valid input", async () => {
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)
    ;(prisma.user.create as jest.Mock).mockResolvedValue({
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
