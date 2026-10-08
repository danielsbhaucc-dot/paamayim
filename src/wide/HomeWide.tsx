import { useRouter } from 'expo-router';
import {
  BookOpenText,
  Sunrise,
  type LucideIcon,
} from 'lucide-react-native';
import React, { useMemo } from 'react';
import { Text, View } from 'react-native';
import { aliyahProgress } from '../data/parashot';
import { useAppStore } from '../store/useAppStore';
import { nw } from '../theme/design';
import { rtl } from '../theme/rtl';
import {
  DayChip,
  GlassSurface,
  LifeLessonsCard,
  NamePrompt,
  PillButton,
  PrimaryButton,
  ProgressRing,
  WideCols,
  WidePage,
  WideSectionTitle,
  useLayout,
  wideText,
} from '../ui';
import { IconBadge } from './parts';
import { HomeHero } from './HomeHero';
import { lifeLessonsFor, useParasha } from '../content';
import { useG } from '../greeting/useG';
import { UI } from '../greeting/uiTexts';

function haftaraBook(source: string): string {
  const match = source.match(/^(.*?)\s+[\u0590-\u05EA״׳]+[:：]/);
  return (match?.[1] ?? source).trim();
}


/** בית — web רחב: באנר רחב עם כותרת גדולה, פרשה+הפטרה, אריחי פעולה ומסע שבועי. */
export function HomeWide() {
  const router = useRouter();
  const { isDesktop } = useLayout();
  const calendarMode = useAppStore((s) => s.calendarMode);
  const progress = useAppStore((s) => s.progress);
  const activeAliyah = useAppStore((s) => s.activeAliyah);
  const setActiveAliyah = useAppStore((s) => s.setActiveAliyah);

  const familyVoice = useAppStore((s) => s.familyVoice);
  const parasha = useParasha(calendarMode);
  const t = useG();
  const lessons = useMemo(() => lifeLessonsFor(parasha, familyVoice), [parasha, familyVoice]);
  const ratios = useMemo(() => {
    const map: Record<number, number> = {};
    for (const a of parasha.aliyot) map[a.id] = aliyahProgress(a.verseIds, progress).ratio;
    return map;
  }, [parasha, progress]);
  const completedDays = Object.values(ratios).filter((r) => r >= 1).length;
  const haftaraSource =
    calendarMode === 'israel' ? parasha.haftara.sourceIsrael : parasha.haftara.sourceDiaspora;


  return (
    <WidePage>
      {/* פתיחה: ברכה + סטטוס, כרטיסי זכוכית (המרכזי זוהר), כפתור המשך ופס גל */}
      <HomeHero />
      <NamePrompt style={{ marginBottom: 8, maxWidth: 560, alignSelf: 'center', width: '100%' }} />

      {/* פרשה + הפטרה זו לצד זו */}
      <WideCols style={{ marginTop: 16 }}>
        <StoryCard
          Icon={BookOpenText}
          kicker="הפרשה"
          title={`פרשת ${parasha.name}`}
          meta={parasha.rangeLabel}
          lead={parasha.story.title}
          body={parasha.story.adult}
          cta={t(UI.readParashaStory)}
          onPress={() => router.push({ pathname: '/story', params: { kind: 'parasha' } })}
        />
        <StoryCard
          Icon={Sunrise}
          kicker="ההפטרה"
          title={haftaraBook(haftaraSource)}
          meta={haftaraSource}
          lead="סיפור ההפטרה"
          body={parasha.haftara.storyAdult}
          cta={t(UI.readHaftaraStory)}
          onPress={() => router.push({ pathname: '/story', params: { kind: 'haftara' } })}
        />
      </WideCols>

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

      {/* מה אפשר לקחת לחיים — רק כשיש תוכן מפורסם */}
      {lessons.length ? (
        <>
          <WideSectionTitle>לקחת איתך לשבוע</WideSectionTitle>
          <LifeLessonsCard
            items={lessons}
            wide
            columns={isDesktop && lessons.length === 4 ? 4 : 2}
            child={familyVoice === 'child' && Boolean(parasha.extras?.lifeLessons?.child?.length)}
          />
        </>
      ) : null}
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
          <Text style={{ ...nw.type.label, color: nw.color.tealText, textAlign: rtl.textRight, writingDirection: 'rtl' }}>
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
