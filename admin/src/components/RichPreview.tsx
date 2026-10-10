/** תצוגה חיה של עיצוב טקסט (*הדגשה*, ציטוט >) — כמו באפליקציה */
import { parseRichText } from '../../../src/content/richText';

export function RichPreview({ text, className = 'rich-live' }: { text: string; className?: string }) {
  const blocks = parseRichText(text);
  if (!blocks.length) return <p className="muted small">התצוגה החיה תופיע כאן…</p>;
  return (
    <div className={className} dir="rtl">
      {blocks.map((b, i) =>
        b.type === 'quote' ? (
          <blockquote key={i} className="rich-quote">
            {b.spans.map((s, j) => (s.bold ? <strong key={j}>{s.text}</strong> : <span key={j}>{s.text}</span>))}
          </blockquote>
        ) : (
          <p key={i} className="rich-p">
            {b.spans.map((s, j) => (s.bold ? <strong key={j}>{s.text}</strong> : <span key={j}>{s.text}</span>))}
          </p>
        )
      )}
    </div>
  );
}

/** מחרוזת עזרה קצרה לעורך */
export const RICH_HINT = '*הדגשה* · שורה שמתחילה ב־> לציטוט';
