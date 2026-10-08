import type { Verse } from './types';

type Note = Verse['onkelosNote'];

function strip(value: string): string {
  return value.replace(/[\u0591-\u05C7]/g, '');
}

/**
 * משפט אחד בעברית פשוטה: מה אונקלוס עשה לפסוק.
 * הערות ידניות (notes.ts) גוברות על הזיהוי האוטומטי.
 */
export function explainOnkelos(hebrew: string, onkelos: string): Note {
  const h = strip(hebrew);
  const a = strip(onkelos);

  const rules: Array<{ when: boolean; note: Note }> = [
    {
      when: /מתהלך/.test(h) && /מימרא/.test(a),
      note: {
        plain: 'הפסוק אומר שה׳ מתהלך',
        did: 'אונקלוס כותב ״מימרא״ — הדיבור',
        why: 'נמנע מהגשמה: לא גוף שהולך, אלא קול הדיבור',
      },
    },
    {
      when: /בעיני/.test(h) && /קדם/.test(a),
      note: {
        plain: 'הפסוק אומר ״בעיני ה׳״',
        did: 'אונקלוס כותב ״קדם״ — מלפני ה׳',
        why: 'נמנע מהגשמה: לא מייחס לה׳ עיניים',
      },
    },
    {
      when: /וירא/.test(h) && /וגלי קדם|וְגָלִי/.test(a),
      note: {
        plain: 'הפסוק אומר ״וירא ה׳״',
        did: 'אונקלוס: ״וגלי קדם״ — ונגלה לפני',
        why: 'נמנע מהגשמה: הראייה נעשית גילוי מלפני ה׳',
      },
    },
    {
      when: /רוח אלהים|רוח אלוהים/.test(h) && /מן קדם|מִן קֳדָם/.test(onkelos),
      note: {
        plain: 'הפסוק אומר ״רוח אלהים״',
        did: 'אונקלוס: ״רוחא מן קדם״ — רוח מלפני ה׳',
        why: 'נמנע מהגשמה: לא רוח שהיא גוף, אלא רוח מלפניו',
      },
    },
    {
      when: /וינחם|וַיִּנָּחֶם/.test(h) && /ותב|וְתָב/.test(a),
      note: {
        plain: 'הפסוק אומר שה׳ ניחם',
        did: 'אונקלוס כותב ״ותב״ — ושב',
        why: 'מיישר קושי: לא חרטה אנושית, אלא שינוי פניית ה׳',
      },
    },
    {
      when: /אף/.test(h) && /רגז|רוגז/.test(a),
      note: {
        plain: 'הפסוק אומר ״אף״',
        did: 'אונקלוס מתרגם ל״רוגז״',
        why: 'נמנע מהגשמה: הכעס אינו איבר, אלא רוגז',
      },
    },
    {
      when: /קדם/.test(a) && !/לפני/.test(h),
      note: {
        plain: 'הפסוק מדבר על ה׳ ישירות',
        did: 'אונקלוס מוסיף ״קדם״ — מלפני',
        why: 'מרחיק הגשמה: הפעולה מלפני ה׳, לא בגוף',
      },
    },
    {
      when: /מימרא/.test(a) && !/מימרא/.test(h),
      note: {
        plain: 'הפסוק מייחס את הפעולה לה׳',
        did: 'אונקלוס מוסיף ״מימרא״ — הדיבור',
        why: 'נמנע מהגשמה: פועל הדיבור, לא גוף',
      },
    },
  ];

  const hit = rules.find((rule) => rule.when);
  if (hit) return hit.note;

  if (a.length > h.length * 1.45 && a.length - h.length > 12) {
    return {
      plain: 'הפסוק קצר מן התרגום',
      did: 'אונקלוס מאריך את הניסוח',
      why: 'מוסיף מילה להבהרה, כדי שהארמית תישמע ברורה',
    };
  }

  return {
    plain: 'הפסוק אומר את הדברים כסדרם',
    did: 'אונקלוס מעביר אותם לארמית קרובה',
    why: 'כאן אין שינוי של רעיון — התרגום נשאר צמוד למקור',
  };
}
