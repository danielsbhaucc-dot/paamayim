import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import bundledJson from './bundled.json';
import { CONTENT_FETCH_TIMEOUT_MS, contentUrl } from './config';
import type { ContentIndex, ContentProjection, ContentSource } from './types';

const CACHE_KEY = 'paamayim-content-cache-v1';

type Bundled = { version: string; parashot: Record<string, ContentProjection> };
const BUNDLED = bundledJson as unknown as Bundled;

type CacheShape = {
  version: string;
  hashes: Record<string, string>;
  docs: Record<string, ContentProjection>;
  savedAt: number;
};

interface ContentState {
  version: string;
  docs: Record<string, ContentProjection>;
  source: ContentSource;
  syncing: boolean;
  lastSyncAt: number | null;
  lastError: string | null;
}

/**
 * תוכן בזמן ריצה: מתחילים מהתוכן הארוז, מחליפים במטמון (AsyncStorage) אם יש,
 * ואז מסנכרנים מול <base>/content — רק פרשות שה-hash שלהן השתנה.
 * כך משתמשי APK מקבלים תוכן חדש בלי התקנה מחדש, וגם אופליין יש תוכן.
 */
export const useContentStore = create<ContentState>(() => ({
  version: BUNDLED.version,
  docs: BUNDLED.parashot,
  source: 'bundled',
  syncing: false,
  lastSyncAt: null,
  lastError: null,
}));

const MAX_JSON_CHARS = 3_000_000;
/** slug תקין בלבד (מונע נתיבים כמו ../ מתוך index.json) */
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

async function fetchJson<T>(rel: string): Promise<T> {
  const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timer = setTimeout(() => ctrl?.abort(), CONTENT_FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(contentUrl(rel), {
      signal: ctrl?.signal,
      headers: { Accept: 'application/json', 'Cache-Control': 'no-cache' },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    // הגנה: קובץ תוכן לא אמור לעבור 3MB
    if (text.length > MAX_JSON_CHARS) throw new Error('too large');
    // אתר SPA מחזיר index.html לנתיב חסר — לא JSON
    if (!text.trim().startsWith('{')) throw new Error('not json');
    return JSON.parse(text) as T;
  } finally {
    clearTimeout(timer);
  }
}

async function readCache(): Promise<CacheShape | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw) as CacheShape) : null;
  } catch {
    return null;
  }
}

let started = false;

/** להפעיל פעם אחת (מ-app/_layout). בטוח לקריאה חוזרת. */
export function startContentSync(): void {
  if (started) return;
  started = true;
  void syncContent();
}

export async function syncContent(): Promise<void> {
  const set = useContentStore.setState;
  const cache = await readCache();
  if (cache?.docs && Object.keys(cache.docs).length) {
    set({ docs: cache.docs, version: cache.version, source: 'cache' });
  }
  set({ syncing: true });
  try {
    const index = await fetchJson<ContentIndex>('index.json');
    if (!index?.parashot || typeof index.parashot !== 'object' || !Object.keys(index.parashot).length) {
      throw new Error('bad index');
    }
    const prevHashes = cache?.hashes ?? {};
    const prevDocs = useContentStore.getState().docs;
    const docs: Record<string, ContentProjection> = {};
    const hashes: Record<string, string> = {};
    const toFetch: string[] = [];

    for (const [slug, info] of Object.entries(index.parashot)) {
      if (!SLUG_RE.test(slug) || typeof info?.hash !== 'string') continue;
      hashes[slug] = info.hash;
      if (prevHashes[slug] === info.hash && prevDocs[slug]) docs[slug] = prevDocs[slug];
      else toFetch.push(slug);
    }
    // עד 4 בקשות במקביל
    let i = 0;
    const worker = async () => {
      while (i < toFetch.length) {
        const slug = toFetch[i++];
        try {
          const doc = await fetchJson<ContentProjection>(`parashot/${slug}.json`);
          if (!doc || typeof doc !== 'object' || Array.isArray(doc)) throw new Error('bad doc');
          docs[slug] = doc;
        } catch {
          if (prevDocs[slug]) docs[slug] = prevDocs[slug];
          delete hashes[slug];
        }
      }
    };
    await Promise.all([worker(), worker(), worker(), worker()]);

    set({ docs, version: index.version, source: 'remote', lastSyncAt: Date.now(), lastError: null });
    const next: CacheShape = { version: index.version, hashes, docs, savedAt: Date.now() };
    AsyncStorage.setItem(CACHE_KEY, JSON.stringify(next)).catch(() => undefined);
  } catch (e) {
    set({ lastError: e instanceof Error ? e.message : String(e) });
  } finally {
    set({ syncing: false });
  }
}
