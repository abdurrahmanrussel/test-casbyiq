# KasbyIQ Project Memory
> This file is the persistent context for Claude Code. Read this before doing anything in this project.

---

## What KasbyIQ Is

KasbyIQ is a B2B predictive analytics SaaS platform that measures **psychographic fit** between real estate agents and brokerage environments. Brokers pay a monthly subscription. The platform ingests survey data from both agents and brokers, scores fit across 6 dimensions, and delivers actionable coaching output through two separate dashboards — one for brokers, one for agents.

The underlying longitudinal dataset of agent psychographic profiles is the core commercial asset. Everything is built to protect and grow that dataset.

---

## Tech Stack Decisions

- **Database:** PostgreSQL (not Airtable — superseded)
- **Survey tool:** Native build (not Jotform — decided against due to data ownership issues, no save-resume, no progress bar, webhook reliability problems)
- **Billing:** Stripe (pending Leslie confirmation)
- **Dashboard:** Mobile-responsive web. No native app in Phase 1.
- **Scoring:** Regression model. Simple item averaging per dimension. Semantic versioning on all scored records.

---

## The 6 Dimensions

Fit is measured across two frameworks:

### Will Fit — Needs-Supplies (what agent needs vs what brokerage provides)
| Dimension | Agent side measures | Brokerage side measures |
|---|---|---|
| Autonomy | How much independence agent needs | How much independence brokerage provides |
| Competence | How much growth/feedback agent needs | How much growth/feedback brokerage provides |
| Relatedness | How much connection agent needs | How much connection brokerage provides |

### Skill Fit — Demands-Abilities (what environment demands vs what agent can supply)
| Dimension | Agent side measures | Brokerage side measures |
|---|---|---|
| Grit | How persistent agent actually is | How much persistence brokerage demands |
| Self-Regulation | How disciplined agent actually is | How much self-discipline brokerage demands |
| Emotional Intelligence | How emotionally skilled agent actually is | How emotionally demanding the environment is |

**Scoring:** Each dimension = average of 6 Likert items (1–5 scale). Agent average vs Brokerage average = gap. Gap feeds regression model = composite fit score. Both sides required for a valid fit score. No partial scoring.

---

## Database — 10 PostgreSQL Tables

### 1. Agent
One record per real-world agent. Persists across all brokerage changes forever.
```
agent_id          UUID        PK - never changes
first_name        String
last_name         String
email             String      UNIQUE - deduplication key
phone             String      optional
agent_type        Enum        new_agent | experienced
invitation_sent_date    Timestamp   agent record created at this moment
survey_completed_date   Timestamp   6-month re-scoring rule runs from this
invitation_status Enum        invited | clicked | in_progress | completed | unresponsive
reminder_count    Integer     max 3 before broker notified
broker_notified_flag    Boolean
current_brokerage_id    UUID        FK → Brokerage_Entity (null if between brokerages)
profile_status    Enum        active | dormant | unresponsive
fit_score_status  Enum        current | pending_refresh
brokerage_tenure  Date        broker-provided at submission
prior_brokerage_count   Integer     broker-provided at submission
referring_broker_id     UUID        FK → Brokerage_Entity
referral_outcome  Enum        pending | signed | declined | null
created_at        Timestamp   system
updated_at        Timestamp   system
```

### 2. Agent_License
Sub-table for multi-state license records. Linked to Agent by agent_id.
```
license_id              UUID    PK
agent_id                UUID    FK → Agent
license_number          String  identity anchor for longitudinal tracking
license_state           String  e.g. UT, AZ, NV
license_status          Enum    active | expired | suspended
license_verification_status  Enum  verified | self_reported | unverified
issue_date              Date
expiration_date         Date
is_primary              Boolean true for primary license used as KasbyIQ identity anchor
created_at              Timestamp
```

### 3. Brokerage_Entity
One record per brokerage. Never deleted. Accumulates versioned profiles over time.
```
brokerage_id            UUID    PK - never changes
brokerage_name          String
brand_affiliation       String  optional - e.g. Keller Williams, RE/MAX
primary_contact_name    String
primary_contact_email   String
primary_contact_phone   String
state                   String
city                    String
schema_status           Enum    orphan_active | orphan_stale | matched_active | matched_stale
active_agent_count      Integer system-calculated
contract_start_date     Date
contract_status         Enum    active | paused | churned
onboarding_complete     Boolean gates agent matching
last_checkin_email_date Timestamp
checkin_email_count     Integer resets after re-survey or confirmed no-change
personal_outreach_flag  Boolean true after 2 unanswered check-in emails
next_checkin_due_date   Date    12 months after current profile version completion
created_at              Timestamp
updated_at              Timestamp
```

