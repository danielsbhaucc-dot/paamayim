// פיתוח: שרת API עם רענון (tsx watch, פורט 8787) + Vite עם HMR (פורט 5173, מפנה /api לשרת)
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ADMIN = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const win = process.platform === 'win32';
const procs = [
  spawn(process.execPath, ['--import', 'tsx', '--watch', 'server/node.ts'], { cwd: ADMIN, stdio: 'inherit' }),
  spawn('npx', ['vite', '--port', '5173', '--strictPort'], { cwd: ADMIN, stdio: 'inherit', shell: win }),
];
const stop = () => procs.forEach((p) => p.kill());
for (const p of procs) p.on('exit', (c) => (stop(), process.exit(c ?? 0)));
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
console.log('\n  ממשק: http://localhost:5173  ·  API: http://127.0.0.1:8787\n');
