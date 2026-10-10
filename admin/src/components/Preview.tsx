/** תצוגה מקדימה "כמו באפליקציה": אותם כרטיסי פנינה/זכוכית, עם סימון של מה שעדיין טיוטה */
import { useEffect, useState, type ReactNode } from 'react';
import { api } from '../api';
import type { Verse } from '../types';
import heroImg from '../../../assets/images/bg-hero-sunrise.jpg';
import { RichPreview } from './RichPreview';

type Proj = { fields: Record<string, any>; verses: Record<string, Record<string, any>> };

function RichStory({ text, mark }: { text: string; mark?: ReactNode }) {
  if (!text?.trim()) return null;
  return (
    <div className="app-text" style={{ whiteSpace: 'normal' }}>
      <RichPreview text={text} className="rich-live compact" />
      {mark}
    </div>
  );
}

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
          {(() => {
            const stories = V('stories') as { title?: string; text?: string }[] | undefined;
            const byAliyah = V('storyByAliyah') as { aliyah?: string; title?: string; text?: string }[] | undefined;
            const hasStories = Array.isArray(stories) && stories.length > 0;
            const hasSingle = !!(f.storyTitle || V('story'));
            if (!hasStories && !hasSingle && !(Array.isArray(byAliyah) && byAliyah.length)) return null;
            return (
              <>
                {(hasStories || hasSingle) && (
                  <div className="app-card">
                    <div className="app-eyebrow">סיפור הפרשה</div>
                    {hasStories ? (
                      stories!.map((s, i) => (
                        <div key={i}>
                          {i > 0 ? <div className="story-divider">סיפור {i + 1}</div> : null}
                          {s.title ? (
                            <h3>
                              {s.title}
                              <Mark k={Vk('stories')} />
                            </h3>
                          ) : null}
                          {s.text ? <RichStory text={s.text} /> : null}
                        </div>
                      ))
                    ) : (
                      <>
                        <h3>
                          {f.storyTitle}
                          <Mark k="storyTitle" />
                        </h3>
                        <RichStory text={String(V('story') ?? '')} mark={<Mark k={Vk('story')} />} />
                      </>
                    )}
                  </div>
                )}
                {Array.isArray(byAliyah) && byAliyah.length ? (
                  <div className="app-card">
                    <div className="app-eyebrow">לפי עליות</div>
                    <Mark k={Vk('storyByAliyah')} />
                    {byAliyah
                      .slice()
                      .sort((a, b) => (Number(a.aliyah) || 99) - (Number(b.aliyah) || 99))
                      .map((s, i) => (
                        <div key={i} style={{ marginTop: i ? 12 : 0 }}>
                          {i > 0 ? <div className="story-divider" /> : null}
                          <div className="app-eyebrow">עלייה {s.aliyah}</div>
                          {s.title ? <h3 style={{ fontSize: 16 }}>{s.title}</h3> : null}
                          {s.text ? <RichStory text={s.text} /> : null}
                        </div>
                      ))}
                  </div>
                ) : null}
              </>
            );
          })()}
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
