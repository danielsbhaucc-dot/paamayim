import { useRouter } from 'expo-router';
import { Smile, User, Users } from 'lucide-react-native';
import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { FamilyVoice } from '../../src/data/types';
import { useAppStore } from '../../src/store/useAppStore';
import { nw } from '../../src/theme/design';
import { img } from '../../src/theme/images';
import { rtl } from '../../src/theme/rtl';
import {
  GlassSurface,
  IllustrationCard,
  PillButton,
  PrimaryButton,
  ScreenBackground,
  ScreenHeader,
  SegmentedTabs,
  useLayout,
} from '../../src/ui';
import { FamilyWide } from '../../src/wide/FamilyWide';
import { contentImage, useParasha } from '../../src/content';

export default function FamilyScreen() {
  const { isWide } = useLayout();
  return isWide ? <FamilyWide /> : <FamilyMobile />;
}

function FamilyMobile() {
  const router = useRouter();
  const calendarMode = useAppStore((s) => s.calendarMode);
  const familyVoice = useAppStore((s) => s.familyVoice);
  const setFamilyVoice = useAppStore((s) => s.setFamilyVoice);

  const parasha = useParasha(calendarMode);
  const isChild = familyVoice === 'child';
  const storyText = isChild ? parasha.story.child : parasha.story.adult;

  return (
    <ScreenBackground variant="mist">
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScreenHeader
          title="מצב משפחה"
          subtitle="שני קולות, סיפור אחד"
          titleIcon={<Users size={24} color={nw.color.tealIcon} strokeWidth={1.75} />}
        />

        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: nw.space.screenX,
            paddingBottom: 24,
          }}
          showsVerticalScrollIndicator={false}
        >
          <SegmentedTabs
            size="lg"
            options={[
              { id: 'adult', label: 'מבוגר', Icon: User },
              { id: 'child', label: 'ילד/ה', Icon: Smile },
            ]}
            value={familyVoice}
            onChange={(id) => setFamilyVoice(id as FamilyVoice)}
            style={{ marginTop: 12 }}
          />

          <GlassSurface
            variant="strong"
            radius={24}
            style={{ marginTop: 16 }}
            contentStyle={{ padding: 12 }}
          >
            <IllustrationCard
              source={
            isChild
              ? contentImage(parasha, 'storyChild', img.familyChild)
              : contentImage(parasha, 'storyAdult', img.familyAdult)
          }
              aspectRatio={16 / 10}
              radius={18}
            />
            <View style={{ paddingHorizontal: 10, paddingBottom: 8 }}>
              <Text
                style={{
                  ...nw.type.h3,
                  color: nw.color.ink,
                  marginTop: 14,
                  textAlign: rtl.textRight,
                  writingDirection: 'rtl',
                }}
              >
                {isChild ? 'הכל התחיל באור' : parasha.story.title}
              </Text>
              <Text
                numberOfLines={5}
                style={{
                  ...nw.type.body,
                  color: nw.color.inkSoft,
                  marginTop: 6,
                  textAlign: rtl.textRight,
                  writingDirection: 'rtl',
                }}
              >
                {storyText}
              </Text>
              <PillButton
                title="לסיפור המלא"
                style={{ marginTop: 16 }}
                onPress={() =>
                  router.push({ pathname: '/story', params: { kind: 'parasha' } })
                }
              />
            </View>
          </GlassSurface>

          <PrimaryButton
            variant="solid"
            title={
              isChild
                ? 'הצג את הפסוקים שהסיפור נשען עליהם'
                : 'עבור לכרטיס הקריאה'
            }
            style={{ marginTop: 16 }}
            onPress={() =>
              router.push({
                pathname: '/reading',
                params: {
                  focus: parasha.story.verseIds.join(','),
                  aliyah: '1',
                },
              })
            }
          />
        </ScrollView>
      </SafeAreaView>
    </ScreenBackground>
  );
}
