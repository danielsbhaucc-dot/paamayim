#!/usr/bin/env node
// מריץ את בדיקות התאריכים: אורז את ה-TS עם esbuild ומריץ node --test באזור הזמן של ישראל.
import { build } from 'esbuild';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';

fs.mkdirSync('.cache', { recursive: true });
await build({
  entryPoints: ['scripts/tests/dates.test.mts', 'scripts/tests/status.test.mts', 'scripts/tests/parashaColors.test.mts', 'scripts/tests/leyning.test.mts', 'scripts/tests/schedule.test.mts', 'scripts/tests/alignment.test.mts', 'scripts/tests/parentLink.test.mts'],
  bundle: true,
  platform: 'node',
  format: 'esm',
  outdir: '.cache/tests',
  outExtension: { '.js': '.mjs' },
  logLevel: 'warning',
  // react-native לא נדרש לבדיקות; מונעים מ-esbuild לנסות לארוז אותו
  external: ['react-native', 'expo-*'],
  // ערכות platform-core (packages/@core): ייבוא חשוף @core/<kit> בין הערכות
  alias: { '@core/crypto': './packages/@core/crypto/src/index.ts', '@core/audit': './packages/@core/audit/src/index.ts' },
});
const r = spawnSync(process.execPath, ['--test', '--test-reporter=spec', '.cache/tests/dates.test.mjs', '.cache/tests/status.test.mjs', '.cache/tests/parashaColors.test.mjs', '.cache/tests/leyning.test.mjs', '.cache/tests/schedule.test.mjs', '.cache/tests/alignment.test.mjs', '.cache/tests/parentLink.test.mjs'], {
  stdio: 'inherit',
  env: { ...process.env, TZ: 'Asia/Jerusalem' },
});
process.exit(r.status ?? 1);
