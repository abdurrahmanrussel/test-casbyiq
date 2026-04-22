# KasbyIQ — Auth + Survey Design

**Date:** 2026-04-22
**Scope:** Authentication system + onboarding survey (Phase 1)
**Stack:** Next.js (App Router) + NextAuth.js + PostgreSQL

---

## 1. Overview

New users register with an email, password, and role (agent or broker). After login, middleware checks whether the user has completed the onboarding survey. If not, they are redirected to `/onboarding/survey` before reaching any dashboard. The survey is role-aware — agents see 5 agent questions, brokers see 5 broker questions. On completion the user is routed to their role-specific dashboard stub.

---

## 2. Tech Stack

| Concern | Choice |
|---|---|
| Framework | Next.js 14 (App Router) |
| Auth | NextAuth.js v5 (Auth.js) — Credentials provider |
| Database | PostgreSQL via Prisma ORM |
| Styling | Tailwind CSS |
| Session | JWT (role + survey_completed stored in token) |

---

## 3. Database Schema (Auth + Survey)

### User table
```
id                  UUID        PK
email               String      UNIQUE
password_hash       String
role                Enum        agent | broker
survey_completed    Boolean     default false
created_at          Timestamp
```

### SurveyResponse table
```
id                  UUID        PK
user_id             UUID        FK → User
question_id         String      e.g. AUT_A1, COM_B1
answer              Integer     1–5
created_at          Timestamp
```

---

## 4. Pages & Routes

| Route | Description |
|---|---|
| `/login` | Email + password login form. Role is derived from the stored user record, not selected at login. |
| `/register` | Sign-up form: name, email, password, role selector (Agent / Broker). |
| `/onboarding/survey` | JotForm-style survey. Protected — requires auth. Redirects to dashboard on completion. |
| `/dashboard/agent` | Agent dashboard stub. Protected — requires auth + survey_completed. |
| `/dashboard/broker` | Broker dashboard stub. Protected — requires auth + survey_completed. |

---

## 5. Auth Flow

1. User registers → password bcrypt-hashed → `User` row created with `survey_completed = false`
2. User logs in → NextAuth Credentials provider verifies password → JWT issued with `{ id, email, role, survey_completed }`
3. `middleware.ts` runs on every request:
   - Not authenticated → redirect to `/login`
   - Authenticated + `survey_completed = false` + not already on `/onboarding/survey` → redirect to `/onboarding/survey`
   - Authenticated + `survey_completed = true` → allow through to dashboard
4. On survey completion → API route sets `survey_completed = true` on User → session token refreshed → redirect to `/dashboard/[role]`

---

## 6. Survey — JotForm-Style UI

### Behaviour
- One question per page (no scrolling)
- Progress bar at bottom showing `X of 5`
- PREVIOUS / NEXT navigation buttons
- Required validation — cannot advance without selecting an answer
- "This field is required." error message on attempted skip (red pill, matches JotForm)
- Each answer auto-saved to `SurveyResponse` on NEXT press
- On question 5 NEXT → submission API call → redirect to dashboard

### Visual Design (JotForm Classic)
- Full-viewport bright blue background (`#1a73e8`)
- Centered white card, rounded corners, drop shadow
- Question text in red/coral, bold, `*` required marker
- 5 radio options as full-width bordered rows
- Selected row gets blue border + filled radio
- Green footer bar containing PREVIOUS, error message pill, NEXT
- Bottom dot-style progress indicator (filled = complete, current = ring, future = outline)

### Agent Questions (5)
| # | ID | Text |
|---|---|---|
| 1 | AUT_A1 | I perform better when I can decide how to approach my work. |
| 2 | COM_A1 | I feel unsettled if I go long periods without specific feedback on my work. |
| 3 | REL_A1 | Extended periods of working independently reduce my motivation. |
| 4 | GRIT_A1 | I continue working toward goals even when progress is slow or unclear. |
| 5 | SR_A1 | I follow a consistent structure when completing my responsibilities. |

### Broker Questions (5)
| # | ID | Text |
|---|---|---|
| 1 | AUT_B1 | This brokerage allows individuals to decide how they approach their work. |
| 2 | COM_B1 | This brokerage provides specific actionable feedback that helps people understand how they are performing. |
| 3 | REL_B1 | This brokerage fosters meaningful connection among the people who work here. |
| 4 | GRIT_B1 | Agents here are expected to maintain consistent outreach even during extended slow periods. |
| 5 | SR_B1 | Clear weekly activity expectations are defined for agents here. |

### Likert Scale Labels
| Value | Label |
|---|---|
| 1 | Strongly Disagree |
| 2 | Disagree |
| 3 | Neither Agree nor Disagree |
| 4 | Agree |
| 5 | Strongly Agree |

---

## 7. Middleware Logic

```
/login, /register          → always public
/onboarding/survey         → auth required; if survey_completed redirect to dashboard
/dashboard/agent           → auth required + role=agent + survey_completed
/dashboard/broker          → auth required + role=broker + survey_completed
all other /dashboard/*     → auth required + survey_completed
```

---

## 8. API Routes

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/auth/register` | Create user, hash password, return session |
| POST | `/api/auth/[...nextauth]` | NextAuth handler (login, session, JWT) |
| POST | `/api/survey/answer` | Save a single answer (called on each NEXT press) |
| POST | `/api/survey/complete` | Mark survey_completed=true, refresh session |

---

## 9. Out of Scope (Phase 1)

- OAuth / social login
- Email verification
- Password reset
- Full dashboard UI (stubs only)
- Scoring engine
- Broker-managed agent invitations
