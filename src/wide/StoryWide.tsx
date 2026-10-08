import { useRouter } from 'expo-router';
import { Smile, User } from 'lucide-react-native';
import React, { useMemo } from 'react';
import { Text, View } from 'react-native';
import { getCurrentParasha } from '../data/parashot';
import { useAppStore } from '../store/useAppStore';
import { nw } from '../theme/design';
import { img } from '../theme/images';
import { rtl } from '../theme/rtl';
import {
  GlassSurface,
  IllustrationCard,
  PrimaryButton,
  SegmentedTabs,
  WideCols,
  WidePage,
  useLayout,
  wideText,
} from '../ui';

type Props = { kind: 'parasha' | 'haftara'; setKind: (k: 'parasha' | 'haftara') => void };

/** סיפור הפרשה / ההפטרה — web רחב: טקסט מימין (שורה מוגבלת), איור ופרטים משמאל. */
export function StoryWide({ kind, setKind }: Props) {
  const router = useRouter();
  const { isDesktop } = useLayout();
  const calendarMode = useAppStore((s) => s.calendarMode);
  const familyVoice = useAppStore((s) => s.familyVoice);
  const setFamilyVoice = useAppStore((s) => s.setFamilyVoice);
  const parasha = useMemo(() => getCurrentParasha(calendarMode), [calendarMode]);
  const isChild = familyVoice === 'child';
  const isHaftara = kind === 'haftara';
  const story = parasha.story;
  const body = isChild ? story.child : story.adult;
  const para1 = isChild ? parasha.haftara.storyChild : parasha.haftara.storyAdult;
  const why =
    calendarMode === 'israel'
      ? parasha.haftara.whyThisHaftara.israel
      : parasha.haftara.whyThisHaftara.diaspora;
  const source =
    calendarMode === 'israel' ? parasha.haftara.sourceIsrael : parasha.haftara.sourceDiaspora;

  const goVerses = () =>
    kind === 'parasha'
      ? router.push({ pathname: '/reading', params: { focus: parasha.story.verseIds.join(',') } })
      : router.push('/reading');

  const text = (
    <GlassSurface variant="strong" radius={26} style={{ flex: 1.25 }} contentStyle={{ padding: isDesktop ? 32 : 24 }}>
      {!isHaftara ? (
        <>
          <SegmentedTabs
            size="md"
            options={[
              { id: 'adult', label: 'מבוגר', Icon: User },
              { id: 'child', label: 'ילד/ה', Icon: Smile },
            ]}
            value={familyVoice}
            onChange={(id) => setFamilyVoice(id as 'adult' | 'child')}
            style={{ maxWidth: 360, alignSelf: rtl.alignRight, width: '100%' }}
          />
          <Text style={{ ...wideText(nw.type.label), color: nw.color.tealIcon, marginTop: 22 }}>
            {`פרשת ${parasha.name}`}
          </Text>
          <Text accessibilityRole="header" style={{ ...wideText(nw.type.h2), fontSize: 30, lineHeight: 40, color: nw.color.ink, marginTop: 2 }}>
            {story.title}
          </Text>
          <Text style={{ ...wideText(nw.type.body), fontSize: 18, lineHeight: 32, color: nw.color.inkSoft, marginTop: 14 }}>
            {body}
          </Text>
        </>
      ) : (
        <>
          {parasha.haftara.specialReason ? (
            <Text style={{ ...wideText(nw.type.label), color: nw.color.tealIcon }}>
              {parasha.haftara.specialReason}
            </Text>
          ) : null}
          <Text accessibilityRole="header" style={{ ...wideText(nw.type.h2), fontSize: 30, lineHeight: 40, color: nw.color.ink, marginTop: 2 }}>
            למה קוראים דווקא את ההפטרה הזו?
          </Text>
          <Text style={{ ...wideText(nw.type.body), fontSize: 18, lineHeight: 32, color: nw.color.inkSoft, marginTop: 12 }}>
            {why}
          </Text>
          {para1.trim() ? (
            <>
              <Text accessibilityRole="header" style={{ ...wideText(nw.type.h3), fontSize: 21, lineHeight: 28, color: nw.color.ink, marginTop: 24 }}>
                מה מסופר בהפטרה
              </Text>
              <Text style={{ ...wideText(nw.type.body), fontSize: 18, lineHeight: 32, color: nw.color.inkSoft, marginTop: 8 }}>
                {para1}
              </Text>
            </>
          ) : null}
        </>
      )}
      <PrimaryButton
        title="מעבר לפסוקים"
        icon="chevron"
        style={{ marginTop: 28, width: '100%', maxWidth: 360, alignSelf: rtl.alignRight }}
        onPress={goVerses}
      />
    </GlassSurface>
  );

  const side = (
    <View style={{ flex: 1, gap: 20 }}>
      <GlassSurface variant="strong" radius={26} contentStyle={{ padding: 14 }}>
        <IllustrationCard
          source={isHaftara ? img.haftaraProphet : isChild ? img.familyChild : img.familyAdult}
          aspectRatio={4 / 3}
          radius={18}
        />
      </GlassSurface>
      <GlassSurface variant="card" radius={22} contentStyle={{ padding: 22, gap: 8 }}>
        <Text style={{ ...wideText(nw.type.h3), color: nw.color.ink }}>
          {isHaftara ? 'הקשר לפרשה' : 'על הפרשה'}
        </Text>
        {isHaftara ? (
          parasha.haftara.connectionPoints.map((p) => (
            <View key={p} style={{ flexDirection: rtl.row, gap: 10, alignItems: 'center' }}>
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: nw.color.tealIcon }} />
              <Text style={{ ...wideText(nw.type.bodySm), color: nw.color.inkSoft, flex: 1 }}>{p}</Text>
            </View>
          ))
        ) : (
          <Text style={{ ...wideText(nw.type.bodySm), color: nw.color.inkSoft }}>
            {`פרשת ${parasha.name} · ${parasha.rangeLabel}`}
          </Text>
        )}
        <Text style={{ ...wideText(nw.type.caption), color: nw.color.inkMuted, marginTop: 6 }}>
          {isHaftara ? `מקור: ${source}` : `${story.verseIds.length} פסוקים שהסיפור נשען עליהם`}
        </Text>
      </GlassSurface>
    </View>
  );

  return (
    <WidePage title={isHaftara ? 'סיפור ההפטרה' : 'סיפור הפרשה'} back>
      <SegmentedTabs
        size="md"
        options={[
          { id: 'parasha', label: 'סיפור הפרשה' },
          { id: 'haftara', label: 'סיפור ההפטרה' },
        ]}
        value={kind}
        onChange={(id) => setKind(id as 'parasha' | 'haftara')}
        style={{ maxWidth: 440, width: '100%', alignSelf: 'center', marginBottom: 24 }}
      />
      <WideCols align="flex-start">
        {text}
        {side}
      </WideCols>
    </WidePage>
  );
}
