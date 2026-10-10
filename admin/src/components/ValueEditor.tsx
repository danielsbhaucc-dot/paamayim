/** עורך ערך לפי סוג השדה בסכמה (טקסט, טקסט ארוך, רשימת מחרוזות, רשימת פריטים, קבוצה) */
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';
import { useId } from 'react';
import type { Field } from '../types';
import { RichEditor } from './RichEditor';
import { RichPreview } from './RichPreview';

type Sub = { key: string; label: string; type: string; format?: string };
type Props = { field: Field; value: any; onChange: (v: any) => void; label: string };

function autoRows(s: string, min = 4) {
  return Math.min(22, Math.max(min, Math.ceil((s?.length ?? 0) / 70) + (s?.split('\n').length ?? 1)));
}

function isRich(field: { format?: string } | null | undefined) {
  return field?.format === 'rich';
}

function LongtextEditor({
  value,
  onChange,
  label,
  rich,
  minRows = 4,
}: {
  value: string;
  onChange: (v: string) => void;
  label: string;
  rich?: boolean;
  minRows?: number;
}) {
  const id = useId();
  if (rich) {
    return <RichEditor value={value ?? ''} onChange={onChange} label={label} minRows={minRows} />;
  }
  return (
    <label className="field">
      <span className="sr-only">{label}</span>
      <textarea
        id={id}
        className="input"
        rows={autoRows(value, minRows)}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        dir="rtl"
      />
    </label>
  );
}

export function ValueEditor({ field, value, onChange, label }: Props) {
  const id = useId();
  if (field.type === 'text')
    return (
      <label className="field">
        <span className="sr-only">{label}</span>
        <input id={id} className="input" value={value ?? ''} onChange={(e) => onChange(e.target.value)} dir="rtl" />
      </label>
    );
  if (field.type === 'longtext')
    return <LongtextEditor value={value ?? ''} onChange={onChange} label={label} rich={isRich(field)} />;
  if (field.type === 'stringList') {
    const arr: string[] = Array.isArray(value) ? value : [];
    return (
      <div className="stack" role="group" aria-label={label}>
        {arr.map((s, i) => (
          <div className="row" key={i}>
            <input className="input grow" aria-label={`${label} ${i + 1}`} value={s} onChange={(e) => onChange(arr.map((x, k) => (k === i ? e.target.value : x)))} />
            <button type="button" className="btn icon small ghost" aria-label={`מחיקת פריט ${i + 1}`} onClick={() => onChange(arr.filter((_, k) => k !== i))}>
              <Trash2 size={18} aria-hidden />
            </button>
          </div>
        ))}
        <button type="button" className="btn small" onClick={() => onChange([...arr, ''])}>
          <Plus size={16} aria-hidden /> הוספה
        </button>
      </div>
    );
  }
  if (field.type === 'list') {
    const arr: Record<string, string>[] = Array.isArray(value) ? value : [];
    const move = (i: number, d: number) => {
      const n = [...arr];
      const [x] = n.splice(i, 1);
      n.splice(i + d, 0, x);
      onChange(n);
    };
    return (
      <div className="stack" role="group" aria-label={label}>
        {arr.map((item, i) => (
          <div className="listitem" key={i}>
            <div className="row spread">
              <b className="small">{item.title || item.aliyah ? `${item.aliyah ? `עלייה ${item.aliyah}` : ''}${item.title ? (item.aliyah ? ' · ' : '') + item.title : ''}` : `פריט ${i + 1}`}</b>
              <div className="row" style={{ gap: 2 }}>
                <button type="button" className="btn icon small ghost" aria-label={`העלאת פריט ${i + 1}`} disabled={i === 0} onClick={() => move(i, -1)}>
                  <ArrowUp size={18} aria-hidden />
                </button>
                <button type="button" className="btn icon small ghost" aria-label={`הורדת פריט ${i + 1}`} disabled={i === arr.length - 1} onClick={() => move(i, 1)}>
                  <ArrowDown size={18} aria-hidden />
                </button>
                <button type="button" className="btn icon small ghost" aria-label={`מחיקת פריט ${i + 1}`} onClick={() => onChange(arr.filter((_, k) => k !== i))}>
                  <Trash2 size={18} aria-hidden />
                </button>
              </div>
            </div>
            {(field.item as Sub[]).map((sub) => (
              <label className="field" key={sub.key}>
                {sub.label}
                {sub.type === 'longtext' ? (
                  <LongtextEditor
                    value={item[sub.key] ?? ''}
                    onChange={(t) => onChange(arr.map((x, k) => (k === i ? { ...x, [sub.key]: t } : x)))}
                    label={sub.label}
                    rich={isRich(sub)}
                    minRows={3}
                  />
                ) : (
                  <input className="input" value={item[sub.key] ?? ''} onChange={(e) => onChange(arr.map((x, k) => (k === i ? { ...x, [sub.key]: e.target.value } : x)))} />
                )}
              </label>
            ))}
          </div>
        ))}
        {(!field.max || arr.length < field.max) && (
          <button type="button" className="btn small" onClick={() => onChange([...arr, {}])}>
            <Plus size={16} aria-hidden /> הוספת פריט
          </button>
        )}
        {field.min && arr.length > 0 && arr.length < field.min ? <p className="help">מומלץ לפחות {field.min} פריטים.</p> : null}
      </div>
    );
  }
  if (field.type === 'group') {
    const o: Record<string, string> = value && typeof value === 'object' ? value : {};
    return (
      <div className="stack" role="group" aria-label={label}>
        {field.subfields!.map((sub) => (
          <label className="field" key={sub.key}>
            {sub.label}
            <input className="input" value={o[sub.key] ?? ''} onChange={(e) => onChange({ ...o, [sub.key]: e.target.value })} />
          </label>
        ))}
      </div>
    );
  }
  return null;
}

/** הצגה קריאה של ערך מפורסם */
export function ValueView({ field, value }: { field: Field; value: any }) {
  if (value == null) return null;
  if (field.type === 'list')
    return (
      <div>
        {(value as any[]).map((it, i) => (
          <p key={i}>
            <b>{it.title ?? (it.aliyah ? `עלייה ${it.aliyah}` : `פריט ${i + 1}`)}</b> {it.text ?? Object.values(it).join(' · ')}
          </p>
        ))}
      </div>
    );
  if (field.type === 'stringList') return <div>{(value as string[]).map((s, i) => <p key={i}>• {s}</p>)}</div>;
  if (field.type === 'group') return <p>{Object.values(value).join(' · ')}</p>;
  if (isRich(field) && typeof value === 'string') return <RichPreview text={value} className="rich-live compact" />;
  return <>{String(value)}</>;
}
