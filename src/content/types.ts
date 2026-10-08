/** הקרנה מפורסמת של פרשה (כמו שנוצרת ב-scripts/content/build.mjs) */
export type ContentProjection = {
  slug: string;
  nameEn: string;
  /** מפתח אחסון ("story.adult", "lifeLessons.child", "chidushim"...) → ערך */
  fields: Record<string, unknown>;
  /** verseId → מפתח → ערך */
  verses: Record<string, Record<string, unknown>>;
};

export type ContentIndex = {
  schemaVersion: number;
  version: string;
  generatedAt?: string;
  parashot: Record<string, { hash: string; nameEn: string }>;
};

export type ContentSource = 'bundled' | 'cache' | 'remote';
