import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppBackground } from '../src/components/AppBackground';
import { FamilyToggle } from '../src/components/FamilyToggle';
import { GlassButton } from '../src/components/GlassButton';
import { GlassCard } from '../src/components/GlassCard';
import { getCurrentParasha } from '../src/data/parashot';
import { useAppStore } from '../src/store/useAppStore';
import { assets, colors, radii, spacing, typography } from '../src/theme/tokens';

export default function StoryScreen() {
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

  const title = isHaftara ? 'סיפור ההפטרה' : parasha.story.title;
  const body = isHaftara
    ? isChild
      ? parasha.haftara.storyChild
      : parasha.haftara.storyAdult
    : isChild
      ? parasha.story.child
      : parasha.story.adult;

  const why =
    calendarMode === 'israel'
      ? parasha.haftara.whyThisHaftara.israel
      : parasha.haftara.whyThisHaftara.diaspora;

  const verseIds = isHaftara ? [] : parasha.story.verseIds;

  return (
    <AppBackground bg="galilee">
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.topBar}>
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="חזרה"
            style={styles.back}
          >
            <Text style={styles.backText}>→ חזרה</Text>
          </Pressable>
          <FamilyToggle value={familyVoice} onChange={setFamilyVoice} />
        </View>

        <View style={styles.tabs}>
          <Pressable
            onPress={() => setKind('parasha')}
            style={[styles.tab, !isHaftara && styles.tabActive]}
            accessibilityRole="tab"
            accessibilityState={{ selected: !isHaftara }}
          >
            <Text style={[styles.tabText, !isHaftara && styles.tabTextActive]}>סיפור הפרשה</Text>
          </Pressable>
          <Pressable
            onPress={() => setKind('haftara')}
            style={[styles.tab, isHaftara && styles.tabActive]}
            accessibilityRole="tab"
            accessibilityState={{ selected: isHaftara }}
          >
            <Text style={[styles.tabText, isHaftara && styles.tabTextActive]}>סיפור ההפטרה</Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <GlassCard strong>
            <Image
              source={
                isHaftara
                  ? assets.familyChildJerusalem
                  : isChild
                    ? assets.familyChildGalilee
                    : assets.familyStudy
              }
              style={styles.art}
              resizeMode="cover"
            />
            <Text style={styles.eyebrow}>
              {isHaftara
                ? calendarMode === 'israel'
                  ? parasha.haftara.sourceIsrael
                  : parasha.haftara.sourceDiaspora
                : `פרשת ${parasha.name}`}
            </Text>
            <Text style={styles.title} accessibilityRole="header">
              {title}
            </Text>
            <Text style={styles.body}>{body}</Text>
          </GlassCard>

          {isHaftara ? (
            <GlassCard>
              <Text style={styles.whyTitle}>למה קוראים דווקא את ההפטרה הזו?</Text>
              <Text style={styles.whyBody}>{why}</Text>
              <View style={styles.points}>
                {parasha.haftara.connectionPoints.map((p) => (
                  <Text key={p} style={styles.point}>
                    · {p}
                  </Text>
                ))}
              </View>
              <Text style={styles.calendarNote}>
                לוח פעיל: {calendarMode === 'israel' ? 'ישראל' : 'חו״ל'}
              </Text>
            </GlassCard>
          ) : null}

          <GlassButton
            title={
              isHaftara
                ? 'חזרה לבית'
                : 'לפסוקים שהסיפור נשען עליהם'
            }
            onPress={() => {
              if (isHaftara) router.back();
              else
                router.push({
                  pathname: '/reading',
                  params: { focus: verseIds.join(',') },
                });
            }}
          />

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  topBar: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  back: { minHeight: 44, justifyContent: 'center' },
  backText: {
    ...typography.subtitle,
    color: colors.primary,
    fontWeight: '700',
  },
  tabs: {
    flexDirection: 'row-reverse',
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    backgroundColor: 'rgba(255,255,255,0.55)',
    borderRadius: radii.pill,
    padding: 4,
    borderWidth: 1.5,
    borderColor: colors.glassBorder,
  },
  tab: {
    flex: 1,
    minHeight: 44,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabActive: { backgroundColor: colors.primary },
  tabText: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  tabTextActive: { color: colors.textOnPrimary },
  scroll: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    gap: spacing.md,
  },
  art: {
    width: '100%',
    height: 180,
    borderRadius: radii.lg,
    marginBottom: 14,
  },
  eyebrow: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
    textAlign: 'right',
  },
  title: {
    ...typography.title,
    color: colors.text,
    textAlign: 'right',
    marginTop: 4,
  },
  body: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'right',
    marginTop: 12,
  },
  whyTitle: {
    ...typography.subtitle,
    fontWeight: '800',
    color: colors.primaryDark,
    textAlign: 'right',
  },
  whyBody: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'right',
    marginTop: 10,
  },
  points: { marginTop: 12, gap: 6 },
  point: {
    ...typography.caption,
    color: colors.text,
    textAlign: 'right',
    lineHeight: 20,
  },
  calendarNote: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'right',
    marginTop: 14,
  },
});
