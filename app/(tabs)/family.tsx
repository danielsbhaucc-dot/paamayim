import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppBackground } from '../../src/components/AppBackground';
import { FamilyToggle } from '../../src/components/FamilyToggle';
import { GlassButton } from '../../src/components/GlassButton';
import { GlassCard } from '../../src/components/GlassCard';
import { MenuButton } from '../../src/components/MenuButton';
import { getCurrentParasha } from '../../src/data/parashot';
import { useAppStore } from '../../src/store/useAppStore';
import { assets, colors, radii, spacing, typography } from '../../src/theme/tokens';

export default function FamilyScreen() {
  const router = useRouter();
  const calendarMode = useAppStore((s) => s.calendarMode);
  const familyVoice = useAppStore((s) => s.familyVoice);
  const setFamilyVoice = useAppStore((s) => s.setFamilyVoice);

  const parasha = useMemo(() => getCurrentParasha(calendarMode), [calendarMode]);
  const isChild = familyVoice === 'child';
  const storyText = isChild ? parasha.story.child : parasha.story.adult;
  const heroImage = isChild ? assets.familyChildJerusalem : assets.familyStudy;

  return (
    <AppBackground bg="jerusalem">
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.topRow}>
            <MenuButton />
            <View style={styles.titleBlock}>
              <Text style={styles.title} accessibilityRole="header">
                מצב משפחה
              </Text>
              <Text style={styles.sub}>שני קולות · סיפור אחד</Text>
            </View>
          </View>

          <FamilyToggle value={familyVoice} onChange={setFamilyVoice} />

          <GlassCard strong round="xl">
            <Image source={heroImage} style={styles.heroArt} resizeMode="cover" />
            <Text style={styles.cardEyebrow}>
              {isChild ? 'לילד · סיפור' : 'למבוגר · לומדים יחד'}
            </Text>
            <Text style={styles.cardTitle}>
              {isChild ? 'הכול מתחיל באור' : parasha.story.title}
            </Text>
            <Text style={styles.cardBody}>{storyText}</Text>

            <GlassButton
              title={
                isChild
                  ? 'הצג את הפסוקים שהסיפור נשען עליהם'
                  : 'עבור לכרטיס הקריאה'
              }
              onPress={() =>
                router.push({
                  pathname: '/reading',
                  params: {
                    focus: parasha.story.verseIds.join(','),
                    aliyah: '1',
                  },
                })
              }
              style={{ marginTop: 14 }}
            />
          </GlassCard>

          <View style={{ height: 100 }} />
        </ScrollView>
      </SafeAreaView>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    gap: spacing.md,
  },
  topRow: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  titleBlock: {
    flex: 1,
  },
  title: {
    ...typography.hero,
    color: colors.text,
    textAlign: 'right',
  },
  sub: {
    ...typography.subtitle,
    color: colors.textSecondary,
    textAlign: 'right',
    marginTop: 4,
  },
  heroArt: {
    width: '100%',
    height: 200,
    borderRadius: radii.lg,
    marginBottom: 14,
  },
  cardEyebrow: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '800',
    textAlign: 'right',
  },
  cardTitle: {
    ...typography.title,
    color: colors.text,
    textAlign: 'right',
    marginTop: 4,
  },
  cardBody: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'right',
    marginTop: 10,
  },
});
