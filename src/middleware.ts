export const runtime = 'edge'

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

  if (!isLoggedIn && !isPublicPath) {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  if (isLoggedIn && isPublicPath) {
    if (!session.user.surveyCompleted) {
      return NextResponse.redirect(new URL("/onboarding/survey", req.url))
    }
    return NextResponse.redirect(new URL(`/dashboard/${session.user.role}`, req.url))
  }

  if (isLoggedIn && isDashboardPath && !session.user.surveyCompleted) {
    return NextResponse.redirect(new URL("/onboarding/survey", req.url))
  }

  if (isLoggedIn && isSurveyPath && session.user.surveyCompleted) {
    return NextResponse.redirect(new URL(`/dashboard/${session.user.role}`, req.url))
  }

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