### 4. Brokerage_Profile_Version
Versioned psychographic snapshots. Previous versions archived, never deleted.
Historical scores always link to the version active at match time.
```
profile_version_id      UUID    PK
brokerage_id            UUID    FK → Brokerage_Entity
version_number          Integer sequential 1, 2, 3...
is_current_version      Boolean only one true per brokerage at any time
completed_by_name       String
completed_by_role       String
survey_completed_date   Timestamp 12-month validity window from this date
trigger_type            Enum    initial | annual_checkin | enrollment_trigger | broker_initiated
dimensions_updated      Array   DEPRECATED in v0.5 - NULL for all new records
change_notes            Text    optional context - does not feed scoring
autonomy_score          Decimal avg of 6 brokerage Autonomy items
competence_score        Decimal
relatedness_score       Decimal
grit_score              Decimal
self_regulation_score   Decimal
ei_score                Decimal
raw_responses           JSON    complete raw survey responses - never overwritten
created_at              Timestamp
```

### 5. Survey_Response
One record per survey EVENT. Core table. Links every score to exact profile version.
```
survey_response_id      UUID    PK
agent_id                UUID    FK → Agent
brokerage_id            UUID    FK → Brokerage_Entity
profile_version_id      UUID    FK → Brokerage_Profile_Version (locks historical accuracy)
event_type              Enum    agent_intake | agent_exp_intake | agent_90_day | agent_180_day | broker_90_day | broker_180_day
survey_sent_date        Timestamp
survey_due_date         Date    drives reminder logic
survey_completed_date   Timestamp null until complete
agent_completion_status Enum    pending | in_progress | complete | overdue
broker_completion_status Enum   pending | in_progress | complete | overdue | not_applicable
reminder_count          Integer
broker_notified_flag    Boolean true after 2 reminders
autonomy_score          Decimal avg of 6 agent Autonomy items
competence_score        Decimal
relatedness_score       Decimal
grit_score              Decimal
self_regulation_score   Decimal
ei_score                Decimal
composite_fit_score     Decimal null until BOTH agent AND broker complete
scoring_model_version   String  semantic versioning e.g. v1.0
score_status            Enum    pending | partial | complete | flagged | fit_score_pending_brokerage
raw_responses           JSON    all item responses preserved forever
created_at              Timestamp
updated_at              Timestamp
```

### 6. Qualitative_Response
Open-ended answers stored separately. Each answer = one record.
Available for future text analysis, sentiment scoring, LLM narrative generation.
```
qualitative_response_id UUID    PK
survey_response_id      UUID    FK → Survey_Response
agent_id                UUID    FK → Agent
question_id             String  e.g. AG90_E1, BK90_H3
respondent_type         Enum    agent | broker
response_text           Text    full response as submitted - never modified
date_recorded           Timestamp
```

### 7. Subscription
One active record per brokerage. Source of truth for all billing logic. Prices never hardcoded.
```
subscription_id         UUID    PK
brokerage_id            UUID    FK → Brokerage_Entity
tier                    Enum    small | mid | large
seat_ceiling            Integer 2 | 5 | 8 - configurable
base_price              Decimal monthly fee - set at contract - never hardcoded
overage_rate            Decimal per-agent fee above ceiling - currently $50
billing_cycle_start     Date    source for ALL date calculations
cohort_designation      Enum    founding | standard
grace_period_end_date   Date    founding only: billing_cycle_start + 90 days. NULL for standard
price_lock_end_date     Date    founding only: billing_cycle_start + 12 months. NULL for standard
status                  Enum    active | paused | cancelled
created_at              Timestamp
updated_at              Timestamp
```

### 8. Billing_Event
Audit log of every charge and credit. Does not process payments - only records.
```
billing_event_id        UUID    PK
brokerage_id            UUID    FK → Brokerage_Entity
agent_id                UUID    FK → Agent (null for base fee events)
event_type              Enum    base_fee | overage_charge | overage_waived | credit | refund
amount                  Decimal positive=charge, negative=credit, zero=overage_waived
billing_cycle           Date    cycle start date this event applies to
cohort_designation      Enum    copied from Subscription at time of event
grace_period_active     Boolean true if founding cohort grace period was active
created_at              Timestamp
```

