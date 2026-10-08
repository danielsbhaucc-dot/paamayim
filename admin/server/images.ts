/**
 * העלאת תמונה: בדיקה אמיתית של התוכן (לא לפי שם/סיומת), הסרת מטא-דאטה (EXIF/GPS),
 * הקטנה ודחיסה ל-WebP עד 300KB. מחזיר שם קובץ שנוצר בשרת (המשתמש לא קובע נתיב).
 */
import crypto from 'node:crypto';
import sharp, { type Metadata, type OutputInfo } from 'sharp';
import { HttpError } from './content';

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
export const MAX_OUTPUT_BYTES = 300 * 1024;
const ALLOWED_FORMATS = new Set(['jpeg', 'png', 'webp', 'avif', 'heif']);

function sniff(buf: Buffer): string | null {
  if (buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'jpeg';
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'png';
  if (buf.subarray(0, 4).toString('latin1') === 'RIFF' && buf.subarray(8, 12).toString('latin1') === 'WEBP') return 'webp';
  if (buf.subarray(4, 8).toString('latin1') === 'ftyp') return 'heif';
  return null;
}

export async function processImage(input: Buffer, opts: { maxWidth?: number } = {}) {
  if (!input?.length) throw new HttpError(400, 'לא התקבל קובץ');
  if (input.length > MAX_UPLOAD_BYTES) throw new HttpError(413, 'הקובץ גדול מ-10MB');
  if (!sniff(input)) throw new HttpError(415, 'רק JPG, PNG, WebP או HEIC/AVIF');
  let meta: Metadata;
  try {
    meta = await sharp(input, { limitInputPixels: 50_000_000, failOn: 'error' }).metadata();
  } catch {
    throw new HttpError(415, 'הקובץ אינו תמונה תקינה');
  }
  if (!meta.format || !ALLOWED_FORMATS.has(meta.format)) throw new HttpError(415, 'פורמט תמונה לא נתמך');
  if (!meta.width || !meta.height || meta.width < 200 || meta.height < 120) throw new HttpError(400, 'התמונה קטנה מדי (לפחות 200×120)');
  if ((meta.pages ?? 1) > 1) throw new HttpError(400, 'תמונות מונפשות לא נתמכות');

  const widths = [opts.maxWidth ?? 1600, 1280, 1024, 820];
  const qualities = [80, 72, 64, 56, 48];
  let out: Buffer | null = null;
  let info: OutputInfo | null = null;
  search: for (const w of widths) {
    for (const q of qualities) {
      const r = await sharp(input, { limitInputPixels: 50_000_000 })
        .rotate() // לפי EXIF, ואז המטא-דאטה נמחקת (sharp לא שומר אותה כברירת מחדל)
        .resize({ width: w, withoutEnlargement: true })
        .webp({ quality: q, effort: 5 })
        .toBuffer({ resolveWithObject: true });
      out = r.data;
      info = r.info;
      if (out.length <= MAX_OUTPUT_BYTES) break search;
    }
  }
  if (!out || !info || out.length > MAX_OUTPUT_BYTES) throw new HttpError(400, 'לא הצלחתי לדחוס מתחת ל-300KB');
  const hash = crypto.createHash('sha256').update(out).digest('hex').slice(0, 10);
  return { data: out, width: info.width, height: info.height, bytes: out.length, hash };
}
