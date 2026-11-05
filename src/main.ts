import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { serveStdio } from '@modelcontextprotocol/server/stdio';
import { openDatabase } from './database.ts';
import { StudyService } from './service.ts';
import { createServer } from './server.ts';

const materialRoot = process.env.STUDY_MATERIAL_ROOT;
if (!materialRoot) { console.error('Set STUDY_MATERIAL_ROOT to an explicitly selected material directory.'); process.exit(1); }
const path = resolve(process.env.STUDY_DB_PATH ?? '.study-os/study.sqlite');
mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
const db = openDatabase(path);
const service = new StudyService({ db, materialRoot });
const server = serveStdio(() => createServer(service));
process.once('exit', () => db.close());
for (const signal of ['SIGINT', 'SIGTERM'] as const) process.on(signal, () => { void server.close(); });
