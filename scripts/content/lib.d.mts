export const SCHEMA_VERSION: 2;
export type EntryStatus = 'empty' | 'draft' | 'changed' | 'published';
export type Entry = { published?: any; draft?: any; updatedAt?: string; publishedAt?: string; source?: string };
export type ContentDoc = {
  schemaVersion: number;
  slug: string;
  meta: Record<string, any>;
  fields: Record<string, Entry>;
  verses: Record<string, Record<string, Entry>>;
};
export type Projection = { slug: string; nameEn: string; fields: Record<string, any>; verses: Record<string, Record<string, any>> };
export function isEmptyValue(v: any): boolean;
export function sameValue(a: any, b: any): boolean;
export function entryStatus(entry: Entry | undefined): EntryStatus;
export function storageKeys(schema: any, scope?: 'parasha' | 'verse'): { storageKey: string; field: any; variant: string | null }[];
export function fieldFor(schema: any, storageKey: string): any;
export function normalizeValue(field: any, value: any): any;
export function setDraft(entry: Entry | undefined, value: any, source?: string): Entry;
export function publishEntry(entry: Entry | undefined): Entry;
export function unpublishEntry(entry: Entry | undefined): Entry;
export function isUsefulEntry(entry: Entry | undefined): boolean;
export function emptyDoc(slug: string, meta?: Record<string, any>): ContentDoc;
export function project(doc: ContentDoc, schema: any, opts?: { drafts?: boolean }): Projection;
export function docStats(doc: ContentDoc, schema: any, verseCount?: number): any;
export function hashString(s: string): string;
export function slugFromName(name: string): string;
export function projectedImages(projection: Projection, schema: any): string[];
export function buildOutputs(
  docs: ContentDoc[],
  schema: any
): { index: Record<string, { hash: string; nameEn: string }>; projections: Record<string, Projection>; version: string; bundledJson: string; images: string[] };