### 9. Brokerage_Invite_Token
Quarterly shareable links for experienced agent self-registration.
```
invite_token_id         UUID    PK
brokerage_id            UUID    FK → Brokerage_Entity (auto-captured on self-registration)
token                   String  UNIQUE - used in shareable URL and QR code
issued_date             Date    next quarterly prompt fires 90 days from this
expiry_date             Date    issued_date + 30 days
agent_type              Enum    experienced
registrations_count     Integer informational only
created_at              Timestamp
```

### 10. Error_Table
Every rejected survey record with full payload. Internal alert fires on every entry.
```
error_id                UUID    PK
error_timestamp         Timestamp
source_form             String  e.g. agent_intake, broker_90_day
agent_id                UUID    null if not recoverable
brokerage_id            UUID    null if not recoverable
error_type              String  missing_required_field | likert_out_of_range | invalid_uuid | malformed_payload
raw_payload             JSON    complete raw record as received - never modified
```

---

## The 72 Scored Survey Items (Intake)

### Autonomy (AUT) — Needs-Supplies
```
AUT_A1  Agent      I perform better when I can decide how to approach my work.
AUT_B1  Brokerage  This brokerage allows individuals to decide how they approach their work.
AUT_A2  Agent      I become less engaged when others closely define how my work should be done.
AUT_B2  Brokerage  At this brokerage work is not closely defined in a way that limits individual discretion.
AUT_A3  Agent      I prefer having discretion in how I organize my responsibilities.
AUT_B3  Brokerage  Individuals here are given discretion in how they organize their responsibilities.
AUT_A4  Agent      I am more motivated when I can adapt processes to fit my style.
AUT_B4  Brokerage  This brokerage allows people to adapt processes to fit their work style.
AUT_A5  Agent      I am most energized when I have latitude in how I pursue goals.
AUT_B5  Brokerage  People here have latitude in how they pursue goals.
AUT_A6  Agent      I work best when I feel trusted to make decisions independently.
AUT_B6  Brokerage  This brokerage demonstrates trust in individuals to make decisions independently.
```

### Competence (COM) — Needs-Supplies
```
COM_A1  Agent      I feel unsettled if I go long periods without specific feedback on my work.
COM_B1  Brokerage  This brokerage provides specific actionable feedback that helps people understand how they are performing.
COM_A2  Agent      I lose motivation when I am not steadily improving my skills.
COM_B2  Brokerage  People here have regular opportunities to improve and develop their skills.
COM_A3  Agent      I prefer roles that give me opportunities to be challenged beyond my current skill level.
COM_B3  Brokerage  This brokerage offers roles that challenge individuals beyond their current skill level.
COM_A4  Agent      Without clear benchmarks for success I am unsure how well I am doing.
COM_B4  Brokerage  Clear benchmarks for success are communicated to people who work here.
COM_A5  Agent      I am more engaged when I receive direct input on how to improve my work.
COM_B5  Brokerage  Individuals receive direct actionable input on how to improve their performance.
COM_A6  Agent      Routine work without opportunities to grow becomes draining for me.
COM_B6  Brokerage  This brokerage provides growth opportunities rather than leaving roles static over time.
```

### Relatedness (REL) — Needs-Supplies
```
REL_A1  Agent      Extended periods of working independently reduce my motivation.
REL_B1  Brokerage  This brokerage fosters meaningful connection among the people who work here.
REL_A2  Agent      I am more productive when I feel connected to the people around me.
REL_B2  Brokerage  People at this brokerage report feeling supported by those around them.
REL_A3  Agent      I prefer environments where collaboration is common.
REL_B3  Brokerage  Collaboration is common here.
REL_A4  Agent      When I do not feel understood by colleagues my engagement drops.
REL_B4  Brokerage  Individuals here are generally treated with respect and understanding.
REL_A5  Agent      I seek regular interaction with others rather than working mostly on my own.
REL_B5  Brokerage  Regular interaction among colleagues is encouraged here.
REL_A6  Agent      Feeling socially disconnected makes it harder for me to stay energized.
REL_B6  Brokerage  The social climate at this brokerage helps sustain people's energy and engagement.
```

