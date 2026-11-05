import { open, realpath } from 'node:fs/promises';
import { isAbsolute, relative, extname, resolve, sep } from 'node:path';
import { createHash } from 'node:crypto';
import { StudyError } from './contracts.ts';

const LIMIT = 128 * 1024;
/** Local trust boundary: no recursive scan, links, plugins or note writes. */
export async function readMaterial(root: string, requested: string) {
  const base = await realpath(root);
  const target = await realpath(resolve(base, requested));
  const path = relative(base, target);
  if (!path || path === '..' || path.startsWith(`..${sep}`) || isAbsolute(path)) throw new StudyError('PATH_DENIED');
  if (!['.md', '.txt'].includes(extname(target).toLowerCase())) throw new StudyError('FORMAT_DENIED');
  const file = await open(target, 'r');
  try {
    const stat = await file.stat();
    if (!stat.isFile() || stat.size > LIMIT) throw new StudyError('MATERIAL_TOO_LARGE_OR_NOT_FILE');
    const buffer = Buffer.alloc(LIMIT + 1);
    let bytesRead = 0;
    while (bytesRead < buffer.length) {
      const chunk = await file.read(buffer, bytesRead, buffer.length - bytesRead, bytesRead);
      if (chunk.bytesRead === 0) break;
      bytesRead += chunk.bytesRead;
    }
    if (bytesRead > LIMIT) throw new StudyError('MATERIAL_TOO_LARGE_OR_NOT_FILE');
    const bytes = buffer.subarray(0, bytesRead);
    let content: string;
    try { content = new TextDecoder('utf-8', { fatal: true }).decode(bytes); }
    catch { throw new StudyError('INVALID_UTF8'); }
    if (!content.trim() || content.includes('\0')) throw new StudyError('INVALID_TEXT');
    return { path, content, sha256: createHash('sha256').update(bytes).digest('hex') };
  } finally { await file.close(); }
}
