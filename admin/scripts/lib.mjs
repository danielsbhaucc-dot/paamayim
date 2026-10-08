// עזרי הפעלה משותפים (בלי תלויות)
import crypto from 'node:crypto';
import readline from 'node:readline';

/** אותו פורמט כמו server/auth.ts → hashPassword */
export function hashPassword(password) {
  const N = 2 ** 15, r = 8, p = 1;
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(password.normalize('NFKC'), salt, 32, { N, r, p, maxmem: 64 * 1024 * 1024 });
  return `scrypt$${N}$${r}$${p}$${salt.toString('base64url')}$${hash.toString('base64url')}`;
}

export const randomSecret = () => crypto.randomBytes(36).toString('base64url');

/** שאלה עם הקלדה מוסתרת (כוכביות) — עובד גם ב-Windows */
export function askHidden(question) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    let muted = false;
    rl._writeToOutput = (s) => {
      if (!muted) rl.output.write(s);
      else if (s.includes('\n') || s.includes('\r')) rl.output.write('\n');
    };
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
    muted = true;
  });
}

export async function askNewPassword() {
  if (!process.stdin.isTTY) throw new Error('צריך טרמינל כדי להקליד סיסמה (או להגדיר ADMIN_PASSWORD_HASH ב-admin/.env)');
  for (;;) {
    const a = await askHidden('  סיסמה חדשה לאדמין (לפחות 10 תווים; ההקלדה מוסתרת): ');
    if (a.length < 10) {
      console.log('  ✖ קצרה מדי. נסו שוב.');
      continue;
    }
    const b = await askHidden('  שוב, לאימות: ');
    if (a !== b) {
      console.log('  ✖ הסיסמאות לא זהות. נסו שוב.');
      continue;
    }
    return a;
  }
}
