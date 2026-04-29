import NextAuth, { CredentialsSignin } from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

class NoAccountError extends CredentialsSignin {
  code = "no_account"
}

class WrongPasswordError extends CredentialsSignin {
  code = "wrong_password"
}

class UnverifiedEmailError extends CredentialsSignin {
  code = "unverified_email"
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null
        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        })
        if (!user) throw new NoAccountError()
        const valid = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        )
        if (!valid) throw new WrongPasswordError()
        if (!user.emailVerified) throw new UnverifiedEmailError()
        return {
          id: user.id,
          email: user.email,
          role: user.role,
          surveyCompleted: user.surveyCompleted,
        }
      },
    }),
  ],
  callbacks: {
    jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id as string
        token.role = user.role
        token.surveyCompleted = user.surveyCompleted
      }
      if (trigger === "update" && session?.surveyCompleted !== undefined) {
        token.surveyCompleted = session.surveyCompleted
      }
      return token
    },
    session({ session, token }) {
      session.user.id = token.id
      session.user.role = token.role
      session.user.surveyCompleted = token.surveyCompleted
      return session
    },
  },
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt" },
})