### Grit (GRIT) — Demands-Abilities
```
GRIT_A1 Agent      I continue working toward goals even when progress is slow or unclear.
GRIT_B1 Brokerage  Agents here are expected to maintain consistent outreach even during extended slow periods.
GRIT_A2 Agent      When I experience repeated setbacks I stay engaged rather than pulling back.
GRIT_B2 Brokerage  High levels of rejection are a normal and expected part of succeeding here.
GRIT_A3 Agent      I am comfortable putting in consistent effort for extended periods before seeing results.
GRIT_B3 Brokerage  Results here may take weeks or months to materialize despite steady effort.
GRIT_A4 Agent      After a significant disappointment I return to my work quickly.
GRIT_B4 Brokerage  Agents are typically responsible for generating most of their own opportunities here.
GRIT_A5 Agent      I maintain my effort even when external rewards are delayed.
GRIT_B5 Brokerage  Monthly income here can fluctuate significantly based on individual effort.
GRIT_A6 Agent      When outcomes stall I adjust my approach rather than disengage.
GRIT_B6 Brokerage  Success here often requires continuing activity even when short-term results are discouraging.
```

### Self-Regulation (SR) — Demands-Abilities
```
SR_A1   Agent      I follow a consistent structure when completing my responsibilities.
SR_B1   Brokerage  Clear weekly activity expectations are defined for agents here.
SR_A2   Agent      I begin important tasks at planned times rather than waiting until I feel motivated.
SR_B2   Brokerage  Prospecting and follow-up routines are expected to be consistent here rather than flexible.
SR_A3   Agent      I protect scheduled work time from distractions.
SR_B3   Brokerage  Agent performance here is regularly reviewed against defined activity benchmarks.
SR_A4   Agent      I complete necessary tasks even when they are repetitive or tedious.
SR_B4   Brokerage  Agents here are expected to adhere closely to established processes.
SR_A5   Agent      I maintain systems or routines even when no one is monitoring me.
SR_B5   Brokerage  Accountability conversations here occur at predictable intervals.
SR_A6   Agent      My weekly productivity reflects planned execution rather than last-minute effort.
SR_B6   Brokerage  Deviation from defined systems here is addressed promptly.
```

### Emotional Intelligence (EI) — Demands-Abilities
```
EI_A1   Agent      I notice subtle emotional changes in others during conversations.
EI_B1   Brokerage  People at this brokerage often encounter emotionally intense conversations as part of the role.
EI_A2   Agent      I remain calm during tense or emotionally charged interactions.
EI_B2   Brokerage  High-stakes emotionally charged interactions are common in this environment.
EI_A3   Agent      I am aware of my emotional reactions while I am experiencing them.
EI_B3   Brokerage  Difficult interpersonal situations are regularly part of the work here.
EI_A4   Agent      I can receive criticism without becoming defensive.
EI_B4   Brokerage  Agents here must frequently manage strong emotional reactions from others.
EI_A5   Agent      After a stressful interaction I regain emotional balance quickly.
EI_B5   Brokerage  Feedback conversations here can be direct and emotionally charged.
EI_A6   Agent      I adjust how I communicate depending on the emotional state of the other person.
EI_B6   Brokerage  Competitive pressures here sometimes heighten interpersonal tension.
```

---

## Check-In Surveys (90-Day and 180-Day)

### Agent 90-Day
```
AG90_A1  Routines         My daily routines are more consistent compared to when I started. (1-5)
AG90_A2  Routines         I have adopted at least one repeatable system I did not have at the beginning. (1-5)
AG90_B1  Coachability     When I receive coaching I usually apply it within a short time frame. (1-5)
AG90_B2  Coachability     I can receive corrective feedback without becoming defensive. (1-5)
AG90_C1  Accountability   I follow through on commitments without needing reminders. (1-5)
AG90_D1  Stress/Recovery  I recover from setbacks faster now than in my first few weeks. (1-5)
AG90_E1  Qualitative      What feels harder than you expected so far? (open text)
AG90_E2  Qualitative      What has helped you improve the most so far? (open text)
AG90_E3  Qualitative      Has a specific person been particularly important to your progress? (open text)
AG90_F1  Connection       I feel genuinely supported by the people in my brokerage. (1-5)
AG90_F2  Connection       When struggling I feel comfortable asking for help. (1-5)
PIE_A1   PIE              Production time % (must total 100 with PIE_A2 and PIE_A3)
PIE_A2   PIE              Income Support time %
PIE_A3   PIE              Expansion/Improvement time %
PIE_A4   PIE              This allocation reflects how I want my business to operate. (1-5)
```

