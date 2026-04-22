import type { Metadata } from "next"
import { Plus_Jakarta_Sans } from "next/font/google"
import "./globals.css"
import { SessionProvider } from "next-auth/react"

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  weight: ["400", "500", "600", "700", "800"],
})

export const metadata: Metadata = {
  title: "KasbyIQ",
  description: "Psychographic fit for real estate",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${jakarta.variable} font-[family-name:var(--font-jakarta)]`}>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  )
}
