import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { ArrowLeft, BookOpenText, Library, Map, Sunrise, Users, type LucideIcon } from 'lucide-react-native';
import React from 'react';
import { Platform, Pressable, Text, View, type ViewStyle } from 'react-native';
import { useParasha, useParashaEyebrow, useWeekParasha } from '../content';
import { useGreeting } from '../greeting/useGreeting';
import { useStatusLine } from '../greeting/useStatusLine';
import { useAppStore } from '../store/useAppStore';
import { nw, pearl } from '../theme/design';
import { fonts } from '../theme/fonts';
import { img } from '../theme/images';
import { rtl } from '../theme/rtl';
import { frostText } from '../ui/frostText';
import { GlassSurface } from '../ui/GlassSurface';
import { ParashaDot } from '../ui/ParashaDot';
import { parashaHue } from '../theme/parashaColors';
import { PrimaryButton } from '../ui/PrimaryButton';
import { NamePrompt, PersonalizeButton } from '../ui/Greeting';
import { ResumeLine } from '../ui/HomeStatus';
import { useLayout } from '../ui/useLayout';
import { WaveBand } from '../ui/WaveBand';
import { WIDE_HERO_TREE } from './heroTree';
import { IconBadge } from './parts';

const center: ViewStyle = { alignItems: 'center' };
const T = { textAlign: 'center' as const, writingDirection: 'rtl' as const };

/** הילה טורקיזית רכה לכרטיס המרכזי */
const GLOW: ViewStyle =
  Platform.OS === 'android'
    ? { elevation: 12 }
    : { shadowColor: nw.color.tealBright, shadowOpacity: 0.42, shadowRadius: 40, shadowOffset: { width: 0, height: 8 } };

type Feature = { key: string; title: string; text: string; Icon: LucideIcon; onPress: () => void };

/**
 * פתיחת דף הבית במסכים רחבים: עלה + ברכה + משפט סטטוס, שורת כרטיסי זכוכית
 * (המרכזי — פרשת השבוע — גדול וזוהר), כפתור המשך, ופס גל עם העלה.
 */