### Agent 180-Day
```
AG180_A1  Sustained       The routines and systems I adopted earlier are still in place. (1-5)
AG180_A2  Sustained       My workdays feel more structured than at the beginning. (1-5)
AG180_B1  Coachability    Coaching feedback now requires fewer reminders than earlier on. (1-5)
AG180_C1  Autonomy        I now understand what level of structure I need to perform at my best. (1-5)
AG180_D1  Sustainability  My current stress level feels manageable long-term. (1-5)
AG180_E1  Ownership       I feel primarily responsible for my results regardless of available support. (1-5)
AG180_F1  Connection      People in my brokerage genuinely care about my success as a person. (1-5)
AG180_F2  Connection      I know exactly who I could turn to if struggling seriously right now. (1-5)
AG180_G1  Alignment       Based on how I define success my current trajectory feels aligned. (1-5)
AG180_H1  Retention       I see myself still actively practicing real estate 12 months from now. (1-5)
AG180_I1  Qualitative     What would most improve your results over the next six months? (open text)
AG180_I2  Qualitative     What if anything makes you question your long-term fit right now? (open text)
```

### Broker 90-Day (key fields)
```
BK90_META  Hidden         Agent_ID, Brokerage_ID, Evaluator_Role, Date (auto-populated via URL)
BK90_B1    Engagement     How consistently has this agent shown up prepared and on time? (1-5)
BK90_B2    Engagement     How reliably does this agent follow through on commitments? (1-5)
BK90_B3    Engagement     Weekly activity rhythm? (multiple choice)
BK90_C1-C11 Coachability  11 questions on receptivity, application, planning, self-management
BK90_D1-D3  Business Dev  Lead source, CRM usage, pipeline vs expectations
BK90_E1-E5  Support        Relationships formed, support delivered, friction points, brokerage response
BK90_F1-F2  Outcomes       Transactions to date, client trust rating
BK90_G1-G2  Predictive     Trajectory assessment, intervention recommendation
BK90_H1-H3  Observations   Primary limiting factor, severity, open observations
```

### Broker 180-Day
Same as Broker 90-Day PLUS:
```
BK180_G3  Trajectory      Engagement change compared to 90 days ago
BK180_G4  Trajectory      Overall trajectory compared to 90-day mark
BK180_G5  Retention       How likely is this agent to still be practicing 12 months from now? (1-5)
BK180_G6  Recruitment     Would you recruit this agent again knowing what you know now?
BK180_G7  Reason          Primary reason for answer above
BK180_G8  Context         Additional context (optional open text)
```

---

## Scoring Logic

### Step 1 — Dimension scores
```
Agent Autonomy Score = avg(AUT_A1, AUT_A2, AUT_A3, AUT_A4, AUT_A5, AUT_A6)
Brokerage Autonomy Score = avg(AUT_B1, AUT_B2, AUT_B3, AUT_B4, AUT_B5, AUT_B6)
Same calculation for all 6 dimensions.
No reverse-scored items. Same formula for both sides.
```

### Step 2 — Gap per dimension
```
Autonomy Gap = Agent Score - Brokerage Score
(repeat for all 6 dimensions)
```

### Step 3 — Composite fit score
```
Regression model takes all 6 gaps as independent predictors.
Output format: TBD by Sam Hardy (0-100 index OR retention probability)
Placeholder model version: v0.9-placeholder
Both agent AND broker sides required. No partial scoring.
scoring_model_version field tags every score for longitudinal integrity.
```

### Step 4 — Translation layer
```
Each dimension score maps to plain-language insight via threshold bands:
Low: 1.0 - 2.5
Mid: 2.5 - 3.5
High: 3.5 - 5.0
18 starter phrases total (1 per dimension per band) - Leslie provides content.
```

---

## Agent Lifecycle

```
Day 0    Broker submits roster → Agent record created → Invitation email sent
Day 3    Reminder 1 if not clicked
Day 6    Reminder 2
Day 9    Reminder 3 → broker_notified_flag = true
Day 0+   Agent completes intake (36 questions) → Profile reveal shown immediately
Day 90   Agent 90-day fires → on completion → Broker 90-day unlocks
Day 90+  Both complete → First composite fit score generated
Day 180  Agent 180-day fires → on completion → Broker 180-day unlocks
Day 180+ Both complete → Updated fit score → Coaching interventions updated
```

---

## Billing Logic

