import { useRouter } from 'expo-router';
import { Smile, User } from 'lucide-react-native';
import React from 'react';
import { Text, View } from 'react-native';
import { useAppStore } from '../store/useAppStore';
import { nw } from '../theme/design';
import { img } from '../theme/images';
import { rtl } from '../theme/rtl';
import {
  SectionHeader,
  AliyahStoriesBody,
  GlassSurface,
  IllustrationCard,
  PrimaryButton,
  SegmentedTabs,
  StorySectionsBody,
  storySections,
  WideCols,
  WidePage,
  useLayout,
  wideText,
} from '../ui';
import { contentImage, useParasha, whyHaftaraFor } from '../content';

type StoryTab = 'parasha' | 'aliyot' | 'haftara';
type Props = { kind: StoryTab; setKind: (k: StoryTab) => void };

/** סיפור הפרשה / לפי עליות / ההפטרה — web רחב */
export function StoryWide({ kind, setKind }: Props) {
  const router = useRouter();
  const { isDesktop } = useLayout();
  const calendarMode = useAppStore((s) => s.calendarMode);
  const familyVoice = useAppStore((s) => s.familyVoice);
  const setFamilyVoice = useAppStore((s) => s.setFamilyVoice);
  const parasha = useParasha(calendarMode);
  const isChild = familyVoice === 'child';
  const isHaftara = kind === 'haftara';
  const isAliyot = kind === 'aliyot';
  const story = parasha.story;
  const sections = storySections(
    isChild ? parasha.extras?.stories?.child : parasha.extras?.stories?.adult,
    { title: story.title, text: isChild ? story.child : story.adult }
  );
  const aliyahRows = isChild ? parasha.extras?.storyByAliyah?.child : parasha.extras?.storyByAliyah?.adult;
  const para1 = isChild ? parasha.haftara.storyChild : parasha.haftara.storyAdult;
  const why = whyHaftaraFor(parasha, calendarMode, familyVoice);
  const source =
    calendarMode === 'israel' ? parasha.haftara.sourceIsrael : parasha.haftara.sourceDiaspora;

  const goVerses = () =>
    kind === 'parasha'
      ? router.push({ pathname: '/reading', params: { focus: parasha.story.verseIds.join(',') } })
      : router.push('/reading');

  const pageTitle = isHaftara ? 'סיפור ההפטרה' : isAliyot ? 'סיפור לפי עליות' : 'סיפור הפרשה';

  const text = (
    <GlassSurface variant="strong" radius={26} style={isDesktop ? { flex: 1.25 } : undefined} contentStyle={{ padding: isDesktop ? 32 : 24 }}>
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
          {isAliyot ? (
            <AliyahStoriesBody
              rows={aliyahRows ?? []}
              large
              textStyle={wideText({})}
              onOpenAliyah={(n) => router.push({ pathname: '/reading', params: { aliyah: String(n) } })}
            />
          ) : (
            <StorySectionsBody
              sections={sections}
              large
              eyebrow={`פרשת ${parasha.name}`}
              textStyle={wideText({})}
            />
          )}
        </>
      ) : (
        <>
          {parasha.haftara.specialReason ? (
            <Text style={{ ...wideText(nw.type.label), color: nw.color.tealText }}>
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
              <SectionHeader title="מה מסופר בהפטרה" ornament="leaf" style={{ marginTop: 24, marginBottom: 2 }} />
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

  const imageSource = isHaftara
    ? contentImage(parasha, 'haftara', img.haftaraProphet)
    : isChild
      ? contentImage(parasha, 'storyChild', img.familyChild)
      : contentImage(parasha, 'storyAdult', img.familyAdult);

  const imageCard = (
    <GlassSurface variant="strong" radius={26} contentStyle={{ padding: 14 }}>
      <IllustrationCard source={imageSource} aspectRatio={isDesktop ? 4 / 3 : 16 / 9} radius={18} />
    </GlassSurface>
  );

  const infoCard = (
    <GlassSurface variant="card" radius={22} contentStyle={{ padding: 22, gap: 8 }}>
      <Text style={{ ...wideText(nw.type.h3), color: nw.color.ink }}>
        {isHaftara ? 'הקשר לפרשה' : isAliyot ? 'לפי עליות' : 'על הפרשה'}
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
          {isAliyot
            ? `הסבר קצר לכל עלייה בפרשת ${parasha.name}`
            : `פרשת ${parasha.name} · ${parasha.rangeLabel}`}
        </Text>
      )}
      <Text style={{ ...wideText(nw.type.caption), color: nw.color.inkMuted, marginTop: 6 }}>
        {isHaftara ? `מקור: ${source}` : `${story.verseIds.length} פסוקים שהסיפור נשען עליהם`}
      </Text>
    </GlassSurface>
  );

  const side = (
    <View style={{ flex: 1, gap: 20 }}>
      {imageCard}
      {infoCard}
    </View>
  );

  return (
    <WidePage title={pageTitle} back>
      <SegmentedTabs
        size="md"
        options={[
          { id: 'parasha', label: 'סיפור' },
          { id: 'aliyot', label: 'לפי עליות' },
          { id: 'haftara', label: 'הפטרה' },
        ]}
        value={kind}
        onChange={(id) => setKind(id as StoryTab)}
        style={{ maxWidth: 520, width: '100%', alignSelf: 'center', marginBottom: 24 }}
      />
      {isDesktop ? (
        <WideCols align="flex-start">
          {text}
          {side}
        </WideCols>
      ) : (
        <View style={{ gap: 20 }}>
          {imageCard}
          {text}
          {infoCard}
        </View>
      )}
    </WidePage>
  );
}
