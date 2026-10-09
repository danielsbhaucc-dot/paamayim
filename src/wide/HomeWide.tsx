import { useRouter } from 'expo-router';
import {
  BookOpenText,
  Sunrise,
  type LucideIcon,
} from 'lucide-react-native';
import React, { useMemo } from 'react';
import { Text, View } from 'react-native';
import { useAppStore } from '../store/useAppStore';
import { nw } from '../theme/design';
import { rtl } from '../theme/rtl';
import {
  GlassSurface,
  LifeLessonsCard,
  PillButton,
  WeeklyJourney,
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

  const familyVoice = useAppStore((s) => s.familyVoice);
  const parasha = useParasha(calendarMode);
  const t = useG();
  const lessons = useMemo(() => lifeLessonsFor(parasha, familyVoice), [parasha, familyVoice]);
  const haftaraSource =
    calendarMode === 'israel' ? parasha.haftara.sourceIsrael : parasha.haftara.sourceDiaspora;


  return (
    <WidePage>
      {/* פתיחה: ברכה + סטטוס, כרטיסי זכוכית (המרכזי זוהר), כפתור המשך ופס גל */}
      <HomeHero />

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

      {/* מסלול עד שבת — תוכנית הקריאה השבועית */}
      <WeeklyJourney parasha={parasha} wide style={{ marginTop: 28 }} />

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
