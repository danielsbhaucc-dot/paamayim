import { router } from 'expo-router';
import { MapPin, PartyPopper } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { useStatusLine } from '../greeting/useStatusLine';
import { aliyotCount } from '../greeting/hebrewNumbers';
import { nw } from '../theme/design';
import { fonts } from '../theme/fonts';
import { rtl } from '../theme/rtl';
import { GlassSurface } from './GlassSurface';
import { PrimaryButton } from './PrimaryButton';

/**
 * שורת סטטוס אישית אחרי הברכה: משפט מתחלף + פס התקדמות חי + כפתור המשך.
 * הנתונים מתעדכנים מיד עם כל סימון; המשפט מתחלף רק בפתיחה / חזרה למסך / שינוי מצב.
 */
export function HomeStatus({ wide, style }: { wide?: boolean; style?: StyleProp<ViewStyle> }) {
  const s = useStatusLine();
  if (!s) return null;
  const { progress: p } = s;
  const done = s.category === 'finished';
  return (
    <GlassSurface
      variant="card"
      radius={22}
      tint={done ? 'rgba(227,244,240,0.62)' : undefined}
      style={style}
      contentStyle={[{ padding: wide ? 22 : 16, gap: 12 }, wide && { flexDirection: rtl.row, alignItems: 'center', gap: 24 }]}
    >
      <View style={{ flex: wide ? 1 : undefined, gap: 10 }}>
        <View style={{ flexDirection: rtl.row, gap: 8, alignItems: 'flex-start' }}>
          {done ? <PartyPopper size={22} color={nw.color.tealIcon} strokeWidth={1.75} /> : null}
          <Text
            accessibilityLiveRegion="polite"
            style={[styles.text, wide && { fontSize: 19, lineHeight: 29 }, { flex: 1 }]}
          >
            {s.text}
          </Text>
        </View>
        {s.resume ? <ResumeLine label={s.resume.label} when={s.resume.when} /> : null}
        <View style={{ gap: 6 }}>
          <View style={styles.track} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: p.percent }}>
            <View style={[styles.fill, { width: `${p.percent}%` }]} />
          </View>
          <Text style={styles.caption}>
            {done
              ? `כל ${aliyotCount(p.totalAliyot)} · 100%`
              : `${p.doneAliyot}/${p.totalAliyot} עליות · ${p.percent}%`}
          </Text>
        </View>
      </View>
      <PrimaryButton
        variant="solid"
        title={s.cta}
        style={wide ? { width: 300 } : { width: '100%' }}
        onPress={() => router.push(s.route as never)}
      />
    </GlassSurface>
  );
}

/** ״📍 פרשת בראשית · עלייה שלישית · פסוק י״ב · אתמול״ — המקום השמור, מתעדכן חי */
export function ResumeLine({ label, when, center }: { label: string; when: string; center?: boolean }) {
  return (
    <View
      accessibilityLabel={`המקום שלך: ${label}, ${when}`}
      style={[styles.resume, center && { alignSelf: 'center' }]}
    >
      <MapPin size={15} color={nw.color.tealIcon} strokeWidth={2} />
      <Text style={styles.resumeText} numberOfLines={2}>
        {`${label} · ${when}`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  resume: {
    flexDirection: rtl.row,
    alignItems: 'center',
    alignSelf: rtl.alignRight,
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: nw.color.tealSoft,
    borderWidth: 1,
    borderColor: 'rgba(31,158,140,0.28)',
    maxWidth: '100%',
  },
  resumeText: { fontFamily: fonts.uiSemi, fontSize: 13, lineHeight: 18, color: nw.color.tealText, writingDirection: 'rtl', flexShrink: 1 },
  text: {
    fontFamily: fonts.uiBold,
    fontSize: 17,
    lineHeight: 26,
    color: nw.color.ink,
    textAlign: rtl.textRight,
    writingDirection: 'rtl',
  },
  track: {
    height: 6,
    borderRadius: 3,
    backgroundColor: nw.color.tealSoft, // מסלול בצבע ההתקדמות (לא לבן)
    overflow: 'hidden',
    flexDirection: rtl.row,
  },
  fill: { height: 6, borderRadius: 3, backgroundColor: nw.color.tealBright },
  caption: {
    fontFamily: fonts.uiSemi,
    fontSize: 12,
    color: nw.color.inkMuted,
    textAlign: rtl.textRight,
    writingDirection: 'rtl',
  },
});
