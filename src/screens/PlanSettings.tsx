import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { CITIES } from '../schedule/calendar';
import { notificationsSupported, requestNotificationPermission } from '../schedule/notify';
import { DEFAULT_FEATURES, useAppStore, type Features } from '../store/useAppStore';
import { nw } from '../theme/design';
import { fonts } from '../theme/fonts';
import { rtl } from '../theme/rtl';

const DAYS = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳'];
const TIMES = ['07:00', '13:00', '20:30', '22:00'];
const MEALS = ['10:30', '11:00', '11:30', '12:00', '12:30', '13:00'];

export function Chip({ on, label, onPress, a11y }: { on: boolean; label: string; onPress: () => void; a11y?: string }) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: on }}
      accessibilityLabel={a11y ?? label}
      onPress={onPress}
      style={{
        minWidth: 44,
        minHeight: 40,
        paddingHorizontal: 12,
        borderRadius: 999,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: on ? nw.color.tealBright : 'rgba(255,255,255,0.7)',
        borderWidth: 1,
        borderColor: on ? nw.color.tealBright : 'rgba(31,158,140,0.35)',
      }}
    >
      <Text style={{ fontFamily: fonts.uiBold, fontSize: 15, color: on ? '#fff' : nw.color.tealText }}>{label}</Text>
    </Pressable>
  );
}

export const Label = ({ children }: { children: string }) => (
  <Text style={{ fontFamily: fonts.uiBold, fontSize: 16, color: nw.color.ink, writingDirection: 'rtl', textAlign: rtl.textRight }}>{children}</Text>
);
export const Help = ({ children }: { children: string }) => (
  <Text style={{ fontFamily: fonts.ui, fontSize: 14, lineHeight: 21, color: nw.color.inkSoft, writingDirection: 'rtl', textAlign: rtl.textRight }}>{children}</Text>
);
export const RowWrap = ({ children }: { children: React.ReactNode }) => (
  <View style={{ flexDirection: rtl.row, flexWrap: 'wrap', gap: 8 }}>{children}</View>
);

/** תוכנית הקריאה: ימים, יעד, עיר */
export function PlanSettings() {
  const s = useAppStore();
  const il = s.calendarMode === 'israel';
  const toggleDay = (d: number) => {
    const next = s.readDays.includes(d) ? s.readDays.filter((x) => x !== d) : [...s.readDays, d].sort();
    if (next.length) s.setPlanPrefs({ readDays: next });
  };
  return (
    <View style={{ gap: 16 }}>
      <View style={{ gap: 8 }}>
        <Label>ימי קריאה</Label>
        <RowWrap>
          {DAYS.map((d, i) => (
            <Chip key={d} on={s.readDays.includes(i)} label={d} a11y={`יום ${d}`} onPress={() => toggleDay(i)} />
          ))}
        </RowWrap>
        <Help>הקריאה מתחלקת שווה בין הימים שבחרת. שישי — רשת ביטחון: אם יום התארך, נציע לפזר גם עליו.</Help>
      </View>

      <View style={{ gap: 8 }}>
        <Label>היעד</Label>
        <RowWrap>
          <Chip on={s.targetMode === 'candles'} label="לפני הדלקת נרות" onPress={() => s.setPlanPrefs({ targetMode: 'candles' })} />
          <Chip on={s.targetMode === 'meal'} label="שבת בבוקר, לפני הסעודה" onPress={() => s.setPlanPrefs({ targetMode: 'meal' })} />
        </RowWrap>
        {s.targetMode === 'meal' ? (
          <RowWrap>
            {MEALS.map((t) => (
              <Chip key={t} on={s.mealTime === t} label={t} a11y={`סעודה בשעה ${t}`} onPress={() => s.setMisc({ mealTime: t })} />
            ))}
          </RowWrap>
        ) : null}
        <Help>
          {'לכתחילה משלימים לפני שבת; מותר עד סעודת שבת בבוקר. בשבוע שהשבת בו חג — היעד הוא השבת הבאה שקוראים בה פרשה. (מי שלא הספיק: משלים אחרי הסעודה עד המנחה, ובדיעבד עד יום רביעי, ויש אומרים עד שמחת תורה — אבל זה לא היעד שנקבע כאן.)'}
        </Help>
      </View>

      <View style={{ gap: 8 }}>
        <Label>עיר לזמני כניסת שבת</Label>
        <RowWrap>
          {CITIES.filter((c) => c.il === il).map((c) => (
            <Chip key={c.id} on={s.cityId === c.id} label={c.he} onPress={() => s.setPlanPrefs({ cityId: c.id })} />
          ))}
        </RowWrap>
      </View>

    </View>
  );
}