export function HomeHero() {
  const router = useRouter();
  const { isDesktop } = useLayout();
  const mode = useAppStore((s) => s.calendarMode);
  const picked = useAppStore((s) => s.pickedParashaId);
  const setPicked = useAppStore((s) => s.setPickedParashaId);
  const parasha = useParasha(mode);
  const accent = parashaHue(parasha.id);
  const week = useWeekParasha(mode);
  const eyebrow = useParashaEyebrow(mode);
  const g = useGreeting();
  const status = useStatusLine();
  const haftara = mode === 'israel' ? parasha.haftara.sourceIsrael : parasha.haftara.sourceDiaspora;
  const p = status?.progress;

  const left: Feature[] = [
    { key: 'haftara', title: 'סיפור ההפטרה', text: haftara.split(/\s+[\u05d0-\u05ea״׳]+[:：]/)[0], Icon: Sunrise, onPress: () => router.push({ pathname: '/story', params: { kind: 'haftara' } }) },
    { key: 'family', title: 'מצב משפחה', text: 'שני קולות, סיפור אחד — למבוגרים ולילדים', Icon: Users, onPress: () => router.push('/(tabs)/family' as never) },
  ];
  const right: Feature[] = [
    { key: 'story', title: 'סיפור הפרשה', text: parasha.story.title, Icon: BookOpenText, onPress: () => router.push({ pathname: '/story', params: { kind: 'parasha' } }) },
    { key: 'path', title: 'מסלול עד שבת', text: p ? `${p.doneAliyot} מתוך ${p.totalAliyot} עליות הושלמו` : 'עלייה אחת בכל יום, עד שבת', Icon: Map, onPress: () => router.push('/(tabs)/path' as never) },
  ];
  // RTL: הילד הראשון בשורה מוצג מימין
  const row: (Feature | 'center')[] = isDesktop
    ? [right[0], right[1], 'center', left[0], left[1]]
    : [right[0], 'center', left[0]];

  return (
    <View style={{ paddingTop: isDesktop ? 18 : 10 }}>
      {WIDE_HERO_TREE === 'background' ? (
        <View
          pointerEvents="none"
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={{ position: 'absolute', top: isDesktop ? -10 : 0, left: 0, right: 0, alignItems: 'center' }}
        >
          <Image source={img.homeHeroTreeSoft} style={{ width: '100%', maxWidth: 1180, aspectRatio: 1000 / 671 }} contentFit="contain" />
        </View>
      ) : null}
      {/* כותרת */}
      <View style={[center, { gap: 6, paddingHorizontal: 12 }]}>
        <Image source={img.logoMark} style={{ width: 46, height: 48 }} contentFit="contain" />
        <View style={{ flexDirection: rtl.row, alignItems: 'center', gap: 10 }}>
          <Text accessibilityRole="header" style={{ ...T, fontFamily: fonts.uiExtra, fontSize: isDesktop ? 46 : 36, lineHeight: isDesktop ? 56 : 46, color: nw.color.ink, ...frostText }}>
            {g.line1}
          </Text>
          <PersonalizeButton />
        </View>
        {g.line2 ? (
          <Text style={{ ...T, fontFamily: g.solemn ? fonts.uiSemi : fonts.uiBold, fontSize: g.solemn ? 18 : 22, lineHeight: 30, color: g.solemn ? nw.color.inkSoft : nw.color.teal, maxWidth: 760 }}>
            {g.line2}
          </Text>
        ) : null}
        {status ? (
          <Text accessibilityLiveRegion="polite" style={{ ...T, fontFamily: fonts.uiSemi, fontSize: isDesktop ? 20 : 18, lineHeight: isDesktop ? 32 : 28, color: nw.color.inkSoft, maxWidth: 760, marginTop: 6 }}>
            {status.text}
          </Text>
        ) : null}
        {status?.resume ? <ResumeLine label={status.resume.label} when={status.resume.when} center /> : null}
        <NamePrompt style={{ marginTop: 12 }} />
      </View>

      {/* כרטיסים */}
      <View style={{ flexDirection: rtl.row, alignItems: 'center', gap: isDesktop ? 20 : 16, marginTop: isDesktop ? 34 : 26 }}>
        {row.map((f) =>
          f === 'center' ? (
            <GlassSurface
              key="center"
              variant="frost"
              radius={30}
              shadow="none"
              borderColor={pearl(0.95)}
              borderWidth={1.5}
              onPress={() => (status ? router.push(status.route as never) : router.push('/reading'))}
              accessibilityLabel={`${eyebrow}: ${parasha.name}`}
              style={[GLOW, { flex: isDesktop ? 1.3 : 1.4, minHeight: isDesktop ? 300 : 280 }]}
              contentStyle={[center, { justifyContent: 'center', padding: isDesktop ? 26 : 22, gap: 6 }]}
            >
              {accent ? (
                <View
                  pointerEvents="none"
                  style={{ position: 'absolute', top: -60, ...rtl.right(-60), width: 240, height: 240, borderRadius: 120, backgroundColor: accent.wash }}
                />
              ) : null}
              {WIDE_HERO_TREE === 'card' ? (
                <Image
                  source={img.homeHeroTreeThumb}
                  accessible={false}
                  style={{ width: isDesktop ? 156 : 132, height: isDesktop ? 104 : 88, borderRadius: 20, borderWidth: 1.5, borderColor: pearl(0.95) }}
                  contentFit="cover"
                />
              ) : (
                <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: nw.color.mint, borderWidth: 1, borderColor: nw.surface.border, alignItems: 'center', justifyContent: 'center' }}>
                  <Image source={img.logoMark} style={{ width: 35, height: 36 }} contentFit="contain" />
                </View>
              )}
              <Text style={{ ...T, fontFamily: fonts.uiSemi, fontSize: 16, color: nw.color.ink, marginTop: 4 }}>{eyebrow}</Text>
              <View style={{ flexDirection: rtl.row, alignItems: 'center', gap: 10 }}>
                <ParashaDot id={parasha.id} size={isDesktop ? 16 : 14} />
                <Text style={{ ...T, ...nw.type.parashaName, fontSize: isDesktop ? 50 : 42, lineHeight: isDesktop ? 60 : 52, color: nw.color.ink, ...frostText }}>
                  {parasha.name}
                </Text>
              </View>
              <Text style={{ ...T, ...nw.type.label, color: accent ? accent.ink : nw.color.ink }}>{parasha.rangeLabel}</Text>
              {p ? (
                <View style={{ alignSelf: 'stretch', marginTop: 12, gap: 6 }}>
                  <View style={{ height: 6, borderRadius: 3, backgroundColor: nw.color.tealSoft, overflow: 'hidden', flexDirection: rtl.row }}>
                    <View style={{ width: `${p.percent}%`, height: 6, borderRadius: 3, backgroundColor: accent ? accent.solid : nw.color.tealBright }} />
                  </View>
                  <Text style={{ ...T, fontFamily: fonts.uiSemi, fontSize: 12, color: nw.color.inkMuted }}>
                    {`${p.doneAliyot}/${p.totalAliyot} עליות · ${p.percent}%`}
                  </Text>
                </View>
              ) : null}
            </GlassSurface>
          ) : (
            <FeatureCard key={f.key} f={f} />
          ),
        )}
      </View>

      {/* כפתור המשך + כל הפרשות */}
      <View style={[center, { marginTop: 30, gap: 12 }]}>
        {status ? (
          <PrimaryButton variant="solid" title={status.cta} style={{ width: 340, alignSelf: 'center' }} onPress={() => router.push(status.route as never)} />
        ) : null}
        <View style={{ flexDirection: rtl.row, gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
          <SmallPill Icon={Library} label="כל הפרשות" onPress={() => router.push('/parashot' as never)} />
          {picked && picked !== week.id ? (
            <SmallPill label={`חזרה לפרשת השבוע (${week.name})`} onPress={() => setPicked(null)} />
          ) : null}
        </View>
      </View>

      <WaveBand />
    </View>
  );
}

function FeatureCard({ f }: { f: Feature }) {
  return (
    <GlassSurface
      variant="card"
      radius={26}
      onPress={f.onPress}
      accessibilityLabel={f.title}
      style={{ flex: 1, minHeight: 240 }}
      contentStyle={[center, { justifyContent: 'center', padding: 20, gap: 8 }]}
    >
      <IconBadge Icon={f.Icon} size={52} />
      <Text style={{ ...T, ...nw.type.h3, fontSize: 19, color: nw.color.ink, marginTop: 4 }}>{f.title}</Text>
      <Text numberOfLines={3} style={{ ...T, ...nw.type.bodySm, color: nw.color.inkSoft }}>
        {f.text}
      </Text>
      <View style={{ marginTop: 6, width: 44, height: 28, borderRadius: 14, backgroundColor: nw.surface.chip, borderWidth: 1, borderColor: nw.surface.border, alignItems: 'center', justifyContent: 'center' }}>
        <ArrowLeft size={16} color={nw.color.teal} strokeWidth={2} />
      </View>
    </GlassSurface>
  );
}

function SmallPill({ label, onPress, Icon }: { label: string; onPress: () => void; Icon?: LucideIcon }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => ({
        flexDirection: rtl.row,
        alignItems: 'center',
        gap: 6,
        height: 36,
        paddingHorizontal: 14,
        borderRadius: 18,
        backgroundColor: nw.surface.chip,
        borderWidth: 1,
        borderColor: nw.surface.border,
        opacity: pressed ? 0.85 : 1,
      })}
    >
      {Icon ? <Icon size={16} color={nw.color.tealIcon} strokeWidth={1.9} /> : null}
      <Text style={{ fontFamily: fonts.uiBold, fontSize: 13, color: nw.color.ink, writingDirection: 'rtl' }}>{label}</Text>
    </Pressable>
  );
}
