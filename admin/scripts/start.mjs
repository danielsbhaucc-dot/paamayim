// פקודה אחת: npm run admin (מהשורש) — מתקין, יוצר admin/.env עם סיסמה, בונה, מפעיל ופותח דפדפן.
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { askNewPassword, hashPassword, randomSecret } from './lib.mjs';

const ADMIN = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const win = process.platform === 'win32';
const args = new Set(process.argv.slice(2));
const step = (s) => console.log(`\n▸ ${s}`);
const fail = (s) => {
  console.error(`\n✖ ${s}\n`);
  process.exit(1);
};

const [maj, min] = process.versions.node.split('.').map(Number);
if (maj < 20 || (maj === 20 && min < 19)) fail(`צריך Node 20.19 ומעלה (יש ${process.versions.node}). הורדה: https://nodejs.org`);

const run = (cmd, a) => {
  const r = spawnSync(cmd, a, { cwd: ADMIN, stdio: 'inherit', shell: win });
  if (r.status !== 0) fail(`הפקודה נכשלה: ${cmd} ${a.join(' ')}`);
};

// 1. התקנה (פעם ראשונה, או כשה-lock השתנה)
const lock = path.join(ADMIN, 'package-lock.json');
const stamp = path.join(ADMIN, 'node_modules', '.package-lock.json');
if (!fs.existsSync(stamp) || fs.statSync(lock).mtimeMs > fs.statSync(stamp).mtimeMs + 1000) {
  step('מתקין את תלויות האדמין (פעם ראשונה לוקח דקה)…');
  run('npm', ['ci', '--no-audit', '--no-fund']);
}

// 2. admin/.env
const envFile = path.join(ADMIN, '.env');
if (!fs.existsSync(envFile)) {
  step('יוצר admin/.env');
  let text = fs.readFileSync(path.join(ADMIN, '.env.example'), 'utf8');
  const pw = await askNewPassword();
  text = text.replace(/^ADMIN_PASSWORD_HASH=.*$/m, `ADMIN_PASSWORD_HASH=${hashPassword(pw)}`).replace(/^SESSION_SECRET=.*$/m, `SESSION_SECRET=${randomSecret()}`);
  fs.writeFileSync(envFile, text, { mode: 0o600 });
  console.log('  ✓ נשמר. מפתחות AI מוסיפים ב-admin/.env (DEEPSEEK_API_KEY / OPENROUTER_API_KEY).');
} else if (!/^ADMIN_PASSWORD_HASH=\S+/m.test(fs.readFileSync(envFile, 'utf8')) && !/^ADMIN_PASSWORD=\S+/m.test(fs.readFileSync(envFile, 'utf8'))) {
  step('אין סיסמה ב-admin/.env — נגדיר עכשיו');
  const pw = await askNewPassword();
  let text = fs.readFileSync(envFile, 'utf8');
  text = /^ADMIN_PASSWORD_HASH=/m.test(text) ? text.replace(/^ADMIN_PASSWORD_HASH=.*$/m, `ADMIN_PASSWORD_HASH=${hashPassword(pw)}`) : `${text}\nADMIN_PASSWORD_HASH=${hashPassword(pw)}\n`;
  if (!/^SESSION_SECRET=\S{32,}/m.test(text)) text = /^SESSION_SECRET=/m.test(text) ? text.replace(/^SESSION_SECRET=.*$/m, `SESSION_SECRET=${randomSecret()}`) : `${text}\nSESSION_SECRET=${randomSecret()}\n`;
  fs.writeFileSync(envFile, text, { mode: 0o600 });
}

// 3. בניית הממשק
if (!args.has('--no-build')) {
  step('בונה את הממשק…');
  run('npm', ['run', 'build', '--silent', '--', '--logLevel', 'warn']);
}

// 4. הפעלה
step('מפעיל את השרת (Ctrl+C לעצירה)');
const server = spawn(process.execPath, ['--import', 'tsx', 'server/node.ts'], { cwd: ADMIN, stdio: 'inherit' });
server.on('exit', (code) => process.exit(code ?? 0));
for (const sig of ['SIGINT', 'SIGTERM']) process.on(sig, () => server.kill(sig));

// 5. פתיחת דפדפן כשהשרת מוכן
if (!args.has('--no-open') && !process.env.CI) {
  const env = Object.fromEntries(
    fs
      .readFileSync(envFile, 'utf8')
      .split(/\r?\n/)
      .map((l) => l.match(/^\s*(HOST|PORT)\s*=\s*(\S+)/))
      .filter(Boolean)
      .map((m) => [m[1], m[2]])
  );
  const host = process.env.HOST ?? env.HOST ?? '127.0.0.1';
  const url = `http://${host === '0.0.0.0' ? 'localhost' : host}:${process.env.PORT ?? env.PORT ?? 8787}`;
  for (let i = 0; i < 40; i++) {
    await new Promise((r) => setTimeout(r, 250));
    const ok = await fetch(`${url}/api/health`).then((r) => r.ok, () => false);
    if (ok) {
      const opener = win ? ['cmd', ['/c', 'start', '', url]] : process.platform === 'darwin' ? ['open', [url]] : ['xdg-open', [url]];
      spawn(opener[0], opener[1], { stdio: 'ignore', detached: true }).on('error', () => {}).unref();
      break;
    }
  }
}
