"use client"

import { useState } from "react"

export function InvitationActions({ token, brokerEmail }: { token: string; brokerEmail: string }) {
  const [state, setState] = useState<"idle" | "loading" | "accepted" | "declined" | "error">("idle")
  const [errorMsg, setErrorMsg] = useState("")

  async function respond(action: "accept" | "decline") {
    setState("loading")
    const res = await fetch("/api/invitation/accept", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, action }),
    })
    if (res.ok) {
      setState(action === "accept" ? "accepted" : "declined")
    } else {
      const data = await res.json().catch(() => ({}))
      setErrorMsg(data.error ?? "Something went wrong.")
      setState("error")
    }
  }

  if (state === "accepted") {
    return (
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>✓</div>
        <div style={{ fontSize: 15, fontWeight: 500, color: "#1a1916", marginBottom: 6 }}>Connected</div>
        <div style={{ fontSize: 13, color: "#6b6a66", marginBottom: 20 }}>
          You are now connected with {brokerEmail}. They can view your KasbyIQ fit profile.
        </div>
        <a href="/dashboard/agent" style={{ fontSize: 13, color: "#639922", textDecoration: "none" }}>
          Go to your dashboard →
        </a>
      </div>
    )
  }

  if (state === "declined") {
    return (
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 13, color: "#6b6a66", marginBottom: 12 }}>
          You declined the invitation from {brokerEmail}.
        </div>
        <a href="/dashboard/agent" style={{ fontSize: 13, color: "#639922", textDecoration: "none" }}>
          Go to your dashboard →
        </a>
      </div>
    )
  }

  return (
    <div>
      {state === "error" && (
        <div style={{ fontSize: 12, color: "#E24B4A", marginBottom: 16 }}>{errorMsg}</div>
      )}
      <div style={{ display: "flex", gap: 10 }}>
        <button
          onClick={() => respond("accept")}
          disabled={state === "loading"}
          style={{ flex: 1, padding: "10px 0", background: "#1a1916", color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}
        >
          Accept
        </button>
        <button
          onClick={() => respond("decline")}
          disabled={state === "loading"}
          style={{ flex: 1, padding: "10px 0", background: "#fff", color: "#1a1916", border: "1px solid rgba(0,0,0,0.14)", borderRadius: 8, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}
        >
          Decline
        </button>
      </div>
    </div>
  )
}
