# נהורא · Admin JSON API

Every action in the admin UI is a plain JSON endpoint, so a future control dashboard (or a script) can use the same API.
Base URL: `http://127.0.0.1:8787/api` locally, or your hosted admin URL.

## Authentication

There are two ways in:

1. **Browser session.** `POST /api/login {"password": "..."}` sets an HttpOnly, SameSite=Strict `nw_admin` cookie that lasts 12 h and returns `{ok, csrf}`. Every non-GET request must then send `X-CSRF-Token: <csrf>`, and its `Origin` (if sent) must match the admin's own origin or `ALLOWED_ORIGINS`. `GET /api/session` returns `{authenticated, csrf, storage, storageLabel, ai}`.
2. **Machine token (dashboard).** Set `ADMIN_API_TOKEN` (at least 32 random characters) in `admin/.env`, then send `Authorization: Bearer <token>`. Bearer requests skip CSRF, because no cookie is involved. Keep the token server-side only.

Errors always look like `{ "error": "<Hebrew message>" }` and carry a matching HTTP status (400 validation, 401 not logged in, 403 CSRF/Origin, 404, 409 conflict, 413 body too large, 429 rate limit, 502 upstream).

Limits:
- login: 5/min and 30/h per IP
- API: 600/min per session
- AI calls: 20/min
- JSON body: 1 MB
- uploads: 12 MB, with images capped at 10 MB

## Content model

- Parasha slugs look like `bereshit`, `lech-lecha` and so on (`/^[a-z0-9]+(-[a-z0-9]+)*$/`). Verse ids look like `genesis-1-1`.
- A field key is either a schema key (`whyThisHaftara`) or a key plus a variant (`whyThisHaftara.adult`, `lifeLessons.child`). See `GET /api/schema`.
- Each stored value is an Entry: `{ published?, draft?, updatedAt, publishedAt?, source }`. The app only ever sees `published`.
- Every write returns the updated `{ doc, stats }` for that parasha.

## Endpoints

| Method | Path | Body | Returns |
|---|---|---|---|
| GET | `/health` | | `{ok:true}` (no auth) |
| GET | `/session` | | session info (see above) |
| POST | `/login` | `{password}` | `{ok, csrf}` and the cookie |
| POST | `/logout` | | `{ok}` (the session is revoked) |
| GET | `/schema` | | `content/schema.json` |
| GET | `/parashot` | | `[{slug, name, nameEn, book, bookHe, rangeHe, stats}]` in Torah order |
| GET | `/parashot/:slug` | | `{doc, stats, verses:[{id, ref, chapter, verse, h, o, aliyah}], prev, next}` |
| GET | `/parashot/:slug/preview?drafts=1` | | the projection the app would receive (`drafts=1` includes drafts) |
| PUT | `/parashot/:slug/fields/:key` | `{value}` | saves a **draft** |
| PUT | `/parashot/:slug/verses/:verseId/:key` | `{value}` | saves a per-verse **draft** (for example `onkelosExplanation`) |
| POST | `/parashot/:slug/publish` | `{targets?: string[]}` | publishes drafts and rebuilds `src/content/bundled.json` in the same commit. Targets are `key`, `v:<verseId>:<key>` or `v:*:<key>`; with no targets, every draft in the parasha is published. Returns `{doc, stats, published}` |
| POST | `/parashot/:slug/discard` | `{key, verseId?}` | deletes the draft |
| POST | `/parashot/:slug/unpublish` | `{key, verseId?}` | moves the published value back to a draft |
| POST | `/parashot/:slug/images/:key` | multipart `file` | validates the image (magic bytes, ≤10 MB, ≥200×120, not animated), converts it to WebP ≤300 KB and stores it as a draft |
| GET | `/content-image?path=images/...` | | the stored image |
| GET | `/greetings` | | `{published, draft}` for status lines |
| PUT | `/greetings` | the full status-lines object | validates (categories, placeholders, lengths) and saves a draft |
| POST | `/greetings/publish` | | publishes the draft |
| POST | `/greetings/discard` | | deletes the draft |
| PUT | `/corpus/onkelos/:verseId` | `{text, confirm:true}` | fixes the Onkelos wording in `src/data/corpus` (Hebrew letters, nikud and punctuation only). Returns `{before, after}` |
| GET | `/sefaria?ref=Onkelos Genesis 1:1&version=hebrew` | | `{ref, text:[...]}` |
| GET | `/ai/providers` | | which providers are configured, defaults, `maxJobUsd`, `peakNow` |
| GET | `/ai/models` | | `{deepseek:[...], openrouter:[...]}` with live OpenRouter prices (USD per 1M tokens) |
| GET | `/ai/presets` | | rewrite presets and bulk tasks |
| POST | `/ai/rewrite` | `{slug, key, verseId?, provider, model, preset? , instruction?}` | rewrites one field. The result is saved **as a draft**. Returns `{doc, stats, usd}` |
| POST | `/ai/estimate` | `{task, slugs[], provider, model, mode:'missing'|'all'}` | `{requests, inTokens, outTokens, usd, peak, over, token}`. `token` (signed, valid 15 min) is required to start a job; it is `null` when the estimate exceeds `AI_MAX_JOB_USD` |
| POST | `/ai/jobs` | `{token}` | starts a bulk job (one at a time). Everything is written as drafts and published values are never overwritten |
| GET | `/ai/jobs` · `/ai/jobs/:id` | | job progress `{status, total, done, saved, usd, errors}` |
| POST | `/ai/jobs/:id/cancel` | | stops after the current request |
| GET | `/git/status` | | local mode: changed content files and commits not yet pushed |
| POST | `/git/sync` | `{message, push?:true}` | local mode: `git add` (content only) + commit + push |
| POST | `/publish-all` | `{message?}` | GitHub mode: copy content files from `content-drafts` → `master` (one commit; triggers CF build) |

Tasks: `explainVerses` (per-verse "what Onkelos does here"), `whyThisHaftara` (adult and child, using the haftara text from Sefaria) and `lifeLessons` (adult and child).

## Example (dashboard with a token)

```bash
curl -H "Authorization: Bearer $ADMIN_API_TOKEN" https://admin.example.com/api/parashot
curl -X PUT -H "Authorization: Bearer $ADMIN_API_TOKEN" -H "Content-Type: application/json" \
  -d '{"value":"טקסט חדש"}' https://admin.example.com/api/parashot/bereshit/fields/whyThisHaftara.adult
curl -X POST -H "Authorization: Bearer $ADMIN_API_TOKEN" -H "Content-Type: application/json" \
  -d '{"targets":["whyThisHaftara.adult"]}' https://admin.example.com/api/parashot/bereshit/publish
```
