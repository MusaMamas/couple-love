import type { Question } from "../data/testsCatalog";

export type Answers = Record<string, number>; // { [questionId]: 1..5 or 1..2 for choice }

// Calculates the similarity between two answers (0..1)
// For likert5: Formula: 1 - |a-b|/4 → 0..1
// For choice: 1 if same, 0 if different
export function similarity(a: number, b: number, questionType: "likert5" | "choice") {
  if (questionType === "choice") {
    // For choice questions: exact match = 1, different = 0
    return a === b ? 1 : 0;
  }
  // For likert questions: gradual similarity based on distance
  return 1 - Math.min(Math.abs(a - b), 4) / 4;
}


export function breakdownForOne(
  questions: Question[],
  userA: Answers,
  userB: Answers
) {
  let sum = 0;
  let wSum = 0;
  const topicMap: Record<string, number[]> = {};
  
  for (const q of questions) {
    const a = userA[q.id];
    const b = userB[q.id];
    
    // Skip unanswered questions
    if (a == null || b == null) continue;
    
    const w = q.weight ?? 1;
    const s = similarity(a, b, q.type);
    
    sum += w * s;
    wSum += w;
    
    topicMap[q.topic] = topicMap[q.topic] || [];
    topicMap[q.topic].push(s);
  }
  
  // Overall compatibility score (0-100%)
  const score = Math.round(100 * (sum / Math.max(1, wSum)));
  
  // Topic breakdown
  const breakdown: Record<string, number> = {};
  Object.entries(topicMap).forEach(([k, arr]) => {
    breakdown[k] = Math.round(
      100 * arr.reduce((p, c) => p + c, 0) / Math.max(1, arr.length)
    );
  });
  
  return { score, breakdown };
}