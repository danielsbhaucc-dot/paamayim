import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import {
  BookOpen,
  BookOpenText,
  CalendarDays,
  Map,
  Sunrise,
  Users,
  type LucideIcon,
} from 'lucide-react-native';
import React, { useMemo } from 'react';
import { Text, View } from 'react-native';
import { aliyahProgress, getCurrentParasha, isParashaComplete } from '../data/parashot';
import { useAppStore } from '../store/useAppStore';
import { nw } from '../theme/design';
import { fonts } from '../theme/fonts';
import { img } from '../theme/images';
import { rtl } from '../theme/rtl';
import {
  DayChip,
  GlassSurface,
  PillButton,
  PrimaryButton,
  ProgressRing,
  WaveEdge,
  WideCols,
  WidePage,
  WideSectionTitle,
  useLayout,
  wideText,
} from '../ui';
import { IconBadge } from './parts';

function haftaraBook(source: string): string {
  const match = source.match(/^(.*?)\s+[\u0590-\u05EA״׳]+[:：]/);
  return (match?.[1] ?? source).trim();
}

const FEATURES: { title: string; text: string; Icon: LucideIcon; href: string }[] = [
  { title: 'מסלול עד שבת', text: 'עלייה אחת בכל יום, עד שבת', Icon: Map, href: '/(tabs)/path' },
  { title: 'פסוק־פסוק', text: 'מקרא, מקרא ותרגום אונקלוס', Icon: BookOpen, href: '/reading' },
  { title: 'מצב משפחה', text: 'שני קולות, סיפור אחד', Icon: Users, href: '/(tabs)/family' },
  { title: 'לוח ישראל / חו״ל', text: 'בחירת הלוח וההפטרה', Icon: CalendarDays, href: '/calendar' },
];

