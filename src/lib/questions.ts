export interface Question {
  id: string
  text: string
}

export const agentQuestions: Question[] = [
  { id: "AUT_A1", text: "I perform better when I can decide how to approach my work." },
  { id: "COM_A1", text: "I feel unsettled if I go long periods without specific feedback on my work." },
  { id: "REL_A1", text: "Extended periods of working independently reduce my motivation." },
  { id: "GRIT_A1", text: "I continue working toward goals even when progress is slow or unclear." },
  { id: "SR_A1", text: "I follow a consistent structure when completing my responsibilities." },
]

export const brokerQuestions: Question[] = [
  { id: "AUT_B1", text: "This brokerage allows individuals to decide how they approach their work." },
  { id: "COM_B1", text: "This brokerage provides specific actionable feedback that helps people understand how they are performing." },
  { id: "REL_B1", text: "This brokerage fosters meaningful connection among the people who work here." },
  { id: "GRIT_B1", text: "Agents here are expected to maintain consistent outreach even during extended slow periods." },
  { id: "SR_B1", text: "Clear weekly activity expectations are defined for agents here." },
]

export const LIKERT_OPTIONS = [
  { value: 1, label: "1 - Strongly Disagree" },
  { value: 2, label: "2 - Disagree" },
  { value: 3, label: "3 - Neither Agree nor Disagree" },
  { value: 4, label: "4 - Agree" },
  { value: 5, label: "5 - Strongly Agree" },
]
