export type DimensionScores = {
  autonomyScore: number
  competenceScore: number
  relatednessScore: number
  gritScore: number
  selfRegScore: number
  eiScore: number
  overallScore: number
}

const DIMENSIONS: Record<keyof Omit<DimensionScores, "overallScore">, string[]> = {
  autonomyScore:    ["AUT_A1","AUT_A2","AUT_A3","AUT_A4","AUT_A5","AUT_A6"],
  competenceScore:  ["COM_A1","COM_A2","COM_A3","COM_A4","COM_A5","COM_A6"],
  relatednessScore: ["REL_A1","REL_A2","REL_A3","REL_A4","REL_A5","REL_A6"],
  gritScore:        ["GRIT_A1","GRIT_A2","GRIT_A3","GRIT_A4","GRIT_A5","GRIT_A6"],
  selfRegScore:     ["SR_A1","SR_A2","SR_A3","SR_A4","SR_A5","SR_A6"],
  eiScore:          ["EI_A1","EI_A2","EI_A3","EI_A4","EI_A5","EI_A6"],
}

function likertToScore(answers: string[]): number {
  const nums = answers.map(a => parseInt(a, 10)).filter(n => n >= 1 && n <= 5)
  if (nums.length === 0) return 0
  const avg = nums.reduce((s, n) => s + n, 0) / nums.length
  return Math.round(((avg - 1) / 4) * 1000) / 10
}

export function calculateScores(
  responses: { questionId: string; answer: string }[]
): DimensionScores {
  const map = new Map(responses.map(r => [r.questionId, r.answer]))

  const autonomyScore    = likertToScore(DIMENSIONS.autonomyScore.map(id => map.get(id) ?? ""))
  const competenceScore  = likertToScore(DIMENSIONS.competenceScore.map(id => map.get(id) ?? ""))
  const relatednessScore = likertToScore(DIMENSIONS.relatednessScore.map(id => map.get(id) ?? ""))
  const gritScore        = likertToScore(DIMENSIONS.gritScore.map(id => map.get(id) ?? ""))
  const selfRegScore     = likertToScore(DIMENSIONS.selfRegScore.map(id => map.get(id) ?? ""))
  const eiScore          = likertToScore(DIMENSIONS.eiScore.map(id => map.get(id) ?? ""))

  const overallScore = Math.round(
    ((autonomyScore + competenceScore + relatednessScore + gritScore + selfRegScore + eiScore) / 6) * 10
  ) / 10

  return { autonomyScore, competenceScore, relatednessScore, gritScore, selfRegScore, eiScore, overallScore }
}
