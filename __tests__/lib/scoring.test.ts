import { calculateScores } from "@/lib/scoring"

const ALL_SCORED_IDS = [
  "AUT_A1","AUT_A2","AUT_A3","AUT_A4","AUT_A5","AUT_A6",
  "COM_A1","COM_A2","COM_A3","COM_A4","COM_A5","COM_A6",
  "REL_A1","REL_A2","REL_A3","REL_A4","REL_A5","REL_A6",
  "GRIT_A1","GRIT_A2","GRIT_A3","GRIT_A4","GRIT_A5","GRIT_A6",
  "SR_A1","SR_A2","SR_A3","SR_A4","SR_A5","SR_A6",
  "EI_A1","EI_A2","EI_A3","EI_A4","EI_A5","EI_A6",
]

function makeResponses(answer: string) {
  return ALL_SCORED_IDS.map(questionId => ({ questionId, answer }))
}

describe("calculateScores", () => {
  it("returns 100 for all max (5) answers", () => {
    const scores = calculateScores(makeResponses("5"))
    expect(scores.autonomyScore).toBe(100)
    expect(scores.competenceScore).toBe(100)
    expect(scores.relatednessScore).toBe(100)
    expect(scores.gritScore).toBe(100)
    expect(scores.selfRegScore).toBe(100)
    expect(scores.eiScore).toBe(100)
    expect(scores.overallScore).toBe(100)
  })

  it("returns 0 for all min (1) answers", () => {
    const scores = calculateScores(makeResponses("1"))
    expect(scores.autonomyScore).toBe(0)
    expect(scores.overallScore).toBe(0)
  })

  it("returns 50 for all midpoint (3) answers", () => {
    const scores = calculateScores(makeResponses("3"))
    expect(scores.autonomyScore).toBe(50)
    expect(scores.overallScore).toBe(50)
  })

  it("calculates per-dimension scores independently", () => {
    const mixed = [
      ...["AUT_A1","AUT_A2","AUT_A3","AUT_A4","AUT_A5","AUT_A6"].map(id => ({ questionId: id, answer: "5" })),
      ...["COM_A1","COM_A2","COM_A3","COM_A4","COM_A5","COM_A6"].map(id => ({ questionId: id, answer: "1" })),
      ...["REL_A1","REL_A2","REL_A3","REL_A4","REL_A5","REL_A6"].map(id => ({ questionId: id, answer: "3" })),
      ...["GRIT_A1","GRIT_A2","GRIT_A3","GRIT_A4","GRIT_A5","GRIT_A6"].map(id => ({ questionId: id, answer: "3" })),
      ...["SR_A1","SR_A2","SR_A3","SR_A4","SR_A5","SR_A6"].map(id => ({ questionId: id, answer: "3" })),
      ...["EI_A1","EI_A2","EI_A3","EI_A4","EI_A5","EI_A6"].map(id => ({ questionId: id, answer: "3" })),
    ]
    const scores = calculateScores(mixed)
    expect(scores.autonomyScore).toBe(100)
    expect(scores.competenceScore).toBe(0)
    expect(scores.relatednessScore).toBe(50)
    expect(scores.gritScore).toBe(50)
  })

  it("ignores non-scored question IDs", () => {
    const responses = [
      ...makeResponses("5"),
      { questionId: "CTX_A1", answer: "1" },
      { questionId: "UNM_A1", answer: "1" },
    ]
    const scores = calculateScores(responses)
    expect(scores.autonomyScore).toBe(100)
  })
})
