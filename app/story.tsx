import { useLocalSearchParams, useRouter } from 'expo-router';
import { BookOpenText, ListOrdered, Smile, Sunrise, User } from 'lucide-react-native';
import React, { useState } from 'react';
import { Animated, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppStore } from '../src/store/useAppStore';
import { nw } from '../src/theme/design';
import { img } from '../src/theme/images';
import { rtl } from '../src/theme/rtl';
import {
  SectionHeader,
  AliyahStoriesBody,
  GlassSurface,
  IllustrationCard,
  PrimaryButton,
  ScreenBackground,
  ScreenHeader,
  SegmentedTabs,
  StorySectionsBody,
  storySections,
  useLayout,
  LargeTitle,
  useCollapsingTitle,
} from '../src/ui';
import { StoryWide } from '../src/wide/StoryWide';
import { contentImage, useParasha, whyHaftaraFor } from '../src/content';

type StoryTab = 'parasha' | 'aliyot' | 'haftara';

export default function StoryScreen() {
  const { isWide } = useLayout();
  return isWide ? <StoryWideRoute /> : <StoryMobile />;
}

function StoryWideRoute() {
  const params = useLocalSearchParams<{ kind?: string }>();
  const [kind, setKind] = useState<StoryTab>(
    params.kind === 'haftara' ? 'haftara' : params.kind === 'aliyot' ? 'aliyot' : 'parasha'
  );
  return <StoryWide kind={kind} setKind={setKind} />;
}

function StoryMobile() {
  const router = useRouter();
  const params = useLocalSearchParams<{ kind?: string }>();
  const [kind, setKind] = useState<StoryTab>(
    params.kind === 'haftara' ? 'haftara' : params.kind === 'aliyot' ? 'aliyot' : 'parasha'
  );

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
  const t = useCollapsingTitle();

  const title =
    kind === 'haftara' ? 'סיפור ההפטרה' : kind === 'aliyot' ? 'סיפור לפי עליות' : 'סיפור הפרשה';

  return (
    <ScreenBackground variant="mist" showNav={false}>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <ScreenHeader title={title} scrollY={t.scrollY} />

        <Animated.ScrollView
          {...t.scrollProps}
          contentContainerStyle={{
            paddingHorizontal: nw.space.screenX,
            paddingBottom: 24,
          }}
          showsVerticalScrollIndicator={false}
        >
          <LargeTitle
            title={title}
            subtitle={`פרשת ${parasha.name}`}
            icon={
              isHaftara ? (
                <Sunrise size={28} color={nw.color.tealIcon} strokeWidth={1.75} />
              ) : isAliyot ? (
                <ListOrdered size={28} color={nw.color.tealIcon} strokeWidth={1.75} />
              ) : (
                <BookOpenText size={28} color={nw.color.tealIcon} strokeWidth={1.75} />
              )
            }
            scrollY={t.scrollY}
          />
          <SegmentedTabs
            size="md"
            options={[
              { id: 'parasha', label: 'סיפור' },
              { id: 'aliyot', label: 'לפי עליות' },
              { id: 'haftara', label: 'הפטרה' },
            ]}
            value={kind}
            onChange={(id) => setKind(id as StoryTab)}
            style={{ marginBottom: 14 }}
          />
          <GlassSurface variant="strong" radius={24} contentStyle={{ padding: 16 }}>
            <IllustrationCard
              source={
                isHaftara
                  ? contentImage(parasha, 'haftara', img.haftaraProphet)
                  : isChild
                    ? contentImage(parasha, 'storyChild', img.familyChild)
                    : contentImage(parasha, 'storyAdult', img.familyAdult)
              }
              aspectRatio={16 / 9}
            />

            {kind === 'parasha' || kind === 'aliyot' ? (
              <>
                <SegmentedTabs
                  size="md"
                  options={[
                    { id: 'adult', label: 'מבוגר', Icon: User },
                    { id: 'child', label: 'ילד/ה', Icon: Smile },
                  ]}
                  value={familyVoice}
                  onChange={(id) => setFamilyVoice(id as 'adult' | 'child')}
                  style={{ marginTop: 14 }}
                />
                {kind === 'parasha' ? (
                  <StorySectionsBody sections={sections} eyebrow={`פרשת ${parasha.name}`} />
                ) : (
                  <AliyahStoriesBody
                    rows={aliyahRows ?? []}
                    onOpenAliyah={(n) => router.push({ pathname: '/reading', params: { aliyah: String(n) } })}
                  />
                )}
              </>
            ) : (
              <>
                {parasha.haftara.specialReason ? (
                  <Text
                    style={{
                      ...nw.type.caption,
                      color: nw.color.tealText,
                      marginTop: 16,
                      textAlign: rtl.textRight,
                      writingDirection: 'rtl',
                    }}
                  >
                    {parasha.haftara.specialReason}
                  </Text>
                ) : null}
                <SectionHeader title="למה קוראים דווקא את ההפטרה הזו?" style={{ marginTop: parasha.haftara.specialReason ? 8 : 18, marginBottom: 2 }} />
                <View style={{ marginTop: 10 }}>
                  <Text
                    style={{
                      ...nw.type.body,
                      color: nw.color.inkSoft,
                      textAlign: rtl.textRight,
                      writingDirection: 'rtl',
                    }}
                  >
                    {why}
                  </Text>
                </View>
                {para1.trim() ? (
                  <>
                    <SectionHeader title="מה מסופר בהפטרה" size="sm" ornament="leaf" style={{ marginTop: 18, marginBottom: 2 }} />
                    <View style={{ marginTop: 8 }}>
                      <Text
                        style={{
                          ...nw.type.body,
                          color: nw.color.inkSoft,
                          textAlign: rtl.textRight,
                          writingDirection: 'rtl',
                        }}
                      >
                        {para1}
                      </Text>
                    </View>
                  </>
                ) : null}
                {parasha.haftara.connectionPoints.map((p) => (
                  <View
                    key={p}
                    style={{
                      flexDirection: rtl.row,
                      gap: 10,
                      alignItems: 'center',
                      marginTop: 8,
                    }}
                  >
                    <View
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: 3,
                        backgroundColor: nw.color.tealIcon,
                      }}
                    />
                    <Text
                      style={{
                        ...nw.type.bodySm,
                        color: nw.color.inkSoft,
                        flex: 1,
                        textAlign: rtl.textRight,
                        writingDirection: 'rtl',
                      }}
                    >
                      {p}
                    </Text>
                  </View>
                ))}
                <Text
                  style={{
                    ...nw.type.caption,
                    color: nw.color.inkMuted,
                    marginTop: 12,
                    textAlign: rtl.textRight,
                    writingDirection: 'rtl',
                  }}
                >
                  {`מקור: ${
                    calendarMode === 'israel'
                      ? parasha.haftara.sourceIsrael
                      : parasha.haftara.sourceDiaspora
                  }`}
                </Text>
              </>
            )}
          </GlassSurface>

          <PrimaryButton
            title="מעבר לפסוקים"
            icon="chevron"
            style={{ marginTop: 20 }}
            onPress={() => {
              if (kind === 'parasha') {
                router.push({
                  pathname: '/reading',
                  params: { focus: parasha.story.verseIds.join(',') },
                });
              } else if (kind === 'aliyot') {
                router.push('/reading');
              } else {
                router.push('/reading');
              }
            }}
          />
        </Animated.ScrollView>
      </SafeAreaView>
    </ScreenBackground>
  );
}
