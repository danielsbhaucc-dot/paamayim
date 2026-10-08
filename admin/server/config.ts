/**
 * הגדרות השרת — נטענות רק מ-admin/.env ומשתני סביבה. שום מפתח לא נשלח לדפדפן.
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ADMIN_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const REPO_ROOT = path.resolve(ADMIN_DIR, '..');

export function loadEnvFile(file = path.join(ADMIN_DIR, '.env')) {
  if (!fs.existsSync(file)) return;
  for (const raw of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq < 1) continue;
    const key = line.slice(0, eq).trim();
    let val = line.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) val = val.slice(1, -1);
    if (process.env[key] === undefined) process.env[key] = val;
  }
}

export type Config = {
  host: string;
  port: number;
  storage: 'local' | 'github';
  repoRoot: string;
  github?: { token: string; repo: string; branch: string };
  passwordHash?: string;
  password?: string;
  sessionSecret: string;
  sessionSecretEphemeral: boolean;
  apiToken?: string;
  secureCookies: boolean;
  allowedOrigins: string[];
  /** מאחורי proxy (Render/Fly/Cloudflare Tunnel): IP אמיתי מ-X-Forwarded-For */
  trustProxy: boolean;
  ai: {
    mock: boolean;
    deepseekKey?: string;
    openrouterKey?: string;
    defaultProvider: 'deepseek' | 'openrouter';
    deepseekModel: string;
    openrouterModel: string;
    maxJobUsd: number;
  };
};

export function readConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const storage = env.STORAGE === 'github' ? 'github' : 'local';
  const secret = env.SESSION_SECRET ?? '';
  const ephemeral = secret.length < 32;
  const host = env.HOST || '127.0.0.1';
  const cfg: Config = {
    host,
    port: Number(env.PORT || 8787),
    storage,
    repoRoot: env.REPO_ROOT ? path.resolve(env.REPO_ROOT) : REPO_ROOT,
    passwordHash: env.ADMIN_PASSWORD_HASH || undefined,
    password: env.ADMIN_PASSWORD || undefined,
    sessionSecret: ephemeral ? crypto.randomBytes(32).toString('hex') : secret,
    sessionSecretEphemeral: ephemeral,
    apiToken: env.ADMIN_API_TOKEN && env.ADMIN_API_TOKEN.length >= 32 ? env.ADMIN_API_TOKEN : undefined,
    secureCookies: env.COOKIE_SECURE ? env.COOKIE_SECURE === '1' : env.NODE_ENV === 'production',
    trustProxy: env.TRUST_PROXY === '1',
    allowedOrigins: (env.ALLOWED_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean),
    ai: {
      mock: env.AI_MOCK === '1',
      deepseekKey: env.DEEPSEEK_API_KEY || undefined,
      openrouterKey: env.OPENROUTER_API_KEY || undefined,
      defaultProvider: env.AI_DEFAULT_PROVIDER === 'openrouter' ? 'openrouter' : env.DEEPSEEK_API_KEY || env.AI_DEFAULT_PROVIDER === 'deepseek' ? 'deepseek' : env.OPENROUTER_API_KEY ? 'openrouter' : 'deepseek',
      deepseekModel: env.DEEPSEEK_MODEL || 'deepseek-flash',
      openrouterModel: env.OPENROUTER_MODEL || 'anthropic/claude-haiku-5.5',
      maxJobUsd: Number(env.AI_MAX_JOB_USD || 5),
    },
  };
  if (storage === 'github') {
    const repo = env.GITHUB_REPO || '';
    if (!/^[\w.-]+\/[\w.-]+$/.test(repo)) throw new Error('GITHUB_REPO צריך להיות בפורמט owner/name');
    if (!env.GITHUB_TOKEN) throw new Error('STORAGE=github דורש GITHUB_TOKEN');
    cfg.github = { token: env.GITHUB_TOKEN, repo, branch: env.GITHUB_BRANCH || 'master' };
  }
  return cfg;
}

/** בדיקות בטיחות לפני הפעלה. מחזיר שגיאות (עוצר) ואזהרות (ממשיך). */
export function checkConfig(cfg: Config): { errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];
  const local = cfg.host === '127.0.0.1' || cfg.host === 'localhost' || cfg.host === '::1';
  if (!cfg.passwordHash && !cfg.password) errors.push('לא הוגדרה סיסמה. הריצו: npm run admin (יבקש סיסמה) או npm --prefix admin run hash-password');
  if (cfg.password && !cfg.passwordHash && !local) errors.push('ADMIN_PASSWORD בטקסט גלוי מותר רק בהרצה מקומית. בשרת השתמשו ב-ADMIN_PASSWORD_HASH');
  if (cfg.password && cfg.password.length < 10) errors.push('הסיסמה קצרה מדי (לפחות 10 תווים)');
  if (cfg.sessionSecretEphemeral) {
    if (!local) errors.push('בשרת חובה SESSION_SECRET (לפחות 32 תווים)');
    else warnings.push('אין SESSION_SECRET — נוצר זמני; התחברות תתאפס בכל הפעלה מחדש');
  }
  if (!local && !cfg.secureCookies) warnings.push('השרת חשוף לרשת בלי COOKIE_SECURE=1 — מומלץ רק מאחורי HTTPS');
  return { errors, warnings };
}
