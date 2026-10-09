/** הפעלה: npm run admin (מהשורש) או npm --prefix admin start */
import path from 'node:path';
import { serve } from '@hono/node-server';
import { createApp } from './app';
import { ADMIN_DIR, checkConfig, loadEnvFile, readConfig } from './config';
import { githubStorage } from './storage/github';
import { localStorage } from './storage/local';

loadEnvFile();
const cfg = readConfig();
const { errors, warnings } = checkConfig(cfg);
for (const w of warnings) console.warn(`⚠️  ${w}`);
if (errors.length) {
  for (const e of errors) console.error(`✖ ${e}`);
  process.exit(1);
}
const storage =
  cfg.storage === 'github' && cfg.github
    ? githubStorage({
        token: cfg.github.token,
        repo: cfg.github.repo,
        branch: cfg.github.branch,
        draftBranch: cfg.github.draftBranch,
      })
    : localStorage(cfg.repoRoot);
const { app } = createApp(cfg, storage, { distDir: path.join(ADMIN_DIR, 'dist') });
serve({ fetch: app.fetch, port: cfg.port, hostname: cfg.host }, (info) => {
  const url = `http://${cfg.host === '0.0.0.0' ? 'localhost' : cfg.host}:${info.port}`;
  console.log(`\n  נהורא · ניהול תוכן\n  ${url}\n  אחסון: ${storage.describe()}\n  AI: ${cfg.ai.mock ? 'מצב דמו (AI_MOCK=1)' : [cfg.ai.deepseekKey && 'DeepSeek', cfg.ai.openrouterKey && 'OpenRouter'].filter(Boolean).join(' + ') || 'לא הוגדר מפתח'}\n`);
});
