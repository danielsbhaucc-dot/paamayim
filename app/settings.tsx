import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { CalendarMode, FamilyVoice, ReadingView } from '../src/data/types';
import { useAppStore } from '../src/store/useAppStore';
import { nw } from '../src/theme/design';
import { rtl } from '../src/theme/rtl';
import {
  GlassSurface,
  ScreenBackground,
  ScreenHeader,
  SegmentedTabs,
} from '../src/ui';

export default function SettingsScreen() {
  const router = useRouter();
  const calendarMode = useAppStore((s) => s.calendarMode);
  const setCalendarMode = useAppStore((s) => s.setCalendarMode);
  const familyVoice = useAppStore((s) => s.familyVoice);
  const setFamilyVoice = useAppStore((s) => s.setFamilyVoice);
  const readingView = useAppStore((s) => s.readingView);
  const setReadingView = useAppStore((s) => s.setReadingView);

  const closeSlot = !router.canGoBack() ? (
    <Pressable
      onPress={() => router.replace('/(tabs)')}
      accessibilityRole="button"
      accessibilityLabel="סגור"
      style={{ minHeight: 44, justifyContent: 'center', paddingHorizontal: 8 }}
    >
      <Text style={{ ...nw.type.label, color: nw.color.tealIcon, writingDirection: 'rtl' }}>
        סגור
      </Text>
    </Pressable>
  ) : undefined;

  return (
    <ScreenBackground variant="mist" showNav={false} wideNav wideMaxWidth={760}>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <ScreenHeader title="הגדרות" endSlot={closeSlot} />

        <ScrollView
          contentContainerStyle={{
            paddingTop: 12,
            paddingBottom: 24,
            gap: nw.space.gap,
          }}
          showsVerticalScrollIndicator={false}
        >
          <GlassSurface
            variant="card"
            radius={22}
            style={{ marginHorizontal: nw.space.screenX }}
            contentStyle={{ padding: 18 }}
          >
            <Text
              style={{
                ...nw.type.h3,
                color: nw.color.ink,
                textAlign: rtl.textRight,
                writingDirection: 'rtl',
                marginBottom: 12,
              }}
            >
              לוח ישראל / חו״ל
            </Text>
            <SegmentedTabs
              size="md"
              options={[
                { id: 'israel', label: 'ישראל' },
                { id: 'diaspora', label: 'חו״ל' },
              ]}
              value={calendarMode}
              onChange={(id) => setCalendarMode(id as CalendarMode)}
            />
          </GlassSurface>

          <GlassSurface
            variant="card"
            radius={22}
            style={{ marginHorizontal: nw.space.screenX }}
            contentStyle={{ padding: 18 }}
          >
            <Text
              style={{
                ...nw.type.h3,
                color: nw.color.ink,
                textAlign: rtl.textRight,
                writingDirection: 'rtl',
                marginBottom: 12,
              }}
            >
              מצב משפחה (ברירת מחדל)
            </Text>
            <SegmentedTabs
              size="md"
              options={[
                { id: 'adult', label: 'מבוגר' },
                { id: 'child', label: 'ילד/ה' },
              ]}
              value={familyVoice}
              onChange={(id) => setFamilyVoice(id as FamilyVoice)}
            />
          </GlassSurface>

          <GlassSurface
            variant="card"
            radius={22}
            style={{ marginHorizontal: nw.space.screenX }}
            contentStyle={{ padding: 18 }}
          >
            <Text
              style={{
                ...nw.type.h3,
                color: nw.color.ink,
                textAlign: rtl.textRight,
                writingDirection: 'rtl',
                marginBottom: 12,
              }}
            >
              תצוגת קריאה
            </Text>
            <SegmentedTabs
              size="md"
              options={[
                { id: 'verse', label: 'פסוק־פסוק' },
                { id: 'scroll', label: 'גלילה רציפה' },
              ]}
              value={readingView}
              onChange={(id) => setReadingView(id as ReadingView)}
            />
          </GlassSurface>

          <GlassSurface
            variant="card"
            radius={22}
            style={{ marginHorizontal: nw.space.screenX }}
            contentStyle={{ padding: 18 }}
          >
            <Pressable
              onPress={() => router.push('/legal')}
              accessibilityRole="button"
              accessibilityLabel="משפטי"
            >
              <Text
                style={{
                  ...nw.type.h3,
                  color: nw.color.ink,
                  textAlign: rtl.textRight,
                  writingDirection: 'rtl',
                  marginBottom: 12,
                }}
              >
                משפטי
              </Text>
              <Text
                style={{
                  ...nw.type.bodySm,
                  color: nw.color.inkSoft,
                  textAlign: rtl.textRight,
                  writingDirection: 'rtl',
                }}
              >
                מקור הטקסטים, הרישיון, ומה שלא כלול בשימוש החופשי.
              </Text>
            </Pressable>
          </GlassSurface>

          <GlassSurface
            variant="card"
            radius={22}
            style={{ marginHorizontal: nw.space.screenX }}
            contentStyle={{ padding: 18 }}
          >
            <Text
              style={{
                ...nw.type.h3,
                color: nw.color.ink,
                textAlign: rtl.textRight,
                writingDirection: 'rtl',
                marginBottom: 12,
              }}
            >
              נגישות
            </Text>
            <Text
              style={{
                ...nw.type.bodySm,
                color: nw.color.inkSoft,
                textAlign: rtl.textRight,
                writingDirection: 'rtl',
              }}
            >
              כל הכפתורים בגודל מגע מינימלי, תוויות בעברית, תפקידי נגישות (role) על טאבים,
              מתגים ופס התקדמות. תפריט נגישות ייעודי יתווסף בגרסה הבאה.
            </Text>
          </GlassSurface>
        </ScrollView>
      </SafeAreaView>
    </ScreenBackground>
  );
}
