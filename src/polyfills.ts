/**
 * Polyfills ל-Hermes (האפליקציה באנדרואיד/iOS).
 *
 * שורש הקריסה של ה-APK (הספלאש ואז סגירה): @hebcal/leyning קורא ל-structuredClone,
 * שקיים בדפדפן (לכן האתר עבד) אבל לא ב-Hermes של React Native 0.76.
 * PARASHOT נבנה כבר בטעינת המודול, ולכן ReferenceError נזרק לפני שמסך כלשהו מוצג.
 */
type AnyRecord = Record<string | symbol, unknown>;

function cloneDeep<T>(value: T, seen = new Map<unknown, unknown>()): T {
  if (value === null || typeof value !== 'object') return value;
  if (seen.has(value)) return seen.get(value) as T;
  if (value instanceof Date) return new Date(value.getTime()) as T;
  if (value instanceof RegExp) return new RegExp(value.source, value.flags) as T;
  if (value instanceof Map) {
    const out = new Map();
    seen.set(value, out);
    value.forEach((v, k) => out.set(cloneDeep(k, seen), cloneDeep(v, seen)));
    return out as T;
  }
  if (value instanceof Set) {
    const out = new Set();
    seen.set(value, out);
    value.forEach((v) => out.add(cloneDeep(v, seen)));
    return out as T;
  }
  if (Array.isArray(value)) {
    const out: unknown[] = [];
    seen.set(value, out);
    for (const v of value) out.push(cloneDeep(v, seen));
    return out as T;
  }
  const out: AnyRecord = {};
  seen.set(value, out);
  for (const k of Object.keys(value as object)) out[k] = cloneDeep((value as AnyRecord)[k], seen);
  return out as T;
}

export function installPolyfills() {
  const g = globalThis as unknown as { structuredClone?: (v: unknown, o?: unknown) => unknown };
  if (typeof g.structuredClone !== 'function') {
    g.structuredClone = (v: unknown) => cloneDeep(v);
  }
}
installPolyfills();
