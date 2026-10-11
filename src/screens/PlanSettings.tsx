import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { CITIES } from '../schedule/calendar';
import { notificationsSupported, requestNotificationPermission } from '../schedule/notify';
import { useAppStore } from '../store/useAppStore';
import { nw } from '../theme/design';
import { fonts } from '../theme/fonts';
import { rtl } from '../theme/rtl';

const DAYS = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳'];
const TIMES = ['07:00', '13:00', '20:30', '22:00'];

function Chip({ on, label, onPress, a11y }: { on: boolean; label: string; onPress: () => void; a11y?: string }) {
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

const Label = ({ children }: { children: string }) => (
  <Text style={{ fontFamily: fonts.uiBold, fontSize: 16, color: nw.color.ink, writingDirection: 'rtl', textAlign: rtl.textRight }}>{children}</Text>
);
const Help = ({ children }: { children: string }) => (
  <Text style={{ fontFamily: fonts.ui, fontSize: 14, lineHeight: 21, color: nw.color.inkSoft, writingDirection: 'rtl', textAlign: rtl.textRight }}>{children}</Text>
);
const RowWrap = ({ children }: { children: React.ReactNode }) => (
  <View style={{ flexDirection: rtl.row, flexWrap: 'wrap', gap: 8 }}>{children}</View>
);

/** תוכנית הקריאה: ימים, יעד, עיר, תזכורות */
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