### Tiers
```
Small:  1-2 agents/month  seat ceiling 2  overage $50/agent
Mid:    3-5 agents/month  seat ceiling 5  overage $50/agent
Large:  6+ agents/month   seat ceiling 8  overage $50/agent
Base prices: TBD by Leslie. Stored as configurable Decimal. Never hardcoded.
```

### Overage logic
```
Agent submitted above ceiling → added immediately → overage_active status
Real-time notification fires with: agent name, seat usage, $50 cost, billing date
Charge queued to next billing cycle
```

### Founding cohort rules
```
IF cohort_designation = founding AND current_date < grace_period_end_date:
  → Send overage notification
  → Log overage_waived event (amount = 0)
  → Do NOT queue charge
AFTER grace_period_end_date:
  → Standard overage billing applies immediately

grace_period_end_date = billing_cycle_start + 90 days (per broker individually)
price_lock_end_date = billing_cycle_start + 12 months (per broker individually)
```

---

## Dashboard Permissions — 4 Rules (No Exceptions)

```
Rule 1 - Agent sees:
  ✓ Own dimension scores and progress
  ✓ Plain-language insights (not raw scores)
  ✓ Growth-oriented coaching interventions
  ✗ Composite fit score
  ✗ Retention risk tier
  ✗ Any broker evaluation content

Rule 2 - Broker sees:
  ✓ Agent dimension scores
  ✓ Composite fit score
  ✓ Management-oriented coaching interventions
  ✗ Raw agent survey responses (EVER)

Rule 3 - Both sides see:
  ✓ Check-in completion status for the other party
  ✗ Any content from the other party's survey

Rule 4 - Coaching interventions:
  Same underlying gap → two different messages
  Broker message = management action
  Agent message = growth opportunity
  Neither reveals what the other party's data looks like
```

---

## 9-Week Build Sequence

```
W1        Stage 1: Database schema — all 10 tables, foreign keys, enums locked
W2-W3     Stage 2: Survey intake pipeline + ETL + invitation flow + validation layer
          Stage 6: Billing layer starts in parallel (runs W2-W8)
W4-W5     Stage 3: Scoring engine + translation layer + retroactive scoring trigger
W6-W7     Stage 4: Broker dashboard — roster view, agent view, coaching interventions
W7-W8     Stage 5: Agent dashboard — progress view, insights, gamification
W9        Integration testing + pilot broker + go-live
```

### Hard blockers (build cannot proceed without these)
```
By W2:  Sam Hardy — finalized versions of all 6 survey forms
By W2:  Brett — Jotform vs native survey decision + ETL architecture
By W2:  Leslie — subscription base fees per tier + Stripe confirmed
By W4:  Sam Hardy — composite score formula, output range, anomaly criteria
By W6:  Leslie + Sam — coaching intervention lookup table (all 6 dimensions)
By W6:  Leslie + Sam — badge trigger thresholds + plain-language hover tooltips
```

---

## Key Business Rules

- KasbyIQ owns ALL data. Brokers and agents receive access not ownership.
- Agent record is created when invitation is SENT not when survey is completed.
- Email is the deduplication key for agents. Two brokers enrolling same email = one agent record.
- profile_version_id on Survey_Response is what locks historical fit score accuracy.
- scoring_model_version on Survey_Response traces every score to the methodology that produced it.
- billing_cycle_start on Subscription is source for all founding cohort date calculations.
- No survey record is ever deleted. Partial records contribute to historical dataset.
- Both agent AND broker sides required for composite fit score. No exceptions.
- Experienced agents: one-time intake only. No 90/180 day schedule in Phase 1.
- Retroactive scoring: when new brokerage profile created, system auto-scores all fit_score_pending_brokerage records for that brokerage.

---

## Open Items Blocking the Build

### From Sam Hardy
- Composite score formula and output range (0-100? retention probability?)
- Anomaly detection criteria (what patterns get flagged?)
- Remaining Section 4 items from Methodology Review Document

### From Leslie
- Subscription base fees per tier
- Experienced agent transaction threshold (new vs experienced cutoff)
- Agent landing page (direct to survey or profile setup first?)
- License number — required or optional at intake?

### From Leslie + Sam together
- Coaching intervention lookup table — broker-facing and agent-facing for every dimension at every severity level
- Badge trigger thresholds
- Plain-language hover tooltips for each dimension

---

*Last updated: April 2026 | Extracted from KasbyIQ project conversation context*
