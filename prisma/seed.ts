import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import * as dotenv from "dotenv"
dotenv.config()

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
})

const questions = [
  // ── Agent ──────────────────────────────────────────────────────────────
  // Autonomy
  { id: "AUT_A1", role: "agent", dimension: "AUT", sortOrder: 1,  text: "I perform better when I can decide how to approach my work." },
  { id: "AUT_A2", role: "agent", dimension: "AUT", sortOrder: 2,  text: "I become less engaged when others closely define how my work should be done." },
  { id: "AUT_A3", role: "agent", dimension: "AUT", sortOrder: 3,  text: "I prefer having discretion in how I organize my responsibilities." },
  { id: "AUT_A4", role: "agent", dimension: "AUT", sortOrder: 4,  text: "I am more motivated when I can adapt processes to fit my style." },
  { id: "AUT_A5", role: "agent", dimension: "AUT", sortOrder: 5,  text: "I am most energized when I have latitude in how I pursue goals." },
  { id: "AUT_A6", role: "agent", dimension: "AUT", sortOrder: 6,  text: "I work best when I feel trusted to make decisions independently." },
  // Competence
  { id: "COM_A1", role: "agent", dimension: "COM", sortOrder: 7,  text: "I feel unsettled if I go long periods without specific feedback on my work." },
  { id: "COM_A2", role: "agent", dimension: "COM", sortOrder: 8,  text: "I lose motivation when I am not steadily improving my skills." },
  { id: "COM_A3", role: "agent", dimension: "COM", sortOrder: 9,  text: "I prefer roles that give me opportunities to be challenged beyond my current skill level." },
  { id: "COM_A4", role: "agent", dimension: "COM", sortOrder: 10, text: "Without clear benchmarks for success I am unsure how well I am doing." },
  { id: "COM_A5", role: "agent", dimension: "COM", sortOrder: 11, text: "I am more engaged when I receive direct input on how to improve my work." },
  { id: "COM_A6", role: "agent", dimension: "COM", sortOrder: 12, text: "Routine work without opportunities to grow becomes draining for me." },
  // Relatedness
  { id: "REL_A1", role: "agent", dimension: "REL", sortOrder: 13, text: "Extended periods of working independently reduce my motivation." },
  { id: "REL_A2", role: "agent", dimension: "REL", sortOrder: 14, text: "I am more productive when I feel connected to the people around me." },
  { id: "REL_A3", role: "agent", dimension: "REL", sortOrder: 15, text: "I prefer environments where collaboration is common." },
  { id: "REL_A4", role: "agent", dimension: "REL", sortOrder: 16, text: "When I do not feel understood by colleagues my engagement drops." },
  { id: "REL_A5", role: "agent", dimension: "REL", sortOrder: 17, text: "I seek regular interaction with others rather than working mostly on my own." },
  { id: "REL_A6", role: "agent", dimension: "REL", sortOrder: 18, text: "Feeling socially disconnected makes it harder for me to stay energized." },
  // Grit
  { id: "GRIT_A1", role: "agent", dimension: "GRIT", sortOrder: 19, text: "I continue working toward goals even when progress is slow or unclear." },
  { id: "GRIT_A2", role: "agent", dimension: "GRIT", sortOrder: 20, text: "When I experience repeated setbacks I stay engaged rather than pulling back." },
  { id: "GRIT_A3", role: "agent", dimension: "GRIT", sortOrder: 21, text: "I am comfortable putting in consistent effort for extended periods before seeing results." },
  { id: "GRIT_A4", role: "agent", dimension: "GRIT", sortOrder: 22, text: "After a significant disappointment I return to my work quickly." },
  { id: "GRIT_A5", role: "agent", dimension: "GRIT", sortOrder: 23, text: "I maintain my effort even when external rewards are delayed." },
  { id: "GRIT_A6", role: "agent", dimension: "GRIT", sortOrder: 24, text: "When outcomes stall I adjust my approach rather than disengage." },
  // Self-Regulation
  { id: "SR_A1", role: "agent", dimension: "SR", sortOrder: 25, text: "I follow a consistent structure when completing my responsibilities." },
  { id: "SR_A2", role: "agent", dimension: "SR", sortOrder: 26, text: "I begin important tasks at planned times rather than waiting until I feel motivated." },
  { id: "SR_A3", role: "agent", dimension: "SR", sortOrder: 27, text: "I protect scheduled work time from distractions." },
  { id: "SR_A4", role: "agent", dimension: "SR", sortOrder: 28, text: "I complete necessary tasks even when they are repetitive or tedious." },
  { id: "SR_A5", role: "agent", dimension: "SR", sortOrder: 29, text: "I maintain systems or routines even when no one is monitoring me." },
  { id: "SR_A6", role: "agent", dimension: "SR", sortOrder: 30, text: "My weekly productivity reflects planned execution rather than last-minute effort." },
  // Emotional Intelligence
  { id: "EI_A1", role: "agent", dimension: "EI", sortOrder: 31, text: "I notice subtle emotional changes in others during conversations." },
  { id: "EI_A2", role: "agent", dimension: "EI", sortOrder: 32, text: "I remain calm during tense or emotionally charged interactions." },
  { id: "EI_A3", role: "agent", dimension: "EI", sortOrder: 33, text: "I am aware of my emotional reactions while I am experiencing them." },
  { id: "EI_A4", role: "agent", dimension: "EI", sortOrder: 34, text: "I can receive criticism without becoming defensive." },
  { id: "EI_A5", role: "agent", dimension: "EI", sortOrder: 35, text: "After a stressful interaction I regain emotional balance quickly." },
  { id: "EI_A6", role: "agent", dimension: "EI", sortOrder: 36, text: "I adjust how I communicate depending on the emotional state of the other person." },

  // ── Broker ─────────────────────────────────────────────────────────────
  // Autonomy
  { id: "AUT_B1", role: "broker", dimension: "AUT", sortOrder: 1,  text: "This brokerage allows individuals to decide how they approach their work." },
  { id: "AUT_B2", role: "broker", dimension: "AUT", sortOrder: 2,  text: "At this brokerage work is not closely defined in a way that limits individual discretion." },
  { id: "AUT_B3", role: "broker", dimension: "AUT", sortOrder: 3,  text: "Individuals here are given discretion in how they organize their responsibilities." },
  { id: "AUT_B4", role: "broker", dimension: "AUT", sortOrder: 4,  text: "This brokerage allows people to adapt processes to fit their work style." },
  { id: "AUT_B5", role: "broker", dimension: "AUT", sortOrder: 5,  text: "People here have latitude in how they pursue goals." },
  { id: "AUT_B6", role: "broker", dimension: "AUT", sortOrder: 6,  text: "This brokerage demonstrates trust in individuals to make decisions independently." },
  // Competence
  { id: "COM_B1", role: "broker", dimension: "COM", sortOrder: 7,  text: "This brokerage provides specific actionable feedback that helps people understand how they are performing." },
  { id: "COM_B2", role: "broker", dimension: "COM", sortOrder: 8,  text: "People here have regular opportunities to improve and develop their skills." },
  { id: "COM_B3", role: "broker", dimension: "COM", sortOrder: 9,  text: "This brokerage offers roles that challenge individuals beyond their current skill level." },
  { id: "COM_B4", role: "broker", dimension: "COM", sortOrder: 10, text: "Clear benchmarks for success are communicated to people who work here." },
  { id: "COM_B5", role: "broker", dimension: "COM", sortOrder: 11, text: "Individuals receive direct actionable input on how to improve their performance." },
  { id: "COM_B6", role: "broker", dimension: "COM", sortOrder: 12, text: "This brokerage provides growth opportunities rather than leaving roles static over time." },
  // Relatedness
  { id: "REL_B1", role: "broker", dimension: "REL", sortOrder: 13, text: "This brokerage fosters meaningful connection among the people who work here." },
  { id: "REL_B2", role: "broker", dimension: "REL", sortOrder: 14, text: "People at this brokerage report feeling supported by those around them." },
  { id: "REL_B3", role: "broker", dimension: "REL", sortOrder: 15, text: "Collaboration is common here." },
  { id: "REL_B4", role: "broker", dimension: "REL", sortOrder: 16, text: "Individuals here are generally treated with respect and understanding." },
  { id: "REL_B5", role: "broker", dimension: "REL", sortOrder: 17, text: "Regular interaction among colleagues is encouraged here." },
  { id: "REL_B6", role: "broker", dimension: "REL", sortOrder: 18, text: "The social climate at this brokerage helps sustain people's energy and engagement." },
  // Grit
  { id: "GRIT_B1", role: "broker", dimension: "GRIT", sortOrder: 19, text: "Agents here are expected to maintain consistent outreach even during extended slow periods." },
  { id: "GRIT_B2", role: "broker", dimension: "GRIT", sortOrder: 20, text: "High levels of rejection are a normal and expected part of succeeding here." },
  { id: "GRIT_B3", role: "broker", dimension: "GRIT", sortOrder: 21, text: "Results here may take weeks or months to materialize despite steady effort." },
  { id: "GRIT_B4", role: "broker", dimension: "GRIT", sortOrder: 22, text: "Agents are typically responsible for generating most of their own opportunities here." },
  { id: "GRIT_B5", role: "broker", dimension: "GRIT", sortOrder: 23, text: "Monthly income here can fluctuate significantly based on individual effort." },
  { id: "GRIT_B6", role: "broker", dimension: "GRIT", sortOrder: 24, text: "Success here often requires continuing activity even when short-term results are discouraging." },
  // Self-Regulation
  { id: "SR_B1", role: "broker", dimension: "SR", sortOrder: 25, text: "Clear weekly activity expectations are defined for agents here." },
  { id: "SR_B2", role: "broker", dimension: "SR", sortOrder: 26, text: "Prospecting and follow-up routines are expected to be consistent here rather than flexible." },
  { id: "SR_B3", role: "broker", dimension: "SR", sortOrder: 27, text: "Agent performance here is regularly reviewed against defined activity benchmarks." },
  { id: "SR_B4", role: "broker", dimension: "SR", sortOrder: 28, text: "Agents here are expected to adhere closely to established processes." },
  { id: "SR_B5", role: "broker", dimension: "SR", sortOrder: 29, text: "Accountability conversations here occur at predictable intervals." },
  { id: "SR_B6", role: "broker", dimension: "SR", sortOrder: 30, text: "Deviation from defined systems here is addressed promptly." },
  // Emotional Intelligence
  { id: "EI_B1", role: "broker", dimension: "EI", sortOrder: 31, text: "People at this brokerage often encounter emotionally intense conversations as part of the role." },
  { id: "EI_B2", role: "broker", dimension: "EI", sortOrder: 32, text: "High-stakes emotionally charged interactions are common in this environment." },
  { id: "EI_B3", role: "broker", dimension: "EI", sortOrder: 33, text: "Difficult interpersonal situations are regularly part of the work here." },
  { id: "EI_B4", role: "broker", dimension: "EI", sortOrder: 34, text: "Agents here must frequently manage strong emotional reactions from others." },
  { id: "EI_B5", role: "broker", dimension: "EI", sortOrder: 35, text: "Feedback conversations here can be direct and emotionally charged." },
  { id: "EI_B6", role: "broker", dimension: "EI", sortOrder: 36, text: "Competitive pressures here sometimes heighten interpersonal tension." },
] as const

async function main() {
  for (const q of questions) {
    await prisma.question.upsert({
      where: { id: q.id },
      update: { text: q.text, dimension: q.dimension, sortOrder: q.sortOrder },
      create: q,
    })
  }
  console.log(`Seeded ${questions.length} questions.`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