/** בית — web רחב: באנר רחב עם כותרת גדולה, פרשה+הפטרה, אריחי פעולה ומסע שבועי. */
export function HomeWide() {
  const router = useRouter();
  const { isDesktop } = useLayout();
  const calendarMode = useAppStore((s) => s.calendarMode);
  const progress = useAppStore((s) => s.progress);
  const lastVerseId = useAppStore((s) => s.lastVerseId);
  const activeAliyah = useAppStore((s) => s.activeAliyah);
  const setActiveAliyah = useAppStore((s) => s.setActiveAliyah);

  const parasha = useMemo(() => getCurrentParasha(calendarMode), [calendarMode]);
  const doneAll = useMemo(() => isParashaComplete(parasha, progress), [parasha, progress]);
  const ratios = useMemo(() => {
    const map: Record<number, number> = {};
    for (const a of parasha.aliyot) map[a.id] = aliyahProgress(a.verseIds, progress).ratio;
    return map;
  }, [parasha, progress]);
  const completedDays = Object.values(ratios).filter((r) => r >= 1).length;
  const haftaraSource =
    calendarMode === 'israel' ? parasha.haftara.sourceIsrael : parasha.haftara.sourceDiaspora;

  const continueReading = () => (doneAll ? router.push('/completion') : router.push('/reading'));
  const heroH = isDesktop ? 420 : 340;

  return (
    <WidePage>
      {/* באנר רחב */}
      <View style={{ height: heroH, marginTop: 8 }}>
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            overflow: 'hidden',
          }}
        >
          <Image
            source={img.homeHeroTree}
            contentFit="cover"
            contentPosition="left"
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          />
        </View>
        <WaveEdge />
        <GlassSurface
          variant="card"
          radius={26}
          style={{
            position: 'absolute',
            top: 32,
            bottom: 72,
            right: isDesktop ? 40 : 28,
            width: isDesktop ? '44%' : '56%',
          }}
          contentStyle={{ alignItems: 'center', justifyContent: 'center', padding: 24 }}
        >
          <Text style={{ fontFamily: fonts.uiSemi, fontSize: 18, color: nw.color.inkSoft, writingDirection: 'rtl' }}>
            פרשת השבוע
          </Text>
          <Text
            accessibilityRole="header"
            style={{
              ...nw.type.parashaName,
              fontSize: isDesktop ? 64 : 50,
              lineHeight: isDesktop ? 76 : 60,
              color: nw.color.ink,
              textAlign: 'center',
              writingDirection: 'rtl',
            }}
          >
            {parasha.name}
          </Text>
          <GlassSurface
            variant="subtle"
            radius={nw.radius.pill}
            padded={false}
            shadow="none"
            style={{ marginTop: 10, alignSelf: 'center' }}
            contentStyle={{ paddingVertical: 6, paddingHorizontal: 18 }}
          >
            <Text style={{ ...nw.type.label, color: nw.color.inkSoft, writingDirection: 'rtl' }}>
              {parasha.rangeLabel}
            </Text>
          </GlassSurface>
          <PrimaryButton
            variant="solid"
            title={lastVerseId ? 'המשך מאיפה שעצרת' : 'למסלול הקריאה'}
            style={{ marginTop: 22, width: '100%', maxWidth: 320, alignSelf: 'center' }}
            onPress={continueReading}
          />
        </GlassSurface>
      </View>

      {/* פרשה + הפטרה זו לצד זו */}
      <WideCols style={{ marginTop: 16 }}>
        <StoryCard
          Icon={BookOpenText}
          kicker="הפרשה"
          title={`פרשת ${parasha.name}`}
          meta={parasha.rangeLabel}
          lead={parasha.story.title}
          body={parasha.story.adult}
          cta="קרא את סיפור הפרשה"
          onPress={() => router.push({ pathname: '/story', params: { kind: 'parasha' } })}
        />
        <StoryCard
          Icon={Sunrise}
          kicker="ההפטרה"
          title={haftaraBook(haftaraSource)}
          meta={haftaraSource}
          lead="סיפור ההפטרה"
          body={parasha.haftara.storyAdult}
          cta="קרא את סיפור ההפטרה"
          onPress={() => router.push({ pathname: '/story', params: { kind: 'haftara' } })}
        />
      </WideCols>

      {/* אריחי פעולה */}
      <WideSectionTitle>מה עושים השבוע</WideSectionTitle>
      <View style={{ flexDirection: rtl.row, flexWrap: 'wrap', gap: 20 }}>
        {FEATURES.map(({ title, text, Icon, href }) => (
          <GlassSurface
            key={href}
            variant="card"
            radius={22}
            onPress={() => router.push(href as never)}
            accessibilityLabel={title}
            style={{ flexBasis: isDesktop ? '22%' : '46%', flexGrow: 1 }}
            contentStyle={{ padding: 20, gap: 10, alignItems: rtl.alignRight }}
          >
            <IconBadge Icon={Icon} />
            <Text style={{ ...nw.type.h3, color: nw.color.ink, textAlign: rtl.textRight, writingDirection: 'rtl' }}>
              {title}
            </Text>
            <Text style={{ ...nw.type.bodySm, color: nw.color.inkSoft, textAlign: rtl.textRight, writingDirection: 'rtl' }}>
              {text}
            </Text>
          </GlassSurface>
        ))}
      </View>

      {/* המסע השבועי */}
      <WideSectionTitle>המסע השבועי</WideSectionTitle>
      <GlassSurface variant="card" radius={24} contentStyle={{ padding: 22 }}>
        <WideCols stack={!isDesktop} gap={22} align="center">
          <View style={{ flexDirection: rtl.row, alignItems: 'center', gap: 16 }}>
            <ProgressRing current={completedDays} total={7} />
            <View>
              <Text style={{ ...nw.type.h2, color: nw.color.ink, textAlign: rtl.textRight, writingDirection: 'rtl' }}>
                {`עלייה ${activeAliyah}`}
              </Text>
              <Text style={{ ...nw.type.body, color: nw.color.inkSoft, textAlign: rtl.textRight, writingDirection: 'rtl' }}>
                {`${completedDays} מתוך 7 עליות הושלמו`}
              </Text>
            </View>
          </View>
          <View style={{ flex: isDesktop ? 1 : undefined, flexDirection: rtl.row, gap: 8 }}>
            {parasha.aliyot.map((a) => (
              <DayChip
                key={a.id}
                top={a.dayShort === 'ש׳' ? 'שבת' : `יום ${a.dayShort}`}
                bottom="עלייה"
                active={a.id === activeAliyah}
                done={(ratios[a.id] ?? 0) >= 1}
                onPress={() => setActiveAliyah(a.id)}
              />
            ))}
          </View>
          <PrimaryButton
            title="לפסוק הבא"
            icon="arrow"
            style={{ width: isDesktop ? 240 : '100%' }}
            onPress={() =>
              router.push({ pathname: '/reading', params: { aliyah: String(activeAliyah) } })
            }
          />
        </WideCols>
      </GlassSurface>
    </WidePage>
  );
}

function StoryCard({
  Icon,
  kicker,
  title,
  meta,
  lead,
  body,
  cta,
  onPress,
}: {
  Icon: LucideIcon;
  kicker: string;
  title: string;
  meta: string;
  lead: string;
  body: string;
  cta: string;
  onPress: () => void;
}) {
  return (
    <GlassSurface
      variant="card"
      radius={24}
      onPress={onPress}
      accessibilityLabel={title}
      style={{ flex: 1 }}
      contentStyle={{ padding: 24 }}
    >
      <View style={{ flexDirection: rtl.row, alignItems: 'center', gap: 14 }}>
        <IconBadge Icon={Icon} />
        <View style={{ flex: 1 }}>
          <Text style={{ ...nw.type.label, color: nw.color.tealIcon, textAlign: rtl.textRight, writingDirection: 'rtl' }}>
            {kicker}
          </Text>
          <Text style={{ ...nw.type.h2, color: nw.color.ink, textAlign: rtl.textRight, writingDirection: 'rtl' }}>
            {title}
          </Text>
        </View>
      </View>
      <Text numberOfLines={1} style={{ ...nw.type.label, color: nw.color.inkMuted, textAlign: rtl.textRight, writingDirection: 'rtl', marginTop: 10 }}>
        {meta}
      </Text>
      <Text style={{ ...wideText(nw.type.bodyStrong), color: nw.color.ink, marginTop: 14 }}>{lead}</Text>
      <Text numberOfLines={3} style={{ ...wideText(nw.type.bodySm), color: nw.color.inkSoft, marginTop: 6 }}>
        {body}
      </Text>
      <PillButton title={cta} style={{ marginTop: 18 }} onPress={onPress} />
    </GlassSurface>
  );
}
