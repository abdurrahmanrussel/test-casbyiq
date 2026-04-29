import { PrismaClient } from "@prisma/client"
import { PrismaNeonHttp } from "@prisma/adapter-neon"
import { neonConfig } from "@neondatabase/serverless"

// In dev on hosts without IPv6 routing, undici tries IPv6 first and gets
// ENETUNREACH before falling back to IPv4. Override with an IPv4-only fetch.
if (process.env.NODE_ENV !== "production") {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Agent, fetch: undiciF } = require("undici") as typeof import("undici")
    const agent = new Agent({ connect: { family: 4 } } as never)
    neonConfig.fetchFunction = (url: string, init?: RequestInit) =>
      undiciF(url, { ...(init as Parameters<typeof undiciF>[1]), dispatcher: agent })
  } catch {
    // undici not available — global fetch will be used as-is
  }
}

const createPrismaClient = () => {
  const adapter = new PrismaNeonHttp(process.env.DATABASE_URL!, {})
  return new PrismaClient({ adapter })
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma
