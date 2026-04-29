import { PrismaClient } from "@prisma/client"
import { PrismaNeonHttp } from "@prisma/adapter-neon"
import { neonConfig } from "@neondatabase/serverless"
import { Agent, fetch as undiciF } from "undici"
import * as dotenv from "dotenv"
dotenv.config({ path: ".env.local" })
dotenv.config()

// Force IPv4 — Node 25 prefers IPv6 but Neon is only reachable via IPv4 here
const agent = new Agent({ connect: { family: 4 } } as never)
neonConfig.fetchFunction = (url: string, init?: RequestInit) =>
  undiciF(url, { ...(init as Parameters<typeof undiciF>[1]), dispatcher: agent })

const prisma = new PrismaClient({
  adapter: new PrismaNeonHttp(process.env.DATABASE_URL!, {}),
})

type Q = {
  id: string
  text: string
  role: "agent" | "broker"
  surveyType: string
  section: string
  questionType: string
  dimension?: string
  isScored: boolean
  options?: string[] | null
  required: boolean
  sortOrder: number
  storageTarget: string
  notes?: string
}

// ─────────────────────────────────────────────────────────────────────────────
// AGENT INTAKE — 71 questions
// ─────────────────────────────────────────────────────────────────────────────
const agentIntake: Q[] = [
  // Section 1A — Scored Dimension Items (36)
  { id: "AUT_A1", text: "I perform better when I can decide how to approach my work.", role: "agent", surveyType: "agent_intake", section: "1A", questionType: "likert", dimension: "AUT", isScored: true, required: true, sortOrder: 1, storageTarget: "scored_field" },
  { id: "AUT_A2", text: "I become less engaged when my work is closely monitored or when others define exactly how I should do it.", role: "agent", surveyType: "agent_intake", section: "1A", questionType: "likert", dimension: "AUT", isScored: true, required: true, sortOrder: 2, storageTarget: "scored_field" },
  { id: "AUT_A3", text: "I like being able to choose how I organize my work.", role: "agent", surveyType: "agent_intake", section: "1A", questionType: "likert", dimension: "AUT", isScored: true, required: true, sortOrder: 3, storageTarget: "scored_field" },
  { id: "AUT_A4", text: "I am more motivated when I can adapt processes to fit my style.", role: "agent", surveyType: "agent_intake", section: "1A", questionType: "likert", dimension: "AUT", isScored: true, required: true, sortOrder: 4, storageTarget: "scored_field" },
  { id: "AUT_A5", text: "I feel most motivated when I can go after my goals my own way, instead of being told exactly how to do it.", role: "agent", surveyType: "agent_intake", section: "1A", questionType: "likert", dimension: "AUT", isScored: true, required: true, sortOrder: 5, storageTarget: "scored_field" },
  { id: "AUT_A6", text: "I work best when I feel trusted to make decisions independently.", role: "agent", surveyType: "agent_intake", section: "1A", questionType: "likert", dimension: "AUT", isScored: true, required: true, sortOrder: 6, storageTarget: "scored_field" },
  { id: "COM_A1", text: "I feel unsettled if I go long periods without specific feedback on my work.", role: "agent", surveyType: "agent_intake", section: "1A", questionType: "likert", dimension: "COM", isScored: true, required: true, sortOrder: 7, storageTarget: "scored_field" },
  { id: "COM_A2", text: "I lose motivation when I am not steadily improving my skills.", role: "agent", surveyType: "agent_intake", section: "1A", questionType: "likert", dimension: "COM", isScored: true, required: true, sortOrder: 8, storageTarget: "scored_field" },
  { id: "COM_A3", text: "I prefer roles where I am regularly stretched beyond what I already know how to do.", role: "agent", surveyType: "agent_intake", section: "1A", questionType: "likert", dimension: "COM", isScored: true, required: true, sortOrder: 9, storageTarget: "scored_field" },
  { id: "COM_A4", text: "Without clear measures of success, I find it difficult to gauge whether I am performing well.", role: "agent", surveyType: "agent_intake", section: "1A", questionType: "likert", dimension: "COM", isScored: true, required: true, sortOrder: 10, storageTarget: "scored_field" },
  { id: "COM_A5", text: "I am more engaged when I receive direct input on how to improve my work.", role: "agent", surveyType: "agent_intake", section: "1A", questionType: "likert", dimension: "COM", isScored: true, required: true, sortOrder: 11, storageTarget: "scored_field" },
  { id: "COM_A6", text: "Routine work without opportunities to grow becomes draining for me.", role: "agent", surveyType: "agent_intake", section: "1A", questionType: "likert", dimension: "COM", isScored: true, required: true, sortOrder: 12, storageTarget: "scored_field" },
  { id: "REL_A1", text: "Extended periods of working independently reduce my motivation.", role: "agent", surveyType: "agent_intake", section: "1A", questionType: "likert", dimension: "REL", isScored: true, required: true, sortOrder: 13, storageTarget: "scored_field" },
  { id: "REL_A2", text: "I am more productive when I feel connected to the people around me.", role: "agent", surveyType: "agent_intake", section: "1A", questionType: "likert", dimension: "REL", isScored: true, required: true, sortOrder: 14, storageTarget: "scored_field" },
  { id: "REL_A3", text: "I prefer working environments where people regularly collaborate and support each other, not just work in parallel.", role: "agent", surveyType: "agent_intake", section: "1A", questionType: "likert", dimension: "REL", isScored: true, required: true, sortOrder: 15, storageTarget: "scored_field" },
  { id: "REL_A4", text: "When I do not feel understood by colleagues my engagement drops.", role: "agent", surveyType: "agent_intake", section: "1A", questionType: "likert", dimension: "REL", isScored: true, required: true, sortOrder: 16, storageTarget: "scored_field" },
  { id: "REL_A5", text: "I seek regular interaction with others rather than working mostly on my own.", role: "agent", surveyType: "agent_intake", section: "1A", questionType: "likert", dimension: "REL", isScored: true, required: true, sortOrder: 17, storageTarget: "scored_field" },
  { id: "REL_A6", text: "Feeling socially disconnected makes it harder for me to stay energized.", role: "agent", surveyType: "agent_intake", section: "1A", questionType: "likert", dimension: "REL", isScored: true, required: true, sortOrder: 18, storageTarget: "scored_field" },
  { id: "GRIT_A1", text: "I continue working toward goals even when progress is slow or unclear.", role: "agent", surveyType: "agent_intake", section: "1A", questionType: "likert", dimension: "GRIT", isScored: true, required: true, sortOrder: 19, storageTarget: "scored_field" },
  { id: "GRIT_A2", text: "When I experience repeated setbacks I stay engaged rather than pulling back.", role: "agent", surveyType: "agent_intake", section: "1A", questionType: "likert", dimension: "GRIT", isScored: true, required: true, sortOrder: 20, storageTarget: "scored_field" },
  { id: "GRIT_A3", text: "I am comfortable investing consistent effort over weeks or months before seeing meaningful results.", role: "agent", surveyType: "agent_intake", section: "1A", questionType: "likert", dimension: "GRIT", isScored: true, required: true, sortOrder: 21, storageTarget: "scored_field" },
  { id: "GRIT_A4", text: "After a deal falls through or a significant professional disappointment, I get back to work quickly rather than dwelling on it.", role: "agent", surveyType: "agent_intake", section: "1A", questionType: "likert", dimension: "GRIT", isScored: true, required: true, sortOrder: 22, storageTarget: "scored_field" },
  { id: "GRIT_A5", text: "I maintain my effort even when external rewards are delayed.", role: "agent", surveyType: "agent_intake", section: "1A", questionType: "likert", dimension: "GRIT", isScored: true, required: true, sortOrder: 23, storageTarget: "scored_field" },
  { id: "GRIT_A6", text: "When my results stall, I look for what I can do differently rather than pulling back on my effort.", role: "agent", surveyType: "agent_intake", section: "1A", questionType: "likert", dimension: "GRIT", isScored: true, required: true, sortOrder: 24, storageTarget: "scored_field" },
  { id: "SR_A1", text: "I follow a consistent daily or weekly structure to manage my responsibilities, regardless of how I feel that day.", role: "agent", surveyType: "agent_intake", section: "1A", questionType: "likert", dimension: "SR", isScored: true, required: true, sortOrder: 25, storageTarget: "scored_field" },
  { id: "SR_A2", text: "I begin important tasks at planned times rather than waiting until I feel motivated.", role: "agent", surveyType: "agent_intake", section: "1A", questionType: "likert", dimension: "SR", isScored: true, required: true, sortOrder: 26, storageTarget: "scored_field" },
  { id: "SR_A3", text: "I protect time blocks I've set aside for important work — I don't let interruptions or lower-priority tasks take over.", role: "agent", surveyType: "agent_intake", section: "1A", questionType: "likert", dimension: "SR", isScored: true, required: true, sortOrder: 27, storageTarget: "scored_field" },
  { id: "SR_A4", text: "I complete necessary tasks even when they are repetitive or tedious.", role: "agent", surveyType: "agent_intake", section: "1A", questionType: "likert", dimension: "SR", isScored: true, required: true, sortOrder: 28, storageTarget: "scored_field" },
  { id: "SR_A5", text: "I maintain my systems and routines consistently, whether or not anyone is monitoring my activity.", role: "agent", surveyType: "agent_intake", section: "1A", questionType: "likert", dimension: "SR", isScored: true, required: true, sortOrder: 29, storageTarget: "scored_field" },
  { id: "SR_A6", text: "My weekly productivity reflects planned execution rather than last-minute effort.", role: "agent", surveyType: "agent_intake", section: "1A", questionType: "likert", dimension: "SR", isScored: true, required: true, sortOrder: 30, storageTarget: "scored_field" },
  { id: "EI_A1", text: "I notice subtle emotional changes in others during conversations.", role: "agent", surveyType: "agent_intake", section: "1A", questionType: "likert", dimension: "EI", isScored: true, required: true, sortOrder: 31, storageTarget: "scored_field" },
  { id: "EI_A2", text: "During tense or emotionally charged conversations, I stay calm and focused rather than getting reactive.", role: "agent", surveyType: "agent_intake", section: "1A", questionType: "likert", dimension: "EI", isScored: true, required: true, sortOrder: 32, storageTarget: "scored_field" },
  { id: "EI_A3", text: "I am aware of my emotional reactions while I am experiencing them.", role: "agent", surveyType: "agent_intake", section: "1A", questionType: "likert", dimension: "EI", isScored: true, required: true, sortOrder: 33, storageTarget: "scored_field" },
  { id: "EI_A4", text: "When I receive criticism — from a client, colleague, or manager — I can engage with it without becoming defensive.", role: "agent", surveyType: "agent_intake", section: "1A", questionType: "likert", dimension: "EI", isScored: true, required: true, sortOrder: 34, storageTarget: "scored_field" },
  { id: "EI_A5", text: "After a stressful interaction I regain emotional balance quickly.", role: "agent", surveyType: "agent_intake", section: "1A", questionType: "likert", dimension: "EI", isScored: true, required: true, sortOrder: 35, storageTarget: "scored_field" },
  { id: "EI_A6", text: "I adjust how I communicate depending on the emotional state of the other person.", role: "agent", surveyType: "agent_intake", section: "1A", questionType: "likert", dimension: "EI", isScored: true, required: true, sortOrder: 36, storageTarget: "scored_field" },

  // Section 1B — Career Context (5)
  { id: "CTX_A1", text: "Years licensed", role: "agent", surveyType: "agent_intake", section: "1B", questionType: "multiple_choice", isScored: false, options: ["1–2", "3–5", "6–10", "10+"], required: true, sortOrder: 37, storageTarget: "raw_json" },
  { id: "CTX_A2", text: "Primary operating role", role: "agent", surveyType: "agent_intake", section: "1B", questionType: "multiple_choice", isScored: false, options: ["Solo agent", "Buyer specialist", "Listing specialist", "Team lead", "Hybrid"], required: true, sortOrder: 38, storageTarget: "raw_json" },
  { id: "CTX_A3", text: "Average annual closed transactions (last 24 months)", role: "agent", surveyType: "agent_intake", section: "1B", questionType: "multiple_choice", isScored: false, options: ["0–5", "6–12", "13–24", "25+"], required: true, sortOrder: 39, storageTarget: "raw_json" },
  { id: "CTX_A4", text: "Primary business model (select up to 2)", role: "agent", surveyType: "agent_intake", section: "1B", questionType: "checkbox", isScored: false, options: ["SOI/referrals", "Online leads", "Sphere + online hybrid", "Open houses", "Farming", "Other"], required: true, sortOrder: 40, storageTarget: "raw_json" },
  { id: "CTX_A5", text: "Before entering real estate, how would you describe the depth of your existing professional network?", role: "agent", surveyType: "agent_intake", section: "1B", questionType: "multiple_choice", isScored: false, options: ["Strong (50+ contacts)", "Moderate (20–50)", "Early stage (fewer than 20)", "Starting from scratch"], required: true, sortOrder: 41, storageTarget: "raw_json" },

  // Section 1C — Unmapped Supplemental (4)
  { id: "UNM_A1", text: "I complete necessary tasks even when motivation is low.", role: "agent", surveyType: "agent_intake", section: "1C", questionType: "likert", isScored: false, required: true, sortOrder: 42, storageTarget: "raw_json", notes: "Supplemental effort/coaching signal" },
  { id: "UNM_A2", text: "When results stall, I adjust process rather than disengage.", role: "agent", surveyType: "agent_intake", section: "1C", questionType: "likert", isScored: false, required: true, sortOrder: 43, storageTarget: "raw_json", notes: "Supplemental effort/coaching signal" },
  { id: "UNM_A3", text: "After receiving direction or coaching, I usually apply it within a short time frame.", role: "agent", surveyType: "agent_intake", section: "1C", questionType: "likert", isScored: false, required: true, sortOrder: 44, storageTarget: "raw_json", notes: "Supplemental effort/coaching signal" },
  { id: "UNM_A4", text: "Even when I don't enjoy certain tasks, I complete them consistently.", role: "agent", surveyType: "agent_intake", section: "1C", questionType: "likert", isScored: false, required: true, sortOrder: 45, storageTarget: "raw_json", notes: "Supplemental effort/coaching signal" },

  // Section 1D — EI Adjacent Unmapped (2)
  { id: "EI_UNM_A1", text: "I adjust my approach when I sense a client is feeling uncomfortable or pressured.", role: "agent", surveyType: "agent_intake", section: "1D", questionType: "likert", isScored: false, required: true, sortOrder: 46, storageTarget: "raw_json", notes: "Client experience proxy — not redundant with scored EI" },
  { id: "EI_UNM_A2", text: "When a deal goes sideways, I first evaluate my own role.", role: "agent", surveyType: "agent_intake", section: "1D", questionType: "likert", isScored: false, required: true, sortOrder: 47, storageTarget: "raw_json", notes: "Client experience proxy — not redundant with scored EI" },

  // Section 1E — Calibrated Confidence (4)
  { id: "CAL_A1", text: "I trust my judgment in business decisions.", role: "agent", surveyType: "agent_intake", section: "1E", questionType: "likert", isScored: false, required: true, sortOrder: 48, storageTarget: "raw_json", notes: "Calibrated Confidence Score — high + low production = overconfidence flag" },
  { id: "CAL_A2", text: "I can clearly explain why my current approach works.", role: "agent", surveyType: "agent_intake", section: "1E", questionType: "likert", isScored: false, required: true, sortOrder: 49, storageTarget: "raw_json", notes: "Calibrated Confidence Score" },
  { id: "CAL_A3", text: "I regularly question assumptions that previously served me.", role: "agent", surveyType: "agent_intake", section: "1E", questionType: "likert", isScored: false, required: true, sortOrder: 50, storageTarget: "raw_json", notes: "Calibrated Confidence Score" },
  { id: "CAL_A4", text: "I distinguish confidence from certainty.", role: "agent", surveyType: "agent_intake", section: "1E", questionType: "likert", isScored: false, required: true, sortOrder: 51, storageTarget: "raw_json", notes: "Calibrated Confidence Score" },

  // Section 1F — Learning & Adaptability (4)
  { id: "LRN_A1", text: "I intentionally study what top performers do differently.", role: "agent", surveyType: "agent_intake", section: "1F", questionType: "likert", isScored: false, required: true, sortOrder: 52, storageTarget: "raw_json", notes: "Predicts adoption of best practices" },
  { id: "LRN_A2", text: "I implement new ideas within 30 days of learning them.", role: "agent", surveyType: "agent_intake", section: "1F", questionType: "likert", isScored: false, required: true, sortOrder: 53, storageTarget: "raw_json", notes: "Predicts adoption of best practices" },
  { id: "LRN_A3", text: "I review performance data (conversion rates, outcomes, patterns).", role: "agent", surveyType: "agent_intake", section: "1F", questionType: "likert", isScored: false, required: true, sortOrder: 54, storageTarget: "raw_json", notes: "Predicts adoption of best practices" },
  { id: "LRN_A4", text: "When I look at my business results, I try to understand what the patterns are telling me.", role: "agent", surveyType: "agent_intake", section: "1F", questionType: "likert", isScored: false, required: true, sortOrder: 55, storageTarget: "raw_json", notes: "Predicts adoption of best practices" },

  // Section 1G — Help-Seeking & Social Connection (7)
  { id: "HLP_A1", text: "I proactively seek support when it improves outcomes.", role: "agent", surveyType: "agent_intake", section: "1G", questionType: "likert", isScored: false, required: true, sortOrder: 56, storageTarget: "raw_json" },
  { id: "HLP_A2", text: "I know where to get help when I'm stuck.", role: "agent", surveyType: "agent_intake", section: "1G", questionType: "likert", isScored: false, required: true, sortOrder: 57, storageTarget: "raw_json" },
  { id: "HLP_A3", text: "I address small problems before they become large ones.", role: "agent", surveyType: "agent_intake", section: "1G", questionType: "likert", isScored: false, required: true, sortOrder: 58, storageTarget: "raw_json" },
  { id: "HLP_A4", text: "When I'm struggling professionally, my most natural response is:", role: "agent", surveyType: "agent_intake", section: "1G", questionType: "multiple_choice", isScored: false, options: ["Work through it quietly on my own", "Reach out to a specific trusted person", "Seek out community or group support", "Look for information or systems to self-solve"], required: true, sortOrder: 59, storageTarget: "raw_json" },
  { id: "HLP_A5", text: "When I'm going through a difficult professional period, I naturally reach out to colleagues or mentors rather than working through it alone.", role: "agent", surveyType: "agent_intake", section: "1G", questionType: "likert", isScored: false, required: true, sortOrder: 60, storageTarget: "raw_json" },
  { id: "HLP_A6", text: "Feeling connected to the people I work with is important to my motivation, not just a nice feature of a good job.", role: "agent", surveyType: "agent_intake", section: "1G", questionType: "likert", isScored: false, required: true, sortOrder: 61, storageTarget: "raw_json" },
  { id: "HLP_A7", text: "In my prior professional life, I have consistently maintained meaningful long-term relationships with colleagues even after leaving those roles.", role: "agent", surveyType: "agent_intake", section: "1G", questionType: "likert", isScored: false, required: true, sortOrder: 62, storageTarget: "raw_json" },

  // Section 1H — Business Identity & Ownership (4)
  { id: "BIZ_A1", text: "When making decisions, I think in terms of systems, processes, and long-term sustainability — not just immediate transactions.", role: "agent", surveyType: "agent_intake", section: "1H", questionType: "likert", isScored: false, required: true, sortOrder: 63, storageTarget: "raw_json" },
  { id: "BIZ_A2", text: "What does 'running a business' most mean to you? (select up to 2)", role: "agent", surveyType: "agent_intake", section: "1H", questionType: "checkbox", isScored: false, options: ["Tracking numbers and performance", "Having documented systems", "Managing time intentionally", "Building something scalable", "Being professional and consistent", "Other"], required: true, sortOrder: 64, storageTarget: "raw_json" },
  { id: "BIZ_A3", text: "I make decisions based on long-term trajectory, not short-term income.", role: "agent", surveyType: "agent_intake", section: "1H", questionType: "likert", isScored: false, required: true, sortOrder: 65, storageTarget: "raw_json" },
  { id: "BIZ_A4", text: "My daily actions align with the agent I intend to be in three years.", role: "agent", surveyType: "agent_intake", section: "1H", questionType: "likert", isScored: false, required: true, sortOrder: 66, storageTarget: "raw_json" },

  // Section 1I — Qualitative Signals (3)
  { id: "QST_A1", text: "What currently limits your next level of growth?", role: "agent", surveyType: "agent_intake", section: "1I", questionType: "text", isScored: false, required: false, sortOrder: 67, storageTarget: "qualitative_table" },
  { id: "QST_A2", text: "What part of your business feels most fragile right now?", role: "agent", surveyType: "agent_intake", section: "1I", questionType: "text", isScored: false, required: false, sortOrder: 68, storageTarget: "qualitative_table" },
  { id: "QST_A3", text: "If you wanted to work less while maintaining income, what would need to change?", role: "agent", surveyType: "agent_intake", section: "1I", questionType: "text", isScored: false, required: false, sortOrder: 69, storageTarget: "qualitative_table" },

  // Section 1J — Success Definition (2)
  { id: "SUC_A1", text: "How do you personally define success in real estate? (select up to 3)", role: "agent", surveyType: "agent_intake", section: "1J", questionType: "checkbox", isScored: false, options: ["Consistent income", "Predictable schedule and work-life balance", "Helping clients at a high level", "Long-term sustainability (avoiding burnout)", "Business growth and leverage", "Recognition or status", "Flexibility and autonomy", "Being part of a professional community I value and that values me", "Other"], required: true, sortOrder: 70, storageTarget: "raw_json" },
  { id: "SUC_A2", text: "Based on your definition of success, how do you currently view your prospects for achieving it?", role: "agent", surveyType: "agent_intake", section: "1J", questionType: "scale", isScored: false, options: ["Very unlikely", "Unlikely", "Neither likely nor unlikely", "Likely", "Very likely"], required: true, sortOrder: 71, storageTarget: "raw_json" },
]

// ─────────────────────────────────────────────────────────────────────────────
// BROKER INTAKE — 91 questions
// ─────────────────────────────────────────────────────────────────────────────
const brokerIntake: Q[] = [
  // Section 2A — Scored Dimension Items (36)
  { id: "AUT_B1", text: "This brokerage allows individuals to decide how they approach their work.", role: "broker", surveyType: "broker_intake", section: "2A", questionType: "likert", dimension: "AUT", isScored: true, required: true, sortOrder: 1, storageTarget: "scored_field" },
  { id: "AUT_B2", text: "At this brokerage, agents are not closely monitored on how they do their work — only on outcomes.", role: "broker", surveyType: "broker_intake", section: "2A", questionType: "likert", dimension: "AUT", isScored: true, required: true, sortOrder: 2, storageTarget: "scored_field" },
  { id: "AUT_B3", text: "Individuals here are given discretion in how they organize their responsibilities.", role: "broker", surveyType: "broker_intake", section: "2A", questionType: "likert", dimension: "AUT", isScored: true, required: true, sortOrder: 3, storageTarget: "scored_field" },
  { id: "AUT_B4", text: "This brokerage allows people to adapt processes to fit their work style.", role: "broker", surveyType: "broker_intake", section: "2A", questionType: "likert", dimension: "AUT", isScored: true, required: true, sortOrder: 4, storageTarget: "scored_field" },
  { id: "AUT_B5", text: "People here have latitude in how they pursue goals.", role: "broker", surveyType: "broker_intake", section: "2A", questionType: "likert", dimension: "AUT", isScored: true, required: true, sortOrder: 5, storageTarget: "scored_field" },
  { id: "AUT_B6", text: "This brokerage trusts agents to make decisions about their business independently, without requiring approval for how they work.", role: "broker", surveyType: "broker_intake", section: "2A", questionType: "likert", dimension: "AUT", isScored: true, required: true, sortOrder: 6, storageTarget: "scored_field" },
  { id: "COM_B1", text: "This brokerage provides agents with specific, actionable feedback on their performance — not just results, but how to improve.", role: "broker", surveyType: "broker_intake", section: "2A", questionType: "likert", dimension: "COM", isScored: true, required: true, sortOrder: 7, storageTarget: "scored_field" },
  { id: "COM_B2", text: "People here have regular opportunities to improve and develop their skills.", role: "broker", surveyType: "broker_intake", section: "2A", questionType: "likert", dimension: "COM", isScored: true, required: true, sortOrder: 8, storageTarget: "scored_field" },
  { id: "COM_B3", text: "This brokerage gives agents opportunities to develop new skills and take on work that goes beyond what they already know how to do.", role: "broker", surveyType: "broker_intake", section: "2A", questionType: "likert", dimension: "COM", isScored: true, required: true, sortOrder: 9, storageTarget: "scored_field" },
  { id: "COM_B4", text: "Agents here understand clearly what 'doing well' looks like — success benchmarks are defined and communicated.", role: "broker", surveyType: "broker_intake", section: "2A", questionType: "likert", dimension: "COM", isScored: true, required: true, sortOrder: 10, storageTarget: "scored_field" },
  { id: "COM_B5", text: "Individuals receive direct actionable input on how to improve their performance.", role: "broker", surveyType: "broker_intake", section: "2A", questionType: "likert", dimension: "COM", isScored: true, required: true, sortOrder: 11, storageTarget: "scored_field" },
  { id: "COM_B6", text: "This brokerage provides growth opportunities rather than leaving roles static over time.", role: "broker", surveyType: "broker_intake", section: "2A", questionType: "likert", dimension: "COM", isScored: true, required: true, sortOrder: 12, storageTarget: "scored_field" },
  { id: "REL_B1", text: "This brokerage actively creates opportunities for agents to connect with each other in meaningful ways — not just around transactions.", role: "broker", surveyType: "broker_intake", section: "2A", questionType: "likert", dimension: "REL", isScored: true, required: true, sortOrder: 13, storageTarget: "scored_field" },
  { id: "REL_B2", text: "Agents at this brokerage generally feel they have people they can turn to when they need support.", role: "broker", surveyType: "broker_intake", section: "2A", questionType: "likert", dimension: "REL", isScored: true, required: true, sortOrder: 14, storageTarget: "scored_field" },
  { id: "REL_B3", text: "Agents here regularly work together and support each other — collaboration is part of how this brokerage operates, not just an occasional occurrence.", role: "broker", surveyType: "broker_intake", section: "2A", questionType: "likert", dimension: "REL", isScored: true, required: true, sortOrder: 15, storageTarget: "scored_field" },
  { id: "REL_B4", text: "Individuals here are generally treated with respect and understanding.", role: "broker", surveyType: "broker_intake", section: "2A", questionType: "likert", dimension: "REL", isScored: true, required: true, sortOrder: 16, storageTarget: "scored_field" },
  { id: "REL_B5", text: "Regular interaction among colleagues is encouraged here.", role: "broker", surveyType: "broker_intake", section: "2A", questionType: "likert", dimension: "REL", isScored: true, required: true, sortOrder: 17, storageTarget: "scored_field" },
  { id: "REL_B6", text: "The overall atmosphere at this brokerage tends to energize people rather than drain them.", role: "broker", surveyType: "broker_intake", section: "2A", questionType: "likert", dimension: "REL", isScored: true, required: true, sortOrder: 18, storageTarget: "scored_field" },
  { id: "GRIT_B1", text: "Agents here are expected to maintain consistent lead generation and outreach activity even during extended slow periods in the market.", role: "broker", surveyType: "broker_intake", section: "2A", questionType: "likert", dimension: "GRIT", isScored: true, required: true, sortOrder: 19, storageTarget: "scored_field" },
  { id: "GRIT_B2", text: "High levels of rejection are a normal and expected part of succeeding here.", role: "broker", surveyType: "broker_intake", section: "2A", questionType: "likert", dimension: "GRIT", isScored: true, required: true, sortOrder: 20, storageTarget: "scored_field" },
  { id: "GRIT_B3", text: "At this brokerage, agents typically need to put in months of consistent effort before transactions and income become reliable.", role: "broker", surveyType: "broker_intake", section: "2A", questionType: "likert", dimension: "GRIT", isScored: true, required: true, sortOrder: 21, storageTarget: "scored_field" },
  { id: "GRIT_B4", text: "Agents here are largely responsible for generating their own leads and business — the brokerage does not provide a steady pipeline of opportunities.", role: "broker", surveyType: "broker_intake", section: "2A", questionType: "likert", dimension: "GRIT", isScored: true, required: true, sortOrder: 22, storageTarget: "scored_field" },
  { id: "GRIT_B5", text: "Monthly income here can fluctuate significantly based on individual effort.", role: "broker", surveyType: "broker_intake", section: "2A", questionType: "likert", dimension: "GRIT", isScored: true, required: true, sortOrder: 23, storageTarget: "scored_field" },
  { id: "GRIT_B6", text: "Success here often requires continuing activity even when short-term results are discouraging.", role: "broker", surveyType: "broker_intake", section: "2A", questionType: "likert", dimension: "GRIT", isScored: true, required: true, sortOrder: 24, storageTarget: "scored_field" },
  { id: "SR_B1", text: "This brokerage has clear expectations about the level of weekly activity agents should be doing — and those expectations are communicated explicitly.", role: "broker", surveyType: "broker_intake", section: "2A", questionType: "likert", dimension: "SR", isScored: true, required: true, sortOrder: 25, storageTarget: "scored_field" },
  { id: "SR_B2", text: "Agents here are expected to follow consistent prospecting and follow-up routines — this is not left to individual discretion.", role: "broker", surveyType: "broker_intake", section: "2A", questionType: "likert", dimension: "SR", isScored: true, required: true, sortOrder: 26, storageTarget: "scored_field" },
  { id: "SR_B3", text: "Agent performance here is regularly reviewed against defined activity benchmarks.", role: "broker", surveyType: "broker_intake", section: "2A", questionType: "likert", dimension: "SR", isScored: true, required: true, sortOrder: 27, storageTarget: "scored_field" },
  { id: "SR_B4", text: "Agents here are expected to follow established processes closely — this isn't a place where people routinely do things their own way.", role: "broker", surveyType: "broker_intake", section: "2A", questionType: "likert", dimension: "SR", isScored: true, required: true, sortOrder: 28, storageTarget: "scored_field" },
  { id: "SR_B5", text: "Accountability conversations here occur at predictable intervals.", role: "broker", surveyType: "broker_intake", section: "2A", questionType: "likert", dimension: "SR", isScored: true, required: true, sortOrder: 29, storageTarget: "scored_field" },
  { id: "SR_B6", text: "When agents here deviate from defined systems or processes, it is addressed — not ignored.", role: "broker", surveyType: "broker_intake", section: "2A", questionType: "likert", dimension: "SR", isScored: true, required: true, sortOrder: 30, storageTarget: "scored_field" },
  { id: "EI_B1", text: "Agents at this brokerage regularly encounter high-emotion conversations — with clients, family members of clients, or other agents — as a normal part of the job.", role: "broker", surveyType: "broker_intake", section: "2A", questionType: "likert", dimension: "EI", isScored: true, required: true, sortOrder: 31, storageTarget: "scored_field" },
  { id: "EI_B2", text: "High-stakes emotionally charged interactions are common in this environment.", role: "broker", surveyType: "broker_intake", section: "2A", questionType: "likert", dimension: "EI", isScored: true, required: true, sortOrder: 32, storageTarget: "scored_field" },
  { id: "EI_B3", text: "Difficult interpersonal situations are regularly part of the work here.", role: "broker", surveyType: "broker_intake", section: "2A", questionType: "likert", dimension: "EI", isScored: true, required: true, sortOrder: 33, storageTarget: "scored_field" },
  { id: "EI_B4", text: "Agents here must frequently manage strong emotional reactions from others.", role: "broker", surveyType: "broker_intake", section: "2A", questionType: "likert", dimension: "EI", isScored: true, required: true, sortOrder: 34, storageTarget: "scored_field" },
  { id: "EI_B5", text: "Feedback conversations here can be direct and candid — agents should be prepared for honest assessments of their performance.", role: "broker", surveyType: "broker_intake", section: "2A", questionType: "likert", dimension: "EI", isScored: true, required: true, sortOrder: 35, storageTarget: "scored_field" },
  { id: "EI_B6", text: "The competitive environment here can create interpersonal tension among agents at times.", role: "broker", surveyType: "broker_intake", section: "2A", questionType: "likert", dimension: "EI", isScored: true, required: true, sortOrder: 36, storageTarget: "scored_field" },

  // Section 2B — Organizational Identifiers (6)
  { id: "ORG_B1", text: "Organization Name", role: "broker", surveyType: "broker_intake", section: "2B", questionType: "text", isScored: false, required: true, sortOrder: 37, storageTarget: "raw_json" },
  { id: "ORG_B2", text: "Organization Type", role: "broker", surveyType: "broker_intake", section: "2B", questionType: "multiple_choice", isScored: false, options: ["Brokerage (independent or franchise)", "Team operating within a brokerage", "Expansion team (multi-market)", "Hybrid"], required: true, sortOrder: 38, storageTarget: "raw_json" },
  { id: "ORG_B3", text: "If a Team: Parent Brokerage Name", role: "broker", surveyType: "broker_intake", section: "2B", questionType: "text", isScored: false, required: false, sortOrder: 39, storageTarget: "raw_json", notes: "Conditional on ORG_B2 = Team" },
  { id: "ORG_B4", text: "Primary Market / City", role: "broker", surveyType: "broker_intake", section: "2B", questionType: "text", isScored: false, required: true, sortOrder: 40, storageTarget: "raw_json" },
  { id: "ORG_B5", text: "State", role: "broker", surveyType: "broker_intake", section: "2B", questionType: "multiple_choice", isScored: false, options: ["AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY"], required: true, sortOrder: 41, storageTarget: "raw_json" },
  { id: "ORG_B6", text: "Approximate Number of Agents", role: "broker", surveyType: "broker_intake", section: "2B", questionType: "multiple_choice", isScored: false, options: ["1–5", "6–15", "16–30", "31–50", "50+"], required: true, sortOrder: 42, storageTarget: "raw_json" },

  // Section 2B — Culture & Identity (4)
  { id: "CUL_B1", text: "Which description best reflects your organization's operating identity?", role: "broker", surveyType: "broker_intake", section: "2B", questionType: "multiple_choice", isScored: false, options: ["Highly entrepreneurial/agent-driven", "Structured with systems and standards", "Training-centric and developmental", "Production-driven/performance-based", "Relationship-based/community-oriented"], required: true, sortOrder: 43, storageTarget: "raw_json" },
  { id: "CUL_B2", text: "How consistent is the culture across agents? (1 = Highly variable, 5 = Very consistent)", role: "broker", surveyType: "broker_intake", section: "2B", questionType: "scale", isScored: false, options: ["Highly variable", "Mostly variable", "Mixed", "Mostly consistent", "Very consistent"], required: true, sortOrder: 44, storageTarget: "raw_json", notes: "DO NOT USE IN CLUSTERING" },
  { id: "CUL_B3", text: "Which values are reinforced in practice? (select up to 3)", role: "broker", surveyType: "broker_intake", section: "2B", questionType: "checkbox", isScored: false, options: ["Autonomy and independence", "Accountability and follow-through", "Consistency and habits", "Collaboration and team support", "Growth and learning", "High standards and professionalism"], required: true, sortOrder: 45, storageTarget: "raw_json" },
  { id: "CUL_B4", text: "Do new agents typically receive the same onboarding experience, or is it adjusted?", role: "broker", surveyType: "broker_intake", section: "2B", questionType: "multiple_choice", isScored: false, options: ["Mostly the same", "Some adjustments", "Highly customized"], required: true, sortOrder: 46, storageTarget: "raw_json" },

  // Section 2B — Authority & Expectations (6)
  { id: "EXP_B1", text: "Who primarily sets expectations for agents?", role: "broker", surveyType: "broker_intake", section: "2B", questionType: "multiple_choice", isScored: false, options: ["Brokerage leadership", "Team leader(s)", "Shared", "Largely self-directed by agents"], required: true, sortOrder: 47, storageTarget: "raw_json" },
  { id: "EXP_B2", text: "How explicitly are expectations communicated to new agents? (1 = Not at all, 5 = Extremely)", role: "broker", surveyType: "broker_intake", section: "2B", questionType: "scale", isScored: false, options: ["Not at all", "Slightly", "Moderately", "Very", "Extremely"], required: true, sortOrder: 48, storageTarget: "raw_json" },
  { id: "EXP_B3", text: "After onboarding, how much structure is required to remain in good standing?", role: "broker", surveyType: "broker_intake", section: "2B", questionType: "multiple_choice", isScored: false, options: ["Minimal", "Moderate", "High"], required: true, sortOrder: 49, storageTarget: "raw_json" },
  { id: "EXP_B4", text: "Clear activity or performance standards are expected of agents.", role: "broker", surveyType: "broker_intake", section: "2B", questionType: "likert", isScored: false, required: true, sortOrder: 50, storageTarget: "raw_json" },
  { id: "EXP_B5", text: "Systems and processes are consistently enforced.", role: "broker", surveyType: "broker_intake", section: "2B", questionType: "likert", isScored: false, required: true, sortOrder: 51, storageTarget: "raw_json" },
  { id: "EXP_B6", text: "Expectations are applied similarly across agents.", role: "broker", surveyType: "broker_intake", section: "2B", questionType: "likert", isScored: false, required: true, sortOrder: 52, storageTarget: "raw_json" },

  // Section 2B — Training & Onboarding (7)
  { id: "TRN_B1", text: "Is there a formal onboarding process?", role: "broker", surveyType: "broker_intake", section: "2B", questionType: "yes_no", isScored: false, required: true, sortOrder: 53, storageTarget: "raw_json" },
  { id: "TRN_B2", text: "Who owns onboarding and training delivery?", role: "broker", surveyType: "broker_intake", section: "2B", questionType: "multiple_choice", isScored: false, options: ["Brokerage", "Team", "Shared", "External or third-party"], required: false, sortOrder: 54, storageTarget: "raw_json", notes: "Conditional on TRN_B1 = Yes" },
  { id: "TRN_B3", text: "How structured is onboarding in practice? (1 = Not at all, 5 = Highly)", role: "broker", surveyType: "broker_intake", section: "2B", questionType: "scale", isScored: false, options: ["Not at all", "Slightly", "Moderately", "Very", "Highly"], required: true, sortOrder: 55, storageTarget: "raw_json" },
  { id: "TRN_B4", text: "Which best describes your training model?", role: "broker", surveyType: "broker_intake", section: "2B", questionType: "multiple_choice", isScored: false, options: ["Scheduled in-person", "Hybrid", "Mostly self-paced", "Minimal formal training"], required: true, sortOrder: 56, storageTarget: "raw_json" },
  { id: "TRN_B5", text: "Percentage of new agents actively participating in training during first 90 days?", role: "broker", surveyType: "broker_intake", section: "2B", questionType: "multiple_choice", isScored: false, options: ["Most (75%+)", "About half", "A small minority"], required: true, sortOrder: 57, storageTarget: "raw_json" },
  { id: "TRN_B6", text: "Percentage of experienced agents actively participating in ongoing training?", role: "broker", surveyType: "broker_intake", section: "2B", questionType: "multiple_choice", isScored: false, options: ["Most (75%+)", "About half", "A small minority", "Very few", "Not applicable"], required: true, sortOrder: 58, storageTarget: "raw_json" },
  { id: "TRN_B7", text: "Is participation in training mandatory, optional, or role-dependent?", role: "broker", surveyType: "broker_intake", section: "2B", questionType: "multiple_choice", isScored: false, options: ["Mandatory for all", "Mandatory for new agents only", "Optional but encouraged", "Entirely self-directed"], required: true, sortOrder: 59, storageTarget: "raw_json" },

  // Section 2B — Social Infrastructure (3)
  { id: "SOC_B1", text: "How often do agents interact in non-transaction-specific ways?", role: "broker", surveyType: "broker_intake", section: "2B", questionType: "multiple_choice", isScored: false, options: ["Rarely or never", "Occasionally", "Weekly", "Daily", "It's a core part of our culture"], required: true, sortOrder: 60, storageTarget: "raw_json" },
  { id: "SOC_B2", text: "When a new agent joins, how quickly do they typically form a meaningful professional relationship?", role: "broker", surveyType: "broker_intake", section: "2B", questionType: "multiple_choice", isScored: false, options: ["Within first week", "Within first month", "Within 90 days", "It varies", "We don't track this"], required: true, sortOrder: 61, storageTarget: "raw_json" },
  { id: "SOC_B3", text: "Does your organization have a mentorship structure for new agents?", role: "broker", surveyType: "broker_intake", section: "2B", questionType: "multiple_choice", isScored: false, options: ["Formal program", "Informal but common", "Occasional but not structured", "Rarely happens", "No"], required: true, sortOrder: 62, storageTarget: "raw_json" },

  // Section 2B — Accountability Structure (6)
  { id: "ACC_B1", text: "Who primarily provides accountability?", role: "broker", surveyType: "broker_intake", section: "2B", questionType: "multiple_choice", isScored: false, options: ["Brokerage leadership", "Team leadership", "Peer accountability", "Agent self-accountability"], required: true, sortOrder: 63, storageTarget: "raw_json", notes: "DO NOT USE FOR TRAIT INDICATORS" },
  { id: "ACC_B2", text: "How often are agents proactively reviewed for progress?", role: "broker", surveyType: "broker_intake", section: "2B", questionType: "multiple_choice", isScored: false, options: ["Weekly", "Monthly", "Quarterly", "Only when issues arise", "Rarely or never"], required: true, sortOrder: 64, storageTarget: "raw_json", notes: "DO NOT USE FOR TRAIT INDICATORS" },
  { id: "ACC_B3", text: "Accountability conversations focus on improvement and learning.", role: "broker", surveyType: "broker_intake", section: "2B", questionType: "likert", isScored: false, required: true, sortOrder: 65, storageTarget: "raw_json" },
  { id: "ACC_B4", text: "Consequences are predictable and transparent.", role: "broker", surveyType: "broker_intake", section: "2B", questionType: "likert", isScored: false, required: true, sortOrder: 66, storageTarget: "raw_json" },
  { id: "ACC_B5", text: "Accountability is applied consistently across agents.", role: "broker", surveyType: "broker_intake", section: "2B", questionType: "likert", isScored: false, required: true, sortOrder: 67, storageTarget: "raw_json" },
  { id: "ACC_B6", text: "Accountability feels primarily punitive.", role: "broker", surveyType: "broker_intake", section: "2B", questionType: "likert", isScored: false, required: true, sortOrder: 68, storageTarget: "raw_json", notes: "REVERSE SCORED" },

  // Section 2B — Leadership Response Style / Autonomy Support (5)
  { id: "AUS_B1", text: "When agents struggle, how often does leadership help agents problem-solve and choose next steps?", role: "broker", surveyType: "broker_intake", section: "2B", questionType: "likert", isScored: false, required: true, sortOrder: 69, storageTarget: "raw_json" },
  { id: "AUS_B2", text: "When agents struggle, how often does leadership clarify expectations and available options without prescribing the solution?", role: "broker", surveyType: "broker_intake", section: "2B", questionType: "likert", isScored: false, required: true, sortOrder: 70, storageTarget: "raw_json" },
  { id: "AUS_B3", text: "When agents struggle, how often does leadership encourage agents to retain ownership of decisions?", role: "broker", surveyType: "broker_intake", section: "2B", questionType: "likert", isScored: false, required: true, sortOrder: 71, storageTarget: "raw_json" },
  { id: "AUS_B4", text: "When agents struggle, how often does leadership increase oversight or requirements?", role: "broker", surveyType: "broker_intake", section: "2B", questionType: "likert", isScored: false, required: true, sortOrder: 72, storageTarget: "raw_json" },
  { id: "AUS_B5", text: "When agents struggle, how often does leadership reduce flexibility or privileges?", role: "broker", surveyType: "broker_intake", section: "2B", questionType: "likert", isScored: false, required: true, sortOrder: 73, storageTarget: "raw_json" },

  // Section 2B — Psychological Safety & Coaching Quality (7)
  { id: "PSY_B1", text: "Agents feel safe asking for help before problems become serious.", role: "broker", surveyType: "broker_intake", section: "2B", questionType: "likert", isScored: false, required: true, sortOrder: 74, storageTarget: "raw_json" },
  { id: "PSY_B2", text: "Feedback is delivered in a way that preserves dignity and respect.", role: "broker", surveyType: "broker_intake", section: "2B", questionType: "likert", isScored: false, required: true, sortOrder: 75, storageTarget: "raw_json" },
  { id: "PSY_B3", text: "Struggling agents are treated with support rather than judgment.", role: "broker", surveyType: "broker_intake", section: "2B", questionType: "likert", isScored: false, required: true, sortOrder: 76, storageTarget: "raw_json" },
  { id: "PSY_B4", text: "Agents here receive feedback that helps them clearly understand how to improve.", role: "broker", surveyType: "broker_intake", section: "2B", questionType: "likert", isScored: false, required: true, sortOrder: 77, storageTarget: "raw_json" },
  { id: "PSY_B5", text: "Coaching focuses on skill-building, not just results.", role: "broker", surveyType: "broker_intake", section: "2B", questionType: "likert", isScored: false, required: true, sortOrder: 78, storageTarget: "raw_json" },
  { id: "PSY_B6", text: "Agents leave coaching interactions feeling more capable.", role: "broker", surveyType: "broker_intake", section: "2B", questionType: "likert", isScored: false, required: true, sortOrder: 79, storageTarget: "raw_json" },
  { id: "PSY_B7", text: "Systems are explained with purpose, not just enforced.", role: "broker", surveyType: "broker_intake", section: "2B", questionType: "likert", isScored: false, required: true, sortOrder: 80, storageTarget: "raw_json" },

  // Section 2B — Attrition & Success Patterns (2)
  { id: "ATT_B1", text: "Estimated percentage of new agents still active after 12 months", role: "broker", surveyType: "broker_intake", section: "2B", questionType: "multiple_choice", isScored: false, options: ["Under 25%", "25–50%", "50–75%", "Over 75%"], required: true, sortOrder: 81, storageTarget: "raw_json" },
  { id: "ATT_B2", text: "Primary reasons agents struggle or exit (select up to 3)", role: "broker", surveyType: "broker_intake", section: "2B", questionType: "checkbox", isScored: false, options: ["Unrealistic expectations", "Lack of consistent effort", "Financial pressure", "Time management issues", "Poor cultural fit", "Resistance to structure or accountability"], required: true, sortOrder: 82, storageTarget: "raw_json" },

  // Section 2B — Success Definition (4)
  { id: "SUC_B1", text: "Which indicators most define a 'successful agent' in your organization? Rank in order.", role: "broker", surveyType: "broker_intake", section: "2B", questionType: "rank", isScored: false, options: ["Consistent transaction volume", "Consistent daily activity and habits", "Income stability", "Client satisfaction and referrals", "Professionalism and compliance", "Team contribution", "Growth trajectory over time"], required: true, sortOrder: 83, storageTarget: "raw_json" },
  { id: "SUC_B2", text: "At what point would you consider an agent 'successful' in a basic sense?", role: "broker", surveyType: "broker_intake", section: "2B", questionType: "multiple_choice", isScored: false, options: ["Actively producing regardless of volume", "Covering personal expenses", "Closing consistently each quarter", "Hitting defined benchmarks", "Only top-tier producers"], required: true, sortOrder: 84, storageTarget: "raw_json" },
  { id: "SUC_B3", text: "Which matters more in evaluating success at the 12–18 month mark?", role: "broker", surveyType: "broker_intake", section: "2B", questionType: "multiple_choice", isScored: false, options: ["Current production level", "Trajectory and momentum", "Consistency of habits", "Long-term potential", "It depends on the agent"], required: true, sortOrder: 85, storageTarget: "raw_json" },
  { id: "SUC_B4", text: "Where do agents most often misunderstand how success is evaluated here?", role: "broker", surveyType: "broker_intake", section: "2B", questionType: "multiple_choice", isScored: false, options: ["Overestimate importance of production", "Underestimate importance of habits", "Assume support is unconditional", "Expect faster results", "Misread cultural expectations"], required: true, sortOrder: 86, storageTarget: "raw_json" },

  // Section 2B — Agent Fit Profile (3)
  { id: "FIT_B1", text: "Which agent profile thrives most in your organization?", role: "broker", surveyType: "broker_intake", section: "2B", questionType: "multiple_choice", isScored: false, options: ["Highly self-motivated and independent", "Coachable and systems-oriented", "Relationship-focused and patient", "Competitive and performance-driven", "Role-specific team contributor"], required: true, sortOrder: 87, storageTarget: "raw_json" },
  { id: "FIT_B2", text: "Which agent profile struggles most in your organization?", role: "broker", surveyType: "broker_intake", section: "2B", questionType: "multiple_choice", isScored: false, options: ["Highly self-motivated and independent", "Coachable and systems-oriented", "Relationship-focused and patient", "Competitive and performance-driven", "Role-specific team contributor"], required: true, sortOrder: 88, storageTarget: "raw_json" },
  { id: "FIT_B3", text: "How tolerant is your organization of slower-ramp agents?", role: "broker", surveyType: "broker_intake", section: "2B", questionType: "likert", isScored: false, required: true, sortOrder: 89, storageTarget: "raw_json" },

  // Section 2B — Calibration & Reality Check (2)
  { id: "CAL_B1", text: "Where is the biggest gap between agent expectations and reality at your brokerage?", role: "broker", surveyType: "broker_intake", section: "2B", questionType: "text", isScored: false, required: false, sortOrder: 90, storageTarget: "qualitative_table" },
  { id: "CAL_B2", text: "If an agent fails here, what is the most common cause?", role: "broker", surveyType: "broker_intake", section: "2B", questionType: "multiple_choice", isScored: false, options: ["Poor fit", "Lack of effort", "Lack of structure", "Lack of support", "External factors"], required: true, sortOrder: 91, storageTarget: "raw_json" },
]

// ─────────────────────────────────────────────────────────────────────────────
// AGENT 90-DAY CHECK-IN — 16 questions
// ─────────────────────────────────────────────────────────────────────────────
const agent90Day: Q[] = [
  { id: "AG90_A1", text: "Compared to when I started, my daily routines are more consistent.", role: "agent", surveyType: "agent_90_day", section: "Routines", questionType: "likert", isScored: false, required: true, sortOrder: 1, storageTarget: "raw_json" },
  { id: "AG90_A2", text: "I have adopted at least one repeatable system that I did not have at the beginning.", role: "agent", surveyType: "agent_90_day", section: "Routines", questionType: "likert", isScored: false, required: true, sortOrder: 2, storageTarget: "raw_json" },
  { id: "AG90_B1", text: "When I receive coaching or feedback, I usually apply it within a short time frame.", role: "agent", surveyType: "agent_90_day", section: "Coachability", questionType: "likert", isScored: false, required: true, sortOrder: 3, storageTarget: "raw_json" },
  { id: "AG90_B2", text: "I can receive corrective feedback without becoming defensive.", role: "agent", surveyType: "agent_90_day", section: "Coachability", questionType: "likert", isScored: false, required: true, sortOrder: 4, storageTarget: "raw_json" },
  { id: "AG90_C1", text: "I follow through on commitments without needing reminders.", role: "agent", surveyType: "agent_90_day", section: "Accountability", questionType: "likert", isScored: false, required: true, sortOrder: 5, storageTarget: "raw_json" },
  { id: "AG90_D1", text: "I recover from setbacks faster now than I did in my first few weeks.", role: "agent", surveyType: "agent_90_day", section: "Stress/Recovery", questionType: "likert", isScored: false, required: true, sortOrder: 6, storageTarget: "raw_json" },
  { id: "AG90_E1", text: "What feels harder than you expected so far?", role: "agent", surveyType: "agent_90_day", section: "Qualitative", questionType: "text", isScored: false, required: false, sortOrder: 7, storageTarget: "qualitative_table" },
  { id: "AG90_E2", text: "What has helped you improve the most so far?", role: "agent", surveyType: "agent_90_day", section: "Qualitative", questionType: "text", isScored: false, required: false, sortOrder: 8, storageTarget: "qualitative_table" },
  { id: "AG90_E3", text: "Has a specific person — mentor, colleague, or leader — been particularly important to your progress? If yes, what did they do that helped most?", role: "agent", surveyType: "agent_90_day", section: "Qualitative", questionType: "text", isScored: false, required: false, sortOrder: 9, storageTarget: "qualitative_table" },
  { id: "AG90_F1", text: "I feel genuinely supported by the people in my brokerage — not just professionally, but as a person.", role: "agent", surveyType: "agent_90_day", section: "Connection", questionType: "likert", isScored: false, required: true, sortOrder: 10, storageTarget: "raw_json" },
  { id: "AG90_F2", text: "When I'm struggling, I feel comfortable asking for help within my brokerage without worrying about how it reflects on me.", role: "agent", surveyType: "agent_90_day", section: "Connection", questionType: "likert", isScored: false, required: true, sortOrder: 11, storageTarget: "raw_json" },
  { id: "AG90_EI1", text: "When I notice a client is uncomfortable, I change how I'm communicating before they have to tell me.", role: "agent", surveyType: "agent_90_day", section: "EI", questionType: "likert", isScored: false, required: true, sortOrder: 12, storageTarget: "raw_json" },
  { id: "PIE_A1", text: "Production (appointments, contracts, negotiations) — what % of your time?", role: "agent", surveyType: "agent_90_day", section: "Time", questionType: "number", isScored: false, required: true, sortOrder: 13, storageTarget: "raw_json", notes: "Must total 100 with PIE_A2 and PIE_A3" },
  { id: "PIE_A2", text: "Income Support (lead gen, follow-up, nurturing) — what % of your time?", role: "agent", surveyType: "agent_90_day", section: "Time", questionType: "number", isScored: false, required: true, sortOrder: 14, storageTarget: "raw_json" },
  { id: "PIE_A3", text: "Expansion / Improvement (systems, learning, reflection) — what % of your time?", role: "agent", surveyType: "agent_90_day", section: "Time", questionType: "number", isScored: false, required: true, sortOrder: 15, storageTarget: "raw_json" },
  { id: "PIE_A4", text: "This allocation reflects how I want my business to operate.", role: "agent", surveyType: "agent_90_day", section: "Time", questionType: "likert", isScored: false, required: true, sortOrder: 16, storageTarget: "raw_json" },
]

// ─────────────────────────────────────────────────────────────────────────────
// AGENT 180-DAY CHECK-IN — 12 questions
// ─────────────────────────────────────────────────────────────────────────────
const agent180Day: Q[] = [
  { id: "AG180_A1", text: "The routines and systems I adopted earlier are still in place.", role: "agent", surveyType: "agent_180_day", section: "Sustained", questionType: "likert", isScored: false, required: true, sortOrder: 1, storageTarget: "raw_json" },
  { id: "AG180_A2", text: "My workdays feel more structured than they did at the beginning.", role: "agent", surveyType: "agent_180_day", section: "Sustained", questionType: "likert", isScored: false, required: true, sortOrder: 2, storageTarget: "raw_json" },
  { id: "AG180_B1", text: "Coaching feedback now requires fewer reminders than earlier on.", role: "agent", surveyType: "agent_180_day", section: "Coachability", questionType: "likert", isScored: false, required: true, sortOrder: 3, storageTarget: "raw_json" },
  { id: "AG180_C1", text: "I now understand what level of structure I need to perform at my best.", role: "agent", surveyType: "agent_180_day", section: "Autonomy", questionType: "likert", isScored: false, required: true, sortOrder: 4, storageTarget: "raw_json" },
  { id: "AG180_D1", text: "My current stress level feels manageable long-term.", role: "agent", surveyType: "agent_180_day", section: "Sustainability", questionType: "likert", isScored: false, required: true, sortOrder: 5, storageTarget: "raw_json" },
  { id: "AG180_E1", text: "I feel primarily responsible for my results, regardless of available support.", role: "agent", surveyType: "agent_180_day", section: "Ownership", questionType: "likert", isScored: false, required: true, sortOrder: 6, storageTarget: "raw_json" },
  { id: "AG180_F1", text: "I feel like the people in my brokerage genuinely care about my success as a person, not just my production numbers.", role: "agent", surveyType: "agent_180_day", section: "Connection", questionType: "likert", isScored: false, required: true, sortOrder: 7, storageTarget: "raw_json" },
  { id: "AG180_F2", text: "If I were struggling seriously right now, I know exactly who in my brokerage I could turn to.", role: "agent", surveyType: "agent_180_day", section: "Connection", questionType: "likert", isScored: false, required: true, sortOrder: 8, storageTarget: "raw_json" },
  { id: "AG180_G1", text: "Based on how I define success, my current trajectory feels aligned.", role: "agent", surveyType: "agent_180_day", section: "Alignment", questionType: "likert", isScored: false, required: true, sortOrder: 9, storageTarget: "raw_json" },
  { id: "AG180_H1", text: "I see myself still actively practicing real estate 12 months from now.", role: "agent", surveyType: "agent_180_day", section: "Retention", questionType: "likert", isScored: false, required: true, sortOrder: 10, storageTarget: "raw_json" },
  { id: "AG180_I1", text: "What would most improve your results over the next six months?", role: "agent", surveyType: "agent_180_day", section: "Qualitative", questionType: "text", isScored: false, required: false, sortOrder: 11, storageTarget: "qualitative_table" },
  { id: "AG180_I2", text: "What, if anything, makes you question your long-term fit right now?", role: "agent", surveyType: "agent_180_day", section: "Qualitative", questionType: "text", isScored: false, required: false, sortOrder: 12, storageTarget: "qualitative_table" },
]

// ─────────────────────────────────────────────────────────────────────────────
// BROKER 90-DAY EVALUATION — 29 questions
// ─────────────────────────────────────────────────────────────────────────────
const broker90Day: Q[] = [
  { id: "BK90_B1", text: "How consistently has this agent shown up prepared and on time?", role: "broker", surveyType: "broker_90_day", section: "Engagement", questionType: "likert", isScored: false, required: true, sortOrder: 1, storageTarget: "raw_json" },
  { id: "BK90_B2", text: "When this agent commits to an action, how reliably do they follow through?", role: "broker", surveyType: "broker_90_day", section: "Engagement", questionType: "likert", isScored: false, required: true, sortOrder: 2, storageTarget: "raw_json" },
  { id: "BK90_B3", text: "Which best describes this agent's weekly activity rhythm?", role: "broker", surveyType: "broker_90_day", section: "Engagement", questionType: "multiple_choice", isScored: false, options: ["No clear routine", "Sporadic effort", "Some weekly structure", "Clear weekly routine", "Highly disciplined cadence"], required: true, sortOrder: 3, storageTarget: "raw_json" },
  { id: "BK90_C1", text: "When given feedback or instruction, this agent:", role: "broker", surveyType: "broker_90_day", section: "Coachability", questionType: "multiple_choice", isScored: false, options: ["Becomes defensive or dismissive", "Listens but rarely engages", "Acknowledges feedback", "Asks clarifying questions", "Actively seeks feedback"], required: true, sortOrder: 4, storageTarget: "raw_json" },
  { id: "BK90_C2", text: "After receiving coaching, this agent typically applies it:", role: "broker", surveyType: "broker_90_day", section: "Coachability", questionType: "multiple_choice", isScored: false, options: ["Not at all", "Inconsistently", "After multiple reminders", "Within 1–2 weeks", "Immediately or same week"], required: true, sortOrder: 5, storageTarget: "raw_json" },
  { id: "BK90_C3", text: "When a strategy feels uncomfortable (calls, scripts, follow-up), this agent:", role: "broker", surveyType: "broker_90_day", section: "Coachability", questionType: "multiple_choice", isScored: false, options: ["Avoids it", "Tries briefly then stops", "Needs frequent encouragement", "Pushes through resistance", "Leans into discomfort consistently"], required: true, sortOrder: 6, storageTarget: "raw_json" },
  { id: "BK90_C4", text: "Does this agent close the loop by reporting back on what they tried and what happened?", role: "broker", surveyType: "broker_90_day", section: "Coachability", questionType: "multiple_choice", isScored: false, options: ["Yes", "No", "Unsure"], required: true, sortOrder: 7, storageTarget: "raw_json" },
  { id: "BK90_C5", text: "Over time, this agent's response to coaching has:", role: "broker", surveyType: "broker_90_day", section: "Coachability", questionType: "multiple_choice", isScored: false, options: ["Declined", "Stayed the same", "Improved slightly", "Improved significantly"], required: true, sortOrder: 8, storageTarget: "raw_json" },
  { id: "BK90_C6", text: "This agent actively engages with colleagues, mentors, or leadership outside of required interactions.", role: "broker", surveyType: "broker_90_day", section: "Coachability", questionType: "likert", isScored: false, required: true, sortOrder: 9, storageTarget: "raw_json" },
  { id: "BK90_C7", text: "Based on observed behavior (not personality), this agent is:", role: "broker", surveyType: "broker_90_day", section: "Coachability", questionType: "multiple_choice", isScored: false, options: ["Not teachable in current environment", "Conditionally teachable with structure", "Generally teachable", "Highly teachable and self-directed"], required: true, sortOrder: 10, storageTarget: "raw_json" },
  { id: "BK90_C8", text: "Does this agent perform better when given:", role: "broker", surveyType: "broker_90_day", section: "Coachability", questionType: "multiple_choice", isScored: false, options: ["Clear structure and expectations", "Flexibility and autonomy", "A balance of both"], required: true, sortOrder: 11, storageTarget: "raw_json" },
  { id: "BK90_C9", text: "When things don't work, the agent typically:", role: "broker", surveyType: "broker_90_day", section: "Coachability", questionType: "multiple_choice", isScored: false, options: ["Blames external factors", "Gets discouraged", "Asks for direction", "Adjusts approach independently", "Actively seeks improvement feedback"], required: true, sortOrder: 12, storageTarget: "raw_json" },
  { id: "BK90_C10", text: "How effectively does this agent manage their business without constant external accountability or reminders?", role: "broker", surveyType: "broker_90_day", section: "Coachability", questionType: "likert", isScored: false, required: true, sortOrder: 13, storageTarget: "raw_json" },
  { id: "BK90_C11", text: "Which best describes this agent's planning and tracking behavior?", role: "broker", surveyType: "broker_90_day", section: "Coachability", questionType: "multiple_choice", isScored: false, options: ["Rarely plans or tracks", "Plans occasionally but does not track", "Tracks but rarely plans", "Plans and tracks most weeks", "Plans, tracks, reviews, and adjusts consistently"], required: true, sortOrder: 14, storageTarget: "raw_json" },
  { id: "BK90_D1", text: "Primary lead source behavior observed (select all that apply)", role: "broker", surveyType: "broker_90_day", section: "Business Dev", questionType: "checkbox", isScored: false, options: ["Sphere nurturing", "Open houses", "Paid leads", "Social media", "Cold outreach", "Inconsistent or unclear"], required: true, sortOrder: 15, storageTarget: "raw_json" },
  { id: "BK90_D2", text: "CRM usage as observed", role: "broker", surveyType: "broker_90_day", section: "Business Dev", questionType: "multiple_choice", isScored: false, options: ["Not using", "Minimal/sporadic", "Basic usage", "Consistent usage", "Advanced/disciplined"], required: true, sortOrder: 16, storageTarget: "raw_json" },
  { id: "BK90_D3", text: "Compared to expectations at onboarding, this agent's pipeline is:", role: "broker", surveyType: "broker_90_day", section: "Business Dev", questionType: "multiple_choice", isScored: false, options: ["Far behind", "Slightly behind", "On track", "Ahead of expectations"], required: true, sortOrder: 17, storageTarget: "raw_json" },
  { id: "BK90_E1", text: "This agent has formed at least one meaningful professional relationship within the brokerage.", role: "broker", surveyType: "broker_90_day", section: "Support", questionType: "multiple_choice", isScored: false, options: ["Yes", "No", "Unsure"], required: true, sortOrder: 18, storageTarget: "raw_json" },
  { id: "BK90_E2", text: "What support was delivered? (select all that apply)", role: "broker", surveyType: "broker_90_day", section: "Support", questionType: "checkbox", isScored: false, options: ["Onboarding training", "One-on-one coaching", "Shadowing opportunities", "Accountability check-ins", "None or minimal"], required: true, sortOrder: 19, storageTarget: "raw_json" },
  { id: "BK90_E3", text: "Friction points observed in this agent (select all that apply)", role: "broker", surveyType: "broker_90_day", section: "Support", questionType: "checkbox", isScored: false, options: ["Overwhelm", "Time management", "Confidence", "Systems confusion", "Communication gaps", "Motivation inconsistency"], required: false, sortOrder: 20, storageTarget: "raw_json" },
  { id: "BK90_E4", text: "When this agent showed signs of struggling, what changed most?", role: "broker", surveyType: "broker_90_day", section: "Support", questionType: "multiple_choice", isScored: false, options: ["Coaching or guidance increased", "Oversight or requirements increased", "Expectations were reduced", "Nothing changed", "Agent was advised to exit"], required: true, sortOrder: 21, storageTarget: "raw_json" },
  { id: "BK90_E5", text: "Did the brokerage take a deliberate action intended to help this agent recover momentum after a low point?", role: "broker", surveyType: "broker_90_day", section: "Support", questionType: "multiple_choice", isScored: false, options: ["Yes", "No", "Not applicable (agent never stalled)"], required: true, sortOrder: 22, storageTarget: "raw_json" },
  { id: "BK90_F1", text: "Transactions to date (optional)", role: "broker", surveyType: "broker_90_day", section: "Outcomes", questionType: "number", isScored: false, required: false, sortOrder: 23, storageTarget: "raw_json" },
  { id: "BK90_F2", text: "Based on observed interactions, how would you rate the agent's ability to build trust with clients?", role: "broker", surveyType: "broker_90_day", section: "Outcomes", questionType: "likert", isScored: false, required: true, sortOrder: 24, storageTarget: "raw_json" },
  { id: "BK90_G1", text: "Based on current behavior, this agent is:", role: "broker", surveyType: "broker_90_day", section: "Predictive", questionType: "multiple_choice", isScored: false, options: ["Unlikely to succeed without major change", "At risk", "Developing steadily", "Strong long-term candidate", "High-confidence future producer"], required: true, sortOrder: 25, storageTarget: "raw_json" },
  { id: "BK90_G2", text: "Intervention recommendation", role: "broker", surveyType: "broker_90_day", section: "Predictive", questionType: "multiple_choice", isScored: false, options: ["No change needed", "Increased accountability", "Targeted coaching", "System reset", "Hard conversation required"], required: true, sortOrder: 26, storageTarget: "raw_json" },
  { id: "BK90_H1", text: "Primary factor limiting this agent's next level of growth", role: "broker", surveyType: "broker_90_day", section: "Observations", questionType: "multiple_choice", isScored: false, options: ["Inconsistent execution/follow-through", "Time management or prioritization", "Skill gaps", "Lead generation", "Systems and process discipline", "Confidence or emotional resilience", "Coachability/resistance to feedback", "External life constraints", "No clear limiting factor"], required: true, sortOrder: 27, storageTarget: "raw_json" },
  { id: "BK90_H2", text: "How significantly is this factor limiting the agent's progress right now? (1 = Minor friction, 5 = Critical blocker)", role: "broker", surveyType: "broker_90_day", section: "Observations", questionType: "scale", isScored: false, options: ["Minor friction", "Noticeable but manageable", "Moderate blocker", "Significant blocker", "Critical blocker"], required: true, sortOrder: 28, storageTarget: "raw_json" },
  { id: "BK90_H3", text: "Any patterns, circumstances, or observations not captured above?", role: "broker", surveyType: "broker_90_day", section: "Observations", questionType: "text", isScored: false, required: false, sortOrder: 29, storageTarget: "qualitative_table" },
]

