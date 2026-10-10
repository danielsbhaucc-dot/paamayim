/** תצוגה חיה של עיצוב טקסט — כמו באפליקציה (בלי כוכביות) */
import { parseRichText, type RichBlock, type RichSpan } from '../lib/richText';

function Spans({ spans }: { spans: RichSpan[] }) {
  return (
    <>
      {spans.map((s, j) => (s.bold ? <strong key={j}>{s.text}</strong> : <span key={j}>{s.text}</span>))}
    </>
  );
}

function Block({ b }: { b: RichBlock }) {
  if (b.type === 'hr') return <hr className="rich-hr" />;
  if (b.type === 'h')
    return (
      <h3 className="rich-h">
        <Spans spans={b.spans} />
      </h3>
    );
  if (b.type === 'quote')
    return (
      <blockquote className="rich-quote">
        <Spans spans={b.spans} />
      </blockquote>
    );
  if (b.type === 'ul')
    return (
      <ul className="rich-ul">
        {b.items.map((it, i) => (
          <li key={i}>
            <Spans spans={it} />
          </li>
        ))}
      </ul>
    );
  if (b.type === 'ol')
    return (
      <ol className="rich-ol">
        {b.items.map((it, i) => (
          <li key={i}>
            <Spans spans={it} />
          </li>
        ))}
      </ol>
    );
  if (b.type === 'ol-letter')
    return (
      <ol className="rich-ol letters">
        {b.items.map((it, i) => (
          <li key={i}>
            <Spans spans={it} />
          </li>
        ))}
      </ol>
    );
  return (
    <p className="rich-p">
      <Spans spans={b.spans} />
    </p>
  );
}

export function RichPreview({ text, className = 'rich-live' }: { text: string; className?: string }) {
  const blocks = parseRichText(text);
  if (!blocks.length) return <p className="muted small">אין טקסט עדיין…</p>;
  return (
    <div className={className} dir="rtl">
      {blocks.map((b, i) => (
        <Block key={i} b={b} />
      ))}
    </div>
  );
}
