import type { DatabaseSync } from 'node:sqlite';
import { randomUUID } from 'node:crypto';
import { inputs, outputs, StudyError, type Input, type ToolName, type Output } from './contracts.ts';
import { readMaterial } from './materials.ts';
import { grade, schedule } from './core.ts';

type Dependencies = { db: DatabaseSync; materialRoot: string; now?: () => Date; id?: () => string };
export class StudyService {
  db: DatabaseSync;
  root: string;
  now: () => Date;
  id: () => string;
  constructor({ db, materialRoot, now = () => new Date(), id = randomUUID }: Dependencies) {
    this.db = db; this.root = materialRoot; this.now = now; this.id = id;
  }
  private replay<K extends ToolName>(operation: K, input: Input<K> & { requestId: string }): Output<K> | undefined {
    const row = this.db.prepare('SELECT * FROM requests WHERE id = ?').get(input.requestId);
    if (!row) return undefined;
    if (row.operation !== operation || row.payload !== JSON.stringify(input)) throw new StudyError('REQUEST_CONFLICT');
    return outputs[operation].parse(JSON.parse(row.result as string)) as Output<K>;
  }
  private mutate<K extends ToolName>(operation: K, input: Input<K> & { requestId: string }, action: () => Output<K>): Output<K> {
    this.db.exec('BEGIN IMMEDIATE');
    try {
      const existing = this.replay(operation, input);
      if (existing) { this.db.exec('COMMIT'); return existing; }
      const result = outputs[operation].parse(action()) as Output<K>;
      this.db.prepare('INSERT INTO requests VALUES (?, ?, ?, ?)').run(input.requestId, operation, JSON.stringify(input), JSON.stringify(result));
      this.db.exec('COMMIT');
      return result;
    } catch (error) { this.db.exec('ROLLBACK'); throw error; }
  }
  async importMaterial(raw: unknown) {
    const input = inputs.study_import.parse(raw);
    const replay = this.replay('study_import', input);
    if (replay) return replay;
    const material = await readMaterial(this.root, input.path);
    return this.mutate('study_import', input, () => {
      const courseId = this.id(), materialId = this.id();
      this.db.prepare('INSERT INTO courses VALUES (?, ?, ?)').run(courseId, input.title, this.now().toISOString());
      this.db.prepare('INSERT INTO materials VALUES (?, ?, ?, ?, ?)').run(materialId, courseId, material.path, material.sha256, material.content);
      return { courseId, materialId, ...material };
    });
  }
  addItem(raw: unknown) {
    const input = inputs.study_add_item.parse(raw);
    return this.mutate('study_add_item', input, () => {
      const material = this.db.prepare('SELECT content FROM materials WHERE id = ?').get(input.materialId);
      if (!material) throw new StudyError('NOT_FOUND');
      if (!(material.content as string).includes(input.quote)) throw new StudyError('SOURCE_QUOTE_MISSING');
      const itemId = this.id();
      this.db.prepare('INSERT INTO items VALUES (?, ?, ?, ?, ?, ?, ?)').run(itemId, input.materialId, input.topic, input.prompt, input.answer, input.quote, input.keyOrigin);
      return { itemId };
    });
  }
  getItem(raw: unknown) {
    const { itemId } = inputs.study_get_item.parse(raw);
    const row = this.db.prepare(`SELECT i.id AS itemId, i.topic, i.prompt, i.quote, i.key_origin AS keyOrigin, m.path
      FROM items i JOIN materials m ON m.id = i.material_id WHERE i.id = ?`).get(itemId);
    if (!row) throw new StudyError('NOT_FOUND');
    return outputs.study_get_item.parse(row);
  }
  answer(raw: unknown) {
    const input = inputs.study_answer.parse(raw);
    return this.mutate('study_answer', input, () => {
      const item = this.db.prepare('SELECT answer, key_origin FROM items WHERE id = ?').get(input.itemId);
      if (!item) throw new StudyError('NOT_FOUND');
      const previous = this.db.prepare('SELECT streak FROM reviews WHERE item_id = ?').get(input.itemId);
      const now = this.now();
      const correct = grade(input.response, item.answer as string);
      const review = schedule(correct, Number(previous?.streak ?? 0), now);
      const result = outputs.study_answer.parse({ attemptId: this.id(), correct, evidence: 'answer_key_match', keyOrigin: item.key_origin, graderVersion: 'text-v1', ...review });
      this.db.prepare('INSERT INTO attempts VALUES (?, ?, ?, ?, ?, ?, ?)').run(result.attemptId, input.itemId, input.response, Number(correct), result.evidence, result.graderVersion, now.toISOString());
      this.db.prepare(`INSERT INTO reviews VALUES (?, ?, ?) ON CONFLICT(item_id)
        DO UPDATE SET streak = excluded.streak, due_at = excluded.due_at`).run(input.itemId, review.streak, review.dueAt);
      return result;
    });
  }
  progress(raw: unknown) {
    const { courseId } = inputs.study_progress.parse(raw);
    if (!this.db.prepare('SELECT id FROM courses WHERE id = ?').get(courseId)) throw new StudyError('NOT_FOUND');
    const items = this.db.prepare(`SELECT i.id AS itemId, i.topic, i.prompt,
      (SELECT COUNT(*) FROM attempts a WHERE a.item_id = i.id) AS attempts,
      COALESCE(r.streak, 0) AS streak, r.due_at AS dueAt FROM items i
      JOIN materials m ON m.id = i.material_id LEFT JOIN reviews r ON r.item_id = i.id
      WHERE m.course_id = ? ORDER BY r.due_at, i.id`).all(courseId);
    return outputs.study_progress.parse({ courseId, items });
  }
}
