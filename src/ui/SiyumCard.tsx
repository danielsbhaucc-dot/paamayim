import { gematriya } from '@hebcal/core';
import { Image as ExpoImage } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { forwardRef } from 'react';
import { Pressable, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { BOOK_HE, consecutiveTorahYears } from '../schedule/siyum';
import { useAppStore, useFeature } from '../store/useAppStore';
import { nw } from '../theme/design';
import { fonts } from '../theme/fonts';
import { img } from '../theme/images';
import { rtl } from '../theme/rtl';
import { GlassSurface } from './GlassSurface';

export type SiyumData = { key: string; book: string; year: number; parashot: number };

export function siyumLines(s: SiyumData, all: { book: string; year: number }[]) {
  const title = s.book === 'torah' ? 'סיימתי את התורה כולה' : `סיימתי חומש ${BOOK_HE[s.book]}`;
  const parashot = s.book === 'torah' ? 'כל פרשות השנה' : `${s.parashot} ${s.parashot === 1 ? 'פרשה' : 'פרשות'}`;
  const detail = `${parashot} · שניים מקרא ואחד תרגום`;
  const years = s.book === 'torah' ? consecutiveTorahYears(all, s.year) : 0;
  const year = `שנת ${gematriya(s.year)}`;
  const streak = years >= 2 ? `השנה ה-${years} ברציפות` : '';
  return { title, detail, year, streak };
}

/** הכרטיס עצמו (גם לצילום לשיתוף) — צנוע: לוגו, שורה אחת, נתון אחד. בלי קונפטי ובלי תגים. */
export const SiyumCardView = forwardRef<View, { s: SiyumData; all: { book: string; year: number }[] }>(function SiyumCardView({ s, all }, ref) {
  const l = siyumLines(s, all);
  const t = { writingDirection: 'rtl' as const, textAlign: 'center' as const };
  return (
    <View
      ref={ref}
      collapsable={false}
      accessible
      accessibilityLabel={`${l.title}. ${l.detail}. ${l.year}. ${l.streak}`}
      style={{ width: 340, aspectRatio: 4 / 5, borderRadius: 28, overflow: 'hidden', backgroundColor: '#F6F3EC', alignItems: 'center', justifyContent: 'center', padding: 28, borderWidth: 1, borderColor: 'rgba(31,158,140,0.25)' }}
    >
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 175, backgroundColor: 'rgba(31,158,140,0.08)' }} />
      <ExpoImage source={img.logoMark} style={{ width: 84, height: 84 }} contentFit="contain" />
      <Text style={{ ...t, fontFamily: fonts.uiExtra, fontSize: 28, lineHeight: 36, color: '#14284B', marginTop: 22 }}>{l.title}</Text>
      <View style={{ width: 48, height: 2, backgroundColor: nw.color.tealBright, borderRadius: 1, marginVertical: 16, opacity: 0.6 }} />
      <Text style={{ ...t, fontFamily: fonts.uiSemi, fontSize: 17, lineHeight: 25, color: nw.color.tealText }}>{l.detail}</Text>
      <Text style={{ ...t, fontFamily: fonts.ui, fontSize: 15, lineHeight: 22, color: nw.color.inkSoft, marginTop: 8 }}>{l.year}</Text>
      {l.streak ? <Text style={{ ...t, fontFamily: fonts.ui, fontSize: 15, color: nw.color.inkSoft, marginTop: 2 }}>{l.streak}</Text> : null}
      <Text style={{ ...t, fontFamily: fonts.uiSemi, fontSize: 13, color: 'rgba(20,40,75,0.55)', position: 'absolute', bottom: 18 }}>נהורא · שניים מקרא ואחד תרגום</Text>
    </View>
  );
});

/** פס צנוע במסך הבית כשיש סיום חדש */
export function SiyumBanner({ style }: { style?: StyleProp<ViewStyle> }) {
  const router = useRouter();
  const pending = useAppStore((s) => s.pendingSiyum);
  const siyumim = useAppStore((s) => s.siyumim);
  const clear = useAppStore((s) => s.clearPendingSiyum);
  const on = useFeature('siyum');
  const s = siyumim.find((x) => x.key === pending);
  if (!s || !on) return null;
  const l = siyumLines(s, siyumim);
  return (
    <GlassSurface variant="card" radius={22} style={style} contentStyle={{ padding: 16, flexDirection: rtl.row, alignItems: 'center', gap: 12 }}>
      <ExpoImage source={img.logoMark} style={{ width: 40, height: 40 }} contentFit="contain" />
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: fonts.uiBold, fontSize: 17, color: nw.color.ink, writingDirection: 'rtl', textAlign: rtl.textRight }}>{`${l.title} — יישר כוח`}</Text>
        <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/siyum', params: { key: s.key } })} hitSlop={8}>
          <Text style={{ fontFamily: fonts.uiSemi, fontSize: 15, color: nw.color.tealText, writingDirection: 'rtl', textAlign: rtl.textRight, marginTop: 2 }}>לכרטיס הסיום ›</Text>
        </Pressable>
      </View>
      <Pressable accessibilityRole="button" accessibilityLabel="סגירה" onPress={clear} hitSlop={10}>
        <Text style={{ fontSize: 20, color: nw.color.inkSoft }}>×</Text>
      </Pressable>
    </GlassSurface>
  );
}
