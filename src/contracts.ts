import { z } from 'zod';

const id = z.string().uuid();
const text = z.string().trim().min(1).max(8000);
export const inputs = {
  study_import: z.strictObject({ requestId: id, path: z.string().min(1).max(1024), title: text }),
  study_add_item: z.strictObject({ requestId: id, materialId: id, topic: text, prompt: text,
    answer: text, quote: text, keyOrigin: z.enum(['ai_generated', 'human_reviewed']) }),
  study_get_item: z.strictObject({ itemId: id }),
  study_answer: z.strictObject({ requestId: id, itemId: id, response: text }),
  study_progress: z.strictObject({ courseId: id }),
};
export const outputs = {
  study_import: z.strictObject({ courseId: id, materialId: id, path: z.string(), sha256: z.string(), content: z.string() }),
  study_add_item: z.strictObject({ itemId: id }),
  study_get_item: z.strictObject({ itemId: id, topic: z.string(), prompt: z.string(), quote: z.string(), path: z.string(), keyOrigin: z.enum(['ai_generated','human_reviewed']) }),
  study_answer: z.strictObject({ attemptId: id, correct: z.boolean(), evidence: z.literal('answer_key_match'),
    keyOrigin: z.enum(['ai_generated','human_reviewed']), graderVersion: z.literal('text-v1'), streak: z.number().int().nonnegative(), dueAt: z.iso.datetime() }),
  study_progress: z.strictObject({ courseId: id, items: z.array(z.strictObject({ itemId: id, topic: z.string(), prompt: z.string(), attempts: z.number().int(), streak: z.number().int(), dueAt: z.iso.datetime().nullable() })) }),
};
export type ToolName = keyof typeof inputs;
export type Input<K extends ToolName> = z.infer<(typeof inputs)[K]>;
export type Output<K extends ToolName> = z.infer<(typeof outputs)[K]>;

export class StudyError extends Error {
  code: string;
  constructor(code: string) { super(code); this.code = code; }
}
