/** תצוגה מקדימה "כמו באפליקציה": אותם כרטיסי פנינה/זכוכית, עם סימון של מה שעדיין טיוטה */
import { useEffect, useState } from 'react';
import { api } from '../api';
import type { Verse } from '../types';
import heroImg from '../../../assets/images/bg-hero-sunrise.jpg';

type Proj = { fields: Record<string, any>; verses: Record<string, Record<string, any>> };

export function Preview({ slug, meta, version, verse }: { slug: string; meta: any; version: number; verse?: Verse }) {
  const [drafts, setDrafts] = useState(true);
  const [voice, setVoice] = useState<'adult' | 'child'>('adult');
  const [p, setP] = useState<Proj | null>(null);
  const [pub, setPub] = useState<Proj | null>(null);
  useEffect(() => {
    const t = setTimeout(() => {
      api<Proj>(`/parashot/${slug}/preview?drafts=${drafts ? 1 : 0}`).then(setP, () => {});
      api<Proj>(`/parashot/${slug}/preview?drafts=0`).then(setPub, () => {});
    }, 150);
    return () => clearTimeout(t);
  }, [slug, version, drafts]);
  if (!p) return <div className="phone" aria-busy="true" />;
  const f = p.fields;
  const isDraft = (k: string) => drafts && JSON.stringify(f[k]) !== JSON.stringify(pub?.fields[k]);
  const V = (k: string) => f[`${k}.${voice}`] ?? (voice === 'child' ? f[`${k}.adult`] : undefined);
  const Vk = (k: string) => (f[`${k}.${voice}`] !== undefined ? `${k}.${voice}` : `${k}.adult`);
  const Mark = ({ k }: { k: string }) => (isDraft(k) ? <span className="draftmark">טיוטה</span> : null);
  const hero = f.heroImage ? `/api/content-image?path=${encodeURIComponent(f.heroImage)}` : heroImg;
  const verseRow = verse ? p.verses[verse.id] : undefined;
  const lessons = V('lifeLessons') as { title: string; text: string }[] | undefined;
  return (
    <div className="stack">
      <div className="row spread">
        <h2 className="small" style={{ fontSize: 17 }}>תצוגה מקדימה</h2>
        <div className="chips" role="group" aria-label="אפשרויות תצוגה">
          <button type="button" className="chip" aria-pressed={drafts} onClick={() => setDrafts((d) => !d)}>
            כולל טיוטות
          </button>
          <button type="button" className="chip" aria-pressed={voice === 'child'} onClick={() => setVoice((v) => (v === 'adult' ? 'child' : 'adult'))}>
            מצב ילדים
          </button>
        </div>
      </div>
      <div className="phone" aria-label="תצוגה כמו בטלפון">
        <div className="phone-scroll" tabIndex={0} aria-label="תוכן התצוגה המקדימה (גלילה)">
          <div className="app-hero" style={{ backgroundImage: `url(${hero})` }}>
            <div className="glass">
              <div className="app-eyebrow">פרשת השבוע</div>
              <div style={{ fontFamily: 'var(--serif)', fontSize: 34, fontWeight: 700 }}>{meta?.name}</div>
              <div className="small muted">{meta?.rangeHe}</div>
            </div>
          </div>
          {verse && (
            <div className="app-card">
              <div className="app-eyebrow">{verse.ref}</div>
              <p className="app-verse">{verse.h}</p>
              <p className="small muted" style={{ fontFamily: 'var(--serif)', fontSize: 18 }}>
                {verse.o}
              </p>
              {verseRow?.onkelosExplanation && (
                <div style={{ marginTop: 10 }}>
                  <h3 style={{ fontSize: 15 }}>
                    מה אונקלוס עושה כאן?{drafts && verseRow.onkelosExplanation !== pub?.verses[verse.id]?.onkelosExplanation && <span className="draftmark">טיוטה</span>}
                  </h3>
                  <p className="app-text">{verseRow.onkelosExplanation}</p>
                </div>
              )}
            </div>
          )}
          {(f.storyTitle || V('story')) && (
            <div className="app-card">
              <div className="app-eyebrow">סיפור הפרשה</div>
              <h3>
                {f.storyTitle}
                <Mark k="storyTitle" />
              </h3>
              <p className="app-text">
                {V('story')}
                <Mark k={Vk('story')} />
              </p>
            </div>
          )}
          {(V('haftaraStory') || V('whyThisHaftara')) && (
            <div className="app-card">
              <div className="app-eyebrow">סיפור ההפטרה · {meta?.haftara?.ashkenazi?.refHe}</div>
              {V('haftaraStory') && (
                <p className="app-text">
                  {V('haftaraStory')}
                  <Mark k={Vk('haftaraStory')} />
                </p>
              )}
              {V('whyThisHaftara') && (
                <>
                  <h3 style={{ marginTop: 10, fontSize: 16 }}>למה דווקא ההפטרה הזו?</h3>
                  <p className="app-text">
                    {V('whyThisHaftara')}
                    <Mark k={Vk('whyThisHaftara')} />
                  </p>
                </>
              )}
            </div>
          )}
          {lessons?.length ? (
            <div className="app-card">
              <h3>
                מה אפשר לקחת לחיים
                <Mark k={Vk('lifeLessons')} />
              </h3>
              {lessons.map((l, i) => (
                <div className="lesson" key={i}>
                  <b>{l.title}</b>
                  <p className="app-text">{l.text}</p>
                </div>
              ))}
            </div>
          ) : null}
          {Array.isArray(f.chidushim) && f.chidushim.length ? (
            <div className="app-card">
              <h3>
                חידושים
                <Mark k="chidushim" />
              </h3>
              {f.chidushim.map((c: any, i: number) => (
                <div className="lesson" key={i}>
                  <b>{c.title}</b>
                  <p className="app-text">{c.text}</p>
                </div>
              ))}
            </div>
          ) : null}
          {!Object.keys(f).length && !verseRow && <p className="app-text">אין עדיין תוכן {drafts ? '' : 'מפורסם '}בפרשה הזו.</p>}
        </div>
      </div>
      <p className="help">ככה זה ייראה באפליקציה. בלי ״כולל טיוטות״ — רק מה שמפורסם.</p>
    </div>
  );
}
