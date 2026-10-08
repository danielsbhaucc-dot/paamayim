/** אחסון מקומי: קבצים בריפו שעל המחשב. כתיבה אטומית (קובץ זמני + rename). */
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { assertAllowed } from '../paths';
import type { Change, Storage } from './types';

export function localStorage(root: string): Storage {
  const base = path.resolve(root);
  const abs = async (rel: string, kind: 'file' | 'dir' = 'file') => {
    assertAllowed(rel, kind);
    const p = path.resolve(base, rel);
    if (!p.startsWith(base + path.sep)) throw new Error('נתיב מחוץ לריפו');
    // הגנה מקישור סמלי שמוביל החוצה
    const parent = path.dirname(p);
    try {
      const real = await fs.realpath(parent);
      const realBase = await fs.realpath(base);
      if (real !== realBase && !real.startsWith(realBase + path.sep)) throw new Error('נתיב מחוץ לריפו');
    } catch (e: any) {
      if (e?.code !== 'ENOENT') throw e;
    }
    return p;
  };
  return {
    kind: 'local',
    describe: () => `local:${base}`,
    async read(rel) {
      try {
        return await fs.readFile(await abs(rel));
      } catch (e: any) {
        if (e?.code === 'ENOENT') return null;
        throw e;
      }
    },
    async list(dir) {
      try {
        return (await fs.readdir(await abs(dir, 'dir'), { withFileTypes: true })).filter((d) => d.isFile()).map((d) => d.name);
      } catch (e: any) {
        if (e?.code === 'ENOENT') return [];
        throw e;
      }
    },
    async write(changes: Change[]) {
      for (const ch of changes) {
        const p = await abs(ch.path);
        if (ch.content == null) {
          await fs.rm(p, { force: true });
          continue;
        }
        await fs.mkdir(path.dirname(p), { recursive: true });
        const tmp = `${p}.${crypto.randomBytes(4).toString('hex')}.tmp`;
        await fs.writeFile(tmp, ch.content);
        await fs.rename(tmp, p);
      }
      return {};
    },
  };
}
