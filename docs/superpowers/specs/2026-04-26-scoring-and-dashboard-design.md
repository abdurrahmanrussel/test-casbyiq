# Scoring & Dashboard Design
_Date: 2026-04-26_

## Overview

Build the KasbyIQ fit scoring system and replace the placeholder dashboards with the full UI matching the provided mockup. Covers: schema additions, score calculation at survey submission, broker agent management, and both agent and broker dashboard views.

---

## 1. Schema Changes

### 1a. `brokerId` on `User` (self-referencing)

Agents are linked to their broker by setting `brokerId` on the agent's `User` row. A broker adds agents by entering their email address in the dashboard.

```prisma
model User {
  // existing fields...
  brokerId  String?
  broker    User?   @relation("BrokerAgents", fields: [brokerId], references: [id])
  agents    User[]  @relation("BrokerAgents")
}
```

### 1b. New `ScoreResult` table

One row per user, written atomically when the survey is completed. Stores all 6 dimension scores and the overall fit score, each as a `Float` 0–100.

```prisma
model ScoreResult {
  id               String   @id @default(uuid())
  userId           String   @unique
  user             User     @relation(fields: [userId], references: [id])
  surveyType       String
  autonomyScore    Float
  competenceScore  Float
  relatednessScore Float
  gritScore        Float
  selfRegScore     Float
  eiScore          Float
  overallScore     Float
  createdAt        DateTime @default(now())
}
```

---

## 2. Scoring Logic

### Question mapping (dimension → question ID prefix)

| Dimension      | Question IDs         |
|----------------|----------------------|
| Autonomy       | AUT_A1 – AUT_A6      |
| Competence     | COM_A1 – COM_A6      |
| Relatedness    | REL_A1 – REL_A6      |
| Grit           | GRIT_A1 – GRIT_A6    |
| Self-Regulation| SR_A1 – SR_A6        |
| Emotional Intel| EI_A1 – EI_A6        |

### Formula

1. For each dimension, fetch the 6 `SurveyResponse` rows where `questionId` matches.
2. Parse each `answer` as an integer (1–5).
3. `dimensionScore = ((average - 1) / 4) * 100` → rounds to 1 decimal, range 0–100.
4. `overallScore = average of 6 dimension scores`.

### Trigger point

Calculation happens inside `/api/survey/complete` (POST), synchronously before returning the response. If any of the 36 scored questions are unanswered, the calculation is skipped and an error is returned.

---

## 3. Agent Management

### API: `POST /api/broker/add-agent`

- Caller must be authenticated with `role = broker`.
- Body: `{ email: string }`
- Looks up `User` by email.
- Validates: user exists, `role = agent`, not already linked to a different broker.
- Sets `brokerId = session.user.id` on the agent row.
- Error responses: 404 not found, 400 already linked, 400 not an agent, 403 unauthorized.

### API: `DELETE /api/broker/remove-agent`

- Body: `{ agentId: string }`
- Sets `brokerId = null` on the agent row (unlinks them).
- Caller must be the agent's current broker.

---

## 4. Broker Dashboard

**Style:** Matches mockup — `#f7f6f3` background, DM Sans + DM Mono fonts, white card surfaces, warm borders.

### Metric strip (4 cards)
- Active agents (count of linked agents)
- Coaching flags (count of agents with any dimension score < 50)
- Avg fit score (average `overallScore` across linked agents who have completed)
- Check-ins pending (placeholder count for now — shows 0)

### Agent roster
- One card per linked agent (all agents, including pending ones).
- **Completed agents:** avatar initials (colour-coded), name, day count since joined, overall score, 6 dimension progress bars with scores, coaching flag panel if any dimension < 50.
- **Pending agents:** same card layout but greyed out, "Survey pending" label instead of score.
- Card footer: survey status / next check-in date.

### Manage Agents panel
- Email input + Add button.
- List of currently linked agents with a Remove link per row.
- Inline error/success feedback.

### Score colour thresholds
| Score    | Colour |
|----------|--------|
| ≥ 70     | Green  |
| 50 – 69  | Amber  |
| < 50     | Red    |

---

## 5. Agent Dashboard

**Style:** Same warm minimal theme as broker dashboard.

### Journey bar (3 steps)
- Step 1 — Day 0 baseline (always complete after survey submission)
- Step 2 — 90-day check-in (shows due date; locked until Day 90)
- Step 3 — 180-day check-in (locked until Step 2 complete)

Day count is calculated from `User.createdAt`.

### Growth area cards (6 cards)
Friendly display names instead of clinical dimension names:

| Dimension       | Display name        |
|-----------------|---------------------|
| Grit            | Follow-through      |
| Self-Regulation | Business systems    |
| EI              | Client connection   |
| Autonomy        | Independent drive   |
| Competence      | Skill confidence    |
| Relatedness     | Team connection     |

Each card: display name, score (colour-coded), progress bar, 1-line description (static coaching copy per dimension, not personalised yet).

### Broker note panel
Static blue panel at bottom showing broker's name and a fixed message about upcoming check-ins.

---

## 6. Out of Scope (this phase)

- 90-day and 180-day survey flows (surveys don't exist yet)
- Personalised AI coaching narratives
- Check-in date tracking / notification system
- Broker survey scoring (broker intake answers not scored in this phase — only agent intake)
.