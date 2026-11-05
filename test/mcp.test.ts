import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Client } from '@modelcontextprotocol/client';
import { StdioClientTransport } from '@modelcontextprotocol/client/stdio';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import { outputs } from '../src/contracts.ts';

for (const mode of ['legacy', 'modern'] as const) test(`official MCP client completes real stdio journey (${mode}) and rejects invalid calls`, { timeout: 20000 }, async () => {
  const root = await mkdtemp(join(tmpdir(), 'study-mcp-'));
  const client = new Client({ name: 'study-test', version: '1.0.0' }, mode === 'modern'
    ? { versionNegotiation: { mode: { pin: '2026-07-28' } } } : undefined);
  const transport = new StdioClientTransport({ command: process.execPath, args: [resolve('src/main.ts')],
    env: { ...Object.fromEntries(Object.entries(process.env).filter((x): x is [string,string] => x[1] !== undefined)), STUDY_MATERIAL_ROOT: root, STUDY_DB_PATH: join(root, 'state.sqlite') }, stderr: 'pipe' });
  try {
    await writeFile(join(root, 'math.md'), 'Two plus two equals four.');
    await client.connect(transport);
    if (mode === 'modern') assert.equal(client.getNegotiatedProtocolVersion(), '2026-07-28');
    const { tools } = await client.listTools();
    assert.equal(tools.length, 5);
    assert.ok(tools.every(tool => tool.inputSchema && tool.outputSchema));
    const imported = outputs.study_import.parse((await client.callTool({ name: 'study_import', arguments: { requestId: randomUUID(), title: 'Math', path: 'math.md' } })).structuredContent);
    const item = outputs.study_add_item.parse((await client.callTool({ name: 'study_add_item', arguments: { requestId: randomUUID(), materialId: imported.materialId, topic: 'Addition', prompt: '2+2?', answer: '4', quote: 'Two plus two equals four.', keyOrigin: 'human_reviewed' } })).structuredContent);
    const prompt = await client.callTool({ name: 'study_get_item', arguments: item });
    assert.equal('answer' in outputs.study_get_item.parse(prompt.structuredContent), false);
    const answer = await client.callTool({ name: 'study_answer', arguments: { requestId: randomUUID(), itemId: item.itemId, response: '4' } });
    assert.equal(outputs.study_answer.parse(answer.structuredContent).correct, true);
    assert.deepEqual(JSON.parse((answer.content as { text: string }[])[0].text), answer.structuredContent);
    const progress = await client.callTool({ name: 'study_progress', arguments: { courseId: imported.courseId } });
    assert.equal(outputs.study_progress.parse(progress.structuredContent).items[0].attempts, 1);
    assert.equal((await client.callTool({ name: 'study_answer', arguments: { itemId: item.itemId } })).isError, true);
    const missing = await client.callTool({ name: 'study_get_item', arguments: { itemId: randomUUID() } });
    assert.equal(missing.isError, true);
    assert.equal((missing.content as { text: string }[])[0].text, 'NOT_FOUND');
    const denied = await client.callTool({ name: 'study_import', arguments: { requestId: randomUUID(), title: 'private', path: 'missing-secret.md' } });
    assert.equal((denied.content as { text: string }[])[0].text, 'INTERNAL_ERROR');
  } finally { await client.close(); await rm(root, { recursive: true, force: true }); }
});