// ─────────────────────────────────────────────────────────────────────────────
// BROKER 180-DAY — 6 additional questions (reuses broker_90_day in app logic)
// ─────────────────────────────────────────────────────────────────────────────
const broker180Day: Q[] = [
  { id: "BK180_G3", text: "Compared to 90 days ago, this agent's engagement with the people and community of this brokerage has:", role: "broker", surveyType: "broker_180_day", section: "Trajectory", questionType: "multiple_choice", isScored: false, options: ["Decreased", "Stayed the same", "Increased", "Significantly increased"], required: true, sortOrder: 30, storageTarget: "raw_json" },
  { id: "BK180_G4", text: "Compared to the 90-day mark, this agent's overall trajectory (behavior, consistency, and results) is:", role: "broker", surveyType: "broker_180_day", section: "Trajectory", questionType: "multiple_choice", isScored: false, options: ["Declining", "Flat", "Improving", "Breakthrough"], required: true, sortOrder: 31, storageTarget: "raw_json" },
  { id: "BK180_G5", text: "Based on observed behavior and engagement, how likely is this agent to still be actively practicing real estate 12 months from now? (1 = Very unlikely, 5 = Very likely)", role: "broker", surveyType: "broker_180_day", section: "Retention", questionType: "scale", isScored: false, options: ["Very unlikely", "Unlikely", "Uncertain", "Likely", "Very likely"], required: true, sortOrder: 32, storageTarget: "raw_json" },
  { id: "BK180_G6", text: "Knowing what you know now, would you choose to recruit this agent again into your organization?", role: "broker", surveyType: "broker_180_day", section: "Recruitment", questionType: "multiple_choice", isScored: false, options: ["Yes", "No", "Unsure"], required: true, sortOrder: 33, storageTarget: "raw_json" },
  { id: "BK180_G7", text: "What is the primary reason for your answer above?", role: "broker", surveyType: "broker_180_day", section: "Reason", questionType: "multiple_choice", isScored: false, options: ["Strong growth and trajectory", "High coachability", "Reliable execution", "Cultural or values alignment", "Inconsistent execution", "Low coachability", "Support required outweighs return", "External or personal constraints", "Other or mixed factors"], required: true, sortOrder: 34, storageTarget: "raw_json" },
  { id: "BK180_G8", text: "Additional context (optional)", role: "broker", surveyType: "broker_180_day", section: "Context", questionType: "text", isScored: false, required: false, sortOrder: 35, storageTarget: "qualitative_table" },
]

