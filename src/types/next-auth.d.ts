import "next-auth"
import "next-auth/jwt"

declare module "next-auth" {
  interface User {
    role: string
    surveyCompleted: boolean
  }
  interface Session {
    user: {
      id: string
      email: string
      role: string
      surveyCompleted: boolean
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    role: string
    surveyCompleted: boolean
  }
}
