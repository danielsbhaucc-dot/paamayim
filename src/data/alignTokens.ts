/**
 * חלוקה למילים ליישור עברית–ארמית. מילים מחוברות במקף הן מילה אחת.
 * האינדקסים זהים עם טעמים ובלעדיהם (פסק מצטרף למילה שלפניו; סימני פרשה באמצע פסוק מוסרים).
 */
const BRK_RE = /\s*[({][פס][)}]\s*/g;
const TEAMIM_RE = /[\u0591-\u05AF\u05BD]/g;

export function hebrewTokens(raw: string, teamim: boolean): string[] {
  const text = raw.replace(BRK_RE, ' ').trim();
  const parts = text.split(/\s+/).filter(Boolean);
  const out: string[] = [];
  for (const p of parts) {
    const bare = p.replace(TEAMIM_RE, '');
    if (bare === '\u05C0' || bare === '') {
      if (out.length) out[out.length - 1] += ' ' + (teamim ? p : '');
      continue;
    }
    out.push(teamim ? p : bare.replace(/\u05C0/g, ''));
  }
  return out.map((t) => t.trim());
}

export function aramaicTokens(text: string): string[] {
  return text.trim().split(/\s+/).filter(Boolean);
}

/** האם הפסוק מתאים ליישור בפיילוט (בלי כתיב/קרי) */
export const alignable = (raw: string) => !raw.includes('[');
