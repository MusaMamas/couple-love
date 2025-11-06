import type { Question } from "../data/testsCatalog";

export type Answers = Record<string, number>; // { [questionId]: 1..5 }

const toRad = (v: number) => v;

// 1 - |a-b|/4  → 0..1
export function similarity(a: number, b: number) {
  return 1 - Math.min(Math.abs(a - b), 4) / 4;
}

export function scoreSingle(answers: Answers) {
  // Valid answers are 1..5, so similarity to self is always 1
  const answered = Object.keys(answers).length;
  return Math.round((100 * answered) / Math.max(1, answered));
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
    if (a == null || b == null) continue;
    const w = q.weight ?? 1;
    const s = similarity(a, b);
    sum += w * s;
    wSum += w;
    topicMap[q.topic] = topicMap[q.topic] || [];
    topicMap[q.topic].push(s);
  }
  const score = Math.round(100 * (sum / Math.max(1, wSum)));
  const breakdown: Record<string, number> = {};
  Object.entries(topicMap).forEach(([k, arr]) => {
    breakdown[k] = Math.round(
      100 * arr.reduce((p, c) => p + c, 0) / Math.max(1, arr.length)
    );
  });
  return { score, breakdown };
}
