import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { sendVerificationEmail } from "@/lib/email"
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
  const emailVerifyToken = crypto.randomUUID()

  await prisma.user.create({
    data: { email, passwordHash, role, emailVerifyToken },
  })

  await sendVerificationEmail({ email, token: emailVerifyToken })

  return NextResponse.json({ message: "Check your email to verify your account." }, { status: 201 })
}
