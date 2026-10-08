import { useLocalSearchParams, useRouter } from 'expo-router';
import { Smile, User } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getCurrentParasha } from '../src/data/parashot';
import { useAppStore } from '../src/store/useAppStore';
import { nw } from '../src/theme/design';
import { img } from '../src/theme/images';
import { rtl } from '../src/theme/rtl';
import {
  GlassSurface,
  IllustrationCard,
  PrimaryButton,
  ScreenBackground,
  ScreenHeader,
  SegmentedTabs,
  useLayout,
} from '../src/ui';
import { StoryWide } from '../src/wide/StoryWide';

export default function StoryScreen() {
  const { isWide } = useLayout();
  return isWide ? <StoryWideRoute /> : <StoryMobile />;
}

function StoryWideRoute() {
  const params = useLocalSearchParams<{ kind?: string }>();
  const [kind, setKind] = useState<'parasha' | 'haftara'>(
    params.kind === 'haftara' ? 'haftara' : 'parasha'
  );
  return <StoryWide kind={kind} setKind={setKind} />;
}

function StoryMobile() {
  const router = useRouter();
  const params = useLocalSearchParams<{ kind?: string }>();
  const [kind, setKind] = useState<'parasha' | 'haftara'>(
    params.kind === 'haftara' ? 'haftara' : 'parasha'
  );

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

  return (
    <ScreenBackground variant="mist" showNav={false}>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <ScreenHeader title={isHaftara ? 'סיפור ההפטרה' : 'סיפור הפרשה'} />

        <SegmentedTabs
          size="md"
          options={[
            { id: 'parasha', label: 'סיפור הפרשה' },
            { id: 'haftara', label: 'סיפור ההפטרה' },
          ]}
          value={kind}
          onChange={(id) => setKind(id as 'parasha' | 'haftara')}
          style={{ marginHorizontal: nw.space.screenX, marginTop: 4 }}
        />

        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: nw.space.screenX,
            paddingTop: 14,
            paddingBottom: 24,
          }}
          showsVerticalScrollIndicator={false}
        >
          <GlassSurface variant="strong" radius={24} contentStyle={{ padding: 16 }}>
            <IllustrationCard
              source={
                isHaftara
                  ? img.haftaraProphet
                  : isChild
                    ? img.familyChild
                    : img.familyAdult
              }
              aspectRatio={16 / 9}
            />

            {kind === 'parasha' ? (
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
                <Text
                  style={{
                    ...nw.type.caption,
                    color: nw.color.tealIcon,
                    marginTop: 16,
                    textAlign: rtl.textRight,
                    writingDirection: 'rtl',
                  }}
                >
                  {`פרשת ${parasha.name}`}
                </Text>
                <Text
                  accessibilityRole="header"
                  style={{
                    ...nw.type.h2,
                    color: nw.color.ink,
                    marginTop: 2,
                    textAlign: rtl.textRight,
                    writingDirection: 'rtl',
                  }}
                >
                  {parasha.story.title}
                </Text>
                <Text
                  style={{
                    ...nw.type.body,
                    color: nw.color.inkSoft,
                    marginTop: 10,
                    textAlign: rtl.textRight,
                    writingDirection: 'rtl',
                  }}
                >
                  {body}
                </Text>
              </>
            ) : (
              <>
                {parasha.haftara.specialReason ? (
                  <Text
                    style={{
                      ...nw.type.caption,
                      color: nw.color.tealIcon,
                      marginTop: 16,
                      textAlign: rtl.textRight,
                      writingDirection: 'rtl',
                    }}
                  >
                    {parasha.haftara.specialReason}
                  </Text>
                ) : null}
                <Text
                  accessibilityRole="header"
                  style={{
                    ...nw.type.h2,
                    color: nw.color.ink,
                    marginTop: parasha.haftara.specialReason ? 2 : 18,
                    textAlign: rtl.textRight,
                    writingDirection: 'rtl',
                  }}
                >
                  למה קוראים דווקא את ההפטרה הזו?
                </Text>
                <Text
                  style={{
                    ...nw.type.body,
                    color: nw.color.inkSoft,
                    marginTop: 10,
                    textAlign: rtl.textRight,
                    writingDirection: 'rtl',
                  }}
                >
                  {why}
                </Text>
                {para1.trim() ? (
                  <>
                    <Text
                      accessibilityRole="header"
                      style={{
                        ...nw.type.h3,
                        color: nw.color.ink,
                        marginTop: 18,
                        textAlign: rtl.textRight,
                        writingDirection: 'rtl',
                      }}
                    >
                      מה מסופר בהפטרה
                    </Text>
                    <Text
                      style={{
                        ...nw.type.body,
                        color: nw.color.inkSoft,
                        marginTop: 8,
                        textAlign: rtl.textRight,
                        writingDirection: 'rtl',
                      }}
                    >
                      {para1}
                    </Text>
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
              } else {
                router.push('/reading');
              }
            }}
          />
        </ScrollView>
      </SafeAreaView>
    </ScreenBackground>
  );
}
