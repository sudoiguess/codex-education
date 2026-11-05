import { McpServer } from '@modelcontextprotocol/server';
import { ZodError } from 'zod';
import { inputs, outputs, StudyError, type ToolName } from './contracts.ts';
import type { StudyService } from './service.ts';

export function createServer(service: StudyService) {
  const server = new McpServer({ name: 'study-os', version: '0.1.0' });
  const definitions = [
    ['study_import', 'Import one selected local Markdown/text file; returns its snapshot to the host.', (x: unknown) => service.importMaterial(x), false],
    ['study_add_item', 'Save a source-backed recall question and declared key provenance.', (x: unknown) => service.addItem(x), false],
    ['study_get_item', 'Read a recall prompt and citation without its answer key.', (x: unknown) => service.getItem(x), true],
    ['study_answer', 'Compare an answer with a key; atomically record attempt and review. This is not verified subject correctness.', (x: unknown) => service.answer(x), false],
    ['study_progress', 'Read item attempt counts and review dates for one course.', (x: unknown) => service.progress(x), true],
  ] as const;
  for (const [name, description, handler, readOnlyHint] of definitions) {
    register(name, description, handler, readOnlyHint);
  }
  function register(name: ToolName, description: string, handler: (x: unknown) => unknown | Promise<unknown>, readOnlyHint: boolean) {
    server.registerTool(name, { description, inputSchema: inputs[name], outputSchema: outputs[name],
      annotations: { readOnlyHint, destructiveHint: false, idempotentHint: true, openWorldHint: false } },
    async (args: unknown) => {
      try {
        const result = outputs[name].parse(await handler(args));
        return { content: [{ type: 'text' as const, text: JSON.stringify(result) }], structuredContent: result };
      } catch (error) {
        const code = error instanceof StudyError ? error.code : error instanceof ZodError ? 'INVALID_INPUT' : 'INTERNAL_ERROR';
        return { isError: true, content: [{ type: 'text' as const, text: code }] };
      }
    });
  }
  return server;
}
