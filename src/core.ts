/** Pure rules: comparison is evidence about a key, not subject correctness. */
export const normalize = (value: string) => value.normalize('NFC').trim().toLowerCase();
export function grade(response: string, answer: string) { return normalize(response) === normalize(answer); }
export function schedule(correct: boolean, previousStreak: number, now: Date) {
  const streak = correct ? previousStreak + 1 : 0;
  const days = correct ? [1, 3, 7, 14, 30][Math.min(streak - 1, 4)] : 1;
  return { streak, dueAt: new Date(now.getTime() + days * 86400000).toISOString() };
}