const allQuestions: Q[] = [
  ...agentIntake,
  ...brokerIntake,
  ...agent90Day,
  ...agent180Day,
  ...broker90Day,
  ...broker180Day,
]

async function main() {
  for (const q of allQuestions) {
    await prisma.question.upsert({
      where: { id: q.id },
      update: {
        text: q.text,
        role: q.role,
        surveyType: q.surveyType,
        section: q.section,
        questionType: q.questionType,
        dimension: q.dimension ?? null,
        isScored: q.isScored,
        options: q.options ?? undefined,
        required: q.required,
        sortOrder: q.sortOrder,
        storageTarget: q.storageTarget,
        notes: q.notes ?? null,
      },
      create: {
        id: q.id,
        text: q.text,
        role: q.role,
        surveyType: q.surveyType,
        section: q.section,
        questionType: q.questionType,
        dimension: q.dimension ?? null,
        isScored: q.isScored,
        options: q.options ?? undefined,
        required: q.required,
        sortOrder: q.sortOrder,
        storageTarget: q.storageTarget,
        notes: q.notes ?? null,
      },
    })
  }
  console.log(`Seeded ${allQuestions.length} questions.`)
  console.log(`  agent_intake: ${agentIntake.length}`)
  console.log(`  broker_intake: ${brokerIntake.length}`)
  console.log(`  agent_90_day: ${agent90Day.length}`)
  console.log(`  agent_180_day: ${agent180Day.length}`)
  console.log(`  broker_90_day: ${broker90Day.length}`)
  console.log(`  broker_180_day: ${broker180Day.length}`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
