"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"

type Agent = {
  id: string
  email: string
  surveyCompleted: boolean
}

export function ManageAgents({ agents }: { agents: Agent[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null)

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setMessage(null)
    const res = await fetch("/api/broker/add-agent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    })
    const data = await res.json()
    if (res.ok) {
      setMessage({ type: "ok", text: "Agent added." })
      setEmail("")
      startTransition(() => router.refresh())
    } else {
      setMessage({ type: "err", text: data.error ?? "Failed to add agent." })
    }
  }

  async function handleRemove(agentId: string) {
    setMessage(null)
    const res = await fetch("/api/broker/remove-agent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agentId }),
    })
    if (res.ok) {
      startTransition(() => router.refresh())
    } else {
      const data = await res.json()
      setMessage({ type: "err", text: data.error ?? "Failed to remove agent." })
    }
  }

  return (
    <div style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.09)", borderRadius: 10, padding: "16px 18px" }}>
      <div style={{ fontSize: 14, fontWeight: 500, color: "#1a1916", marginBottom: 12 }}>Manage agents</div>

      <form onSubmit={handleAdd} style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="agent@example.com"
          required
          style={{ flex: 1, fontSize: 13, padding: "7px 12px", border: "1px solid rgba(0,0,0,0.14)", borderRadius: 6, outline: "none", fontFamily: "inherit" }}
        />
        <button
          type="submit"
          disabled={isPending}
          style={{ fontSize: 13, padding: "7px 16px", border: "1px solid rgba(0,0,0,0.14)", borderRadius: 6, background: "#1a1916", color: "#fff", cursor: "pointer", fontFamily: "inherit" }}
        >
          Add
        </button>
      </form>

      {message && (
        <div style={{ fontSize: 12, marginBottom: 12, color: message.type === "ok" ? "#2A5200" : "#E24B4A" }}>
          {message.text}
        </div>
      )}

      {agents.length === 0 ? (
        <div style={{ fontSize: 13, color: "#9c9b97" }}>No agents linked yet.</div>
      ) : (
        <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 6 }}>
          {agents.map(agent => (
            <li key={agent.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 13, color: "#1a1916" }}>
              <span>
                {agent.email}
                <span style={{ marginLeft: 8, fontSize: 11, color: agent.surveyCompleted ? "#2A5200" : "#9c9b97" }}>
                  {agent.surveyCompleted ? "Survey complete" : "Pending"}
                </span>
              </span>
              <button
                onClick={() => handleRemove(agent.id)}
                style={{ fontSize: 11, color: "#E24B4A", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
