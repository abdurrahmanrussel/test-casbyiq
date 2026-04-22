import { auth } from "@/auth"
import { redirect } from "next/navigation"

export default async function BrokerDashboard() {
  const session = await auth()
  if (!session) redirect("/login")

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Broker Dashboard</h1>
        <p className="text-gray-500">Welcome, {session.user.email}</p>
        <p className="text-sm text-gray-400 mt-2">Full dashboard coming in Phase 2.</p>
      </div>
    </div>
  )
}
