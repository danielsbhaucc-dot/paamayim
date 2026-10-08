#!/usr/bin/env node
// מריץ את בדיקות התאריכים: אורז את ה-TS עם esbuild ומריץ node --test באזור הזמן של ישראל.
import { build } from 'esbuild';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';

fs.mkdirSync('.cache', { recursive: true });
await build({
  entryPoints: ['scripts/tests/dates.test.mts', 'scripts/tests/status.test.mts'],
  bundle: true,
  platform: 'node',
  format: 'esm',
  outdir: '.cache/tests',
  outExtension: { '.js': '.mjs' },
  logLevel: 'warning',
  // react-native לא נדרש לבדיקות; מונעים מ-esbuild לנסות לארוז אותו
  external: ['react-native', 'expo-*'],
});
const r = spawnSync(process.execPath, ['--test', '--test-reporter=spec', '.cache/tests/dates.test.mjs', '.cache/tests/status.test.mjs'], {
  stdio: 'inherit',
  env: { ...process.env, TZ: 'Asia/Jerusalem' },
});
process.exit(r.status ?? 1);
