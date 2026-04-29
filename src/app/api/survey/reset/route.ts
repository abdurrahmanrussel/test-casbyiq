import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function POST() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  await prisma.user.update({
    where: { id: session.user.id },
    data: { surveyCompleted: false },
  })

  await prisma.surveyResponse.deleteMany({
    where: { userId: session.user.id },
  })

  return NextResponse.json({ ok: true })
}
