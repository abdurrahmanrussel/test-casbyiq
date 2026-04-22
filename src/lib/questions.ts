export type QuestionType = "likert" | "text" | "date" | "dropdown" | "radio"

export interface Question {
  id: string
  text: string
  type: "likert"
}

export interface IntakeQuestion {
  id: string
  text: string
  type: Exclude<QuestionType, "likert">
  required: boolean
  placeholder?: string
  options?: { value: string; label: string }[]
  conditional?: { dependsOn: string; showWhen: string[] }
}

export const LIKERT_OPTIONS = [
  { value: "1", label: "1 - Strongly Disagree" },
  { value: "2", label: "2 - Disagree" },
  { value: "3", label: "3 - Neither Agree nor Disagree" },
  { value: "4", label: "4 - Agree" },
  { value: "5", label: "5 - Strongly Agree" },
]

const YEARS_OPTIONS = [
  { value: "less_than_1", label: "Less than 1 year" },
  { value: "1_3", label: "1–3 years" },
  { value: "4_7", label: "4–7 years" },
  { value: "8_15", label: "8–15 years" },
  { value: "15_plus", label: "15+ years" },
]

export const US_STATES = [
  { value: "AL", label: "Alabama" }, { value: "AK", label: "Alaska" },
  { value: "AZ", label: "Arizona" }, { value: "AR", label: "Arkansas" },
  { value: "CA", label: "California" }, { value: "CO", label: "Colorado" },
  { value: "CT", label: "Connecticut" }, { value: "DE", label: "Delaware" },
  { value: "FL", label: "Florida" }, { value: "GA", label: "Georgia" },
  { value: "HI", label: "Hawaii" }, { value: "ID", label: "Idaho" },
  { value: "IL", label: "Illinois" }, { value: "IN", label: "Indiana" },
  { value: "IA", label: "Iowa" }, { value: "KS", label: "Kansas" },
  { value: "KY", label: "Kentucky" }, { value: "LA", label: "Louisiana" },
  { value: "ME", label: "Maine" }, { value: "MD", label: "Maryland" },
  { value: "MA", label: "Massachusetts" }, { value: "MI", label: "Michigan" },
  { value: "MN", label: "Minnesota" }, { value: "MS", label: "Mississippi" },
  { value: "MO", label: "Missouri" }, { value: "MT", label: "Montana" },
  { value: "NE", label: "Nebraska" }, { value: "NV", label: "Nevada" },
  { value: "NH", label: "New Hampshire" }, { value: "NJ", label: "New Jersey" },
  { value: "NM", label: "New Mexico" }, { value: "NY", label: "New York" },
  { value: "NC", label: "North Carolina" }, { value: "ND", label: "North Dakota" },
  { value: "OH", label: "Ohio" }, { value: "OK", label: "Oklahoma" },
  { value: "OR", label: "Oregon" }, { value: "PA", label: "Pennsylvania" },
  { value: "RI", label: "Rhode Island" }, { value: "SC", label: "South Carolina" },
  { value: "SD", label: "South Dakota" }, { value: "TN", label: "Tennessee" },
  { value: "TX", label: "Texas" }, { value: "UT", label: "Utah" },
  { value: "VT", label: "Vermont" }, { value: "VA", label: "Virginia" },
  { value: "WA", label: "Washington" }, { value: "WV", label: "West Virginia" },
  { value: "WI", label: "Wisconsin" }, { value: "WY", label: "Wyoming" },
]

// Agent license is collected on the consent screen, not as a separate intake step.
// Agent skips the intake phase entirely.
export const agentIntakeQuestions: IntakeQuestion[] = []

export const brokerIntakeQuestions: IntakeQuestion[] = [
  {
    id: "INTAKE_ORG_NAME",
    text: "Organization Name",
    type: "text",
    required: true,
    placeholder: "Enter your brokerage or team name",
  },
  {
    id: "INTAKE_EST_DATE",
    text: "Brokerage Established Date",
    type: "date",
    required: true,
  },
  {
    id: "INTAKE_MLS",
    text: "Market / MLS",
    type: "text",
    required: true,
    placeholder: "Enter the primary market or MLS your brokerage operates in",
  },
  {
    id: "INTAKE_ORG_TYPE",
    text: "Organization Type",
    type: "radio",
    required: true,
    options: [
      { value: "brokerage", label: "Brokerage (independent or franchise)" },
      { value: "team_within", label: "Team operating within a brokerage" },
      { value: "expansion_team", label: "Expansion team (multi-market)" },
      { value: "hybrid", label: "Hybrid (team + brokerage functions)" },
    ],
  },
  {
    id: "INTAKE_PARENT_BROKERAGE",
    text: "If a Team: Parent Brokerage Name",
    type: "text",
    required: false,
    placeholder: "Enter parent brokerage name",
    conditional: {
      dependsOn: "INTAKE_ORG_TYPE",
      showWhen: ["team_within", "expansion_team", "hybrid"],
    },
  },
  {
    id: "INTAKE_CITY",
    text: "Primary Market / City",
    type: "text",
    required: true,
    placeholder: "Enter your primary city or market",
  },
  {
    id: "INTAKE_STATE",
    text: "State",
    type: "dropdown",
    required: true,
    options: US_STATES,
  },
  {
    id: "INTAKE_AGENT_COUNT",
    text: "Approximate Number of Agents in This Organization",
    type: "radio",
    required: true,
    options: [
      { value: "1_5", label: "1–5" },
      { value: "6_15", label: "6–15" },
      { value: "16_30", label: "16–30" },
      { value: "31_50", label: "31–50" },
      { value: "50_plus", label: "50+" },
    ],
  },
  {
    id: "INTAKE_YEARS_RE",
    text: "Total years in real estate",
    type: "dropdown",
    required: true,
    options: YEARS_OPTIONS,
  },
  {
    id: "INTAKE_YEARS_ROLE",
    text: "Years in current role",
    type: "dropdown",
    required: true,
    options: YEARS_OPTIONS,
  },
  {
    id: "INTAKE_BROKER_ROLE",
    text: "Your role at the brokerage",
    type: "dropdown",
    required: true,
    options: [
      { value: "broker_owner", label: "Broker-Owner" },
      { value: "managing_broker", label: "Managing Broker (non-owner)" },
      { value: "team_leader", label: "Team Leader" },
      { value: "office_manager", label: "Office Manager" },
      { value: "other", label: "Other" },
    ],
  },
]

export const agentQuestions: Question[] = [
  { id: "AUT_A1", text: "I perform better when I can decide how to approach my work.", type: "likert" },
  { id: "COM_A1", text: "I feel unsettled if I go long periods without specific feedback on my work.", type: "likert" },
  { id: "REL_A1", text: "Extended periods of working independently reduce my motivation.", type: "likert" },
  { id: "GRIT_A1", text: "I continue working toward goals even when progress is slow or unclear.", type: "likert" },
  { id: "SR_A1", text: "I follow a consistent structure when completing my responsibilities.", type: "likert" },
]

export const brokerQuestions: Question[] = [
  { id: "AUT_B1", text: "This brokerage allows individuals to decide how they approach their work.", type: "likert" },
  { id: "COM_B1", text: "This brokerage provides specific actionable feedback that helps people understand how they are performing.", type: "likert" },
  { id: "REL_B1", text: "This brokerage fosters meaningful connection among the people who work here.", type: "likert" },
  { id: "GRIT_B1", text: "Agents here are expected to maintain consistent outreach even during extended slow periods.", type: "likert" },
  { id: "SR_B1", text: "Clear weekly activity expectations are defined for agents here.", type: "likert" },
]