/** מתג פשוט: כותרת, הסבר קצר, מופעל/כבוי */
export function ToggleRow({ label, help, on, onChange }: { label: string; help?: string; on: boolean; onChange: (v: boolean) => void }) {
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: on }}
      accessibilityLabel={label}
      onPress={() => onChange(!on)}
      style={{ flexDirection: rtl.row, alignItems: 'center', gap: 12, paddingVertical: 6 }}
    >
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: fonts.uiSemi, fontSize: 16, color: nw.color.ink, writingDirection: 'rtl', textAlign: rtl.textRight }}>{label}</Text>
        {help ? <Help>{help}</Help> : null}
      </View>
      <View style={{ width: 46, height: 28, borderRadius: 14, padding: 3, backgroundColor: on ? nw.color.tealBright : 'rgba(52,86,110,0.22)', alignItems: on ? 'flex-start' : 'flex-end' }}>
        <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: '#fff' }} />
      </View>
    </Pressable>
  );
}

/** תזכורות */
export function NotifySettings() {
  const s = useAppStore();
  return (
    <View style={{ gap: 16 }}>
      <View style={{ gap: 8 }}>
        <Label>תזכורת</Label>
        {notificationsSupported() ? (
          <>
            <RowWrap>
              <Chip
                on={s.notifyOn}
                label={s.notifyOn ? 'פעילה' : 'כבויה'}
                onPress={async () => {
                  if (s.notifyOn) return s.setPlanPrefs({ notifyOn: false });
                  const ok = await requestNotificationPermission();
                  s.setPlanPrefs({ notifyOn: ok });
                }}
              />
            </RowWrap>
            {s.notifyOn ? (
              <RowWrap>
                {TIMES.map((t) => (
                  <Chip key={t} on={s.notifyTime === t} label={t} onPress={() => s.setPlanPrefs({ notifyTime: t })} />
                ))}
              </RowWrap>
            ) : null}
            <Help>אחת ביום, בימי הקריאה שבחרת, ועוד אחת ביום שישי בבוקר אם נשאר משהו. אף פעם לא בשבת או ביום טוב, ולא סמוך להדלקת נרות.</Help>
          </>
        ) : (
          <Help>תזכורות זמינות באפליקציה בטלפון.</Help>
        )}
      </View>
    </View>
  );
}

/** מה מוצג — מתג לכל תוספת */
export function DisplaySettings() {
  const s = useAppStore();
  const f = { ...DEFAULT_FEATURES, ...s.features };
  const T = (k: keyof Features, label: string, help?: string) => (
    <ToggleRow key={k} label={label} help={help} on={f[k]} onChange={(v) => s.setFeature(k, v)} />
  );
  return (
    <View style={{ gap: 4 }}>
      {T('plan', 'תוכנית היום בבית', 'כמה לקרוא היום ועד איפה')}
      {f.plan ? T('ring', 'טבעת הזמן עד שבת') : null}
      {f.plan ? T('catchup', 'הצעה לפזר על שישי', 'כשיום יוצא ארוך מהרגיל') : null}
      {T('specialShabbat', 'שבת מיוחדת', 'מפטיר והפטרה כשהשבת מיוחדת')}
      {T('siyum', 'כרטיסי סיום', 'בסיום חומש או התורה כולה')}
      {T('lessons', 'מה אפשר לקחת לחיים')}
      {T('onkelosBonus', 'מה אונקלוס עשה כאן', 'אקורדיון מתחת לפסוק — נפתח רק בלחיצה')}
      {T('chidushim', 'חידושים בפסוק', 'אקורדיון — רק אם יש תוכן שפורסם')}
      {T('ketiv', 'כתיב לצד הקרי', 'הכתיב קטן ורך; הקרי הוא שנקרא')}
      <View style={{ gap: 8, marginTop: 10 }}>
        <Label>עברית ותרגום — ביטוי מול ביטוי</Label>
        <RowWrap>
          <Chip on={s.alignMode === 'off'} label="כבוי" onPress={() => s.setMisc({ alignMode: 'off' })} />
          <Chip on={s.alignMode === 'changes'} label="רק שינויים" onPress={() => s.setMisc({ alignMode: 'changes' })} />
          <Chip on={s.alignMode === 'all'} label="כל הביטויים" onPress={() => s.setMisc({ alignMode: 'all' })} />
        </RowWrap>
        <Help>לחיצה על ביטוי מסומן בפסוק מראה את המקבילה בתרגום אונקלוס. כרגע בפרשות בראשית ונח.</Help>
        {s.alignMode !== 'off' ? (
          <ToggleRow label="להציג גם טיוטות (לבדיקה)" help="ביטויים שעוד לא אושרו" on={s.alignDrafts} onChange={(v) => s.setMisc({ alignDrafts: v })} />
        ) : null}
      </View>
    </View>
  );
}
