import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import {
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppBackground } from '../../src/components/AppBackground';
import { CalendarToggle } from '../../src/components/CalendarToggle';
import { GlassButton } from '../../src/components/GlassButton';
import { GlassCard } from '../../src/components/GlassCard';
import {
  aliyahProgress,
  getCurrentParasha,
  isParashaComplete,
} from '../../src/data/parashot';
import { useAppStore } from '../../src/store/useAppStore';
import { fonts } from '../../src/theme/fonts';
import { assets, colors, radii, spacing } from '../../src/theme/tokens';

export default function HomeScreen() {
  const router = useRouter();
  const calendarMode = useAppStore((s) => s.calendarMode);
  const setCalendarMode = useAppStore((s) => s.setCalendarMode);
  const progress = useAppStore((s) => s.progress);
  const lastVerseId = useAppStore((s) => s.lastVerseId);
  const onboardingDone = useAppStore((s) => s.onboardingDone);
  const setOnboardingDone = useAppStore((s) => s.setOnboardingDone);

  const parasha = useMemo(() => getCurrentParasha(calendarMode), [calendarMode]);
  const doneAll = useMemo(() => isParashaComplete(parasha, progress), [parasha, progress]);
  const completedAliyot = parasha.aliyot.filter((a) => {
    const { ratio } = aliyahProgress(a.verseIds, progress);
    return ratio >= 1;
  }).length;

  if (!onboardingDone) {
    return (
      <AppBackground dim={false}>
        <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
          <View style={styles.splashHeader}>
            <Pressable
              onPress={() => router.push('/settings')}
              accessibilityRole="button"
              accessibilityLabel="פרופיל והגדרות"
              style={styles.profileBtn}
            >
              <Ionicons name="person" size={20} color="#fff" />
            </Pressable>
            <CalendarToggle value={calendarMode} onChange={setCalendarMode} />
          </View>

          <View style={styles.splashCenter}>
            <View style={styles.heroGlass}>
              {Platform.OS !== 'web' ? (
                <BlurView intensity={35} tint="light" style={StyleSheet.absoluteFill} />
              ) : null}
              <View style={styles.heroGlassFill} />
              <View style={styles.heroInner}>
                <Image source={assets.icon} style={styles.logo} resizeMode="cover" />
                <Text style={styles.appName}>פעמיים</Text>
                <Text style={styles.brandTag}>לומדים. מרגישים. גדלים.</Text>
                <Text style={styles.splashTitle} accessibilityRole="header">
                  פרשת השבוע
                </Text>
                <Text style={styles.splashSub}>סיפורים. מקרא. תרגום. בדרך שלך.</Text>
              </View>
            </View>
          </View>

          <View style={styles.splashBottom}>
            <Pressable
              onPress={() => setOnboardingDone(true)}
              accessibilityRole="button"
              accessibilityLabel="התחל"
              style={({ pressed }) => [styles.startBtn, pressed && { opacity: 0.9 }]}
            >
              {Platform.OS !== 'web' ? (
                <BlurView intensity={50} tint="light" style={StyleSheet.absoluteFill} />
              ) : null}
              <View style={styles.startFill} />
              <Text style={styles.startText}>התחל</Text>
              <Ionicons name="chevron-back" size={20} color="#fff" style={styles.startArrow} />
            </Pressable>
          </View>
        </SafeAreaView>
      </AppBackground>
    );
  }

  return (
    <AppBackground>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.dashTop}>
            <Pressable
              onPress={() => router.push('/settings')}
              accessibilityRole="button"
              accessibilityLabel="תפריט"
              style={styles.iconBtn}
            >
              <Ionicons name="menu" size={22} color={colors.text} />
            </Pressable>
            <Text style={styles.dashHeading}>פרשת השבוע</Text>
            <Image source={assets.icon} style={styles.dashLogo} />
          </View>

          <CalendarToggle value={calendarMode} onChange={setCalendarMode} />

          <GlassCard strong round="xl" accessibilityLabel={`פרשת ${parasha.name}`}>
            <View style={styles.parashaRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.eyebrow}>השבוע</Text>
                <Text style={styles.parashaName} accessibilityRole="header">
                  {parasha.name}
                </Text>
                <Text style={styles.range}>{parasha.rangeLabel}</Text>
              </View>
              <Image source={assets.galilee} style={styles.thumb} />
            </View>
            <Text style={styles.pathHint}>מסלול עד שבת · {completedAliyot}/7 עליות</Text>
          </GlassCard>

          <View style={styles.tiles}>
            <Pressable
              style={{ flex: 1 }}
              onPress={() => router.push({ pathname: '/story', params: { kind: 'parasha' } })}
              accessibilityRole="button"
              accessibilityLabel="הפרשה"
            >
              <GlassCard style={styles.tile} round="lg">
                <View style={[styles.tileIcon, { backgroundColor: 'rgba(42,168,176,0.25)' }]}>
                  <Ionicons name="book" size={22} color={colors.primary} />
                </View>
                <Text style={styles.tileTitle}>הפרשה</Text>
                <Text style={styles.tileSub}>{parasha.name}</Text>
              </GlassCard>
            </Pressable>
            <Pressable
              style={{ flex: 1 }}
              onPress={() => router.push({ pathname: '/story', params: { kind: 'haftara' } })}
              accessibilityRole="button"
              accessibilityLabel="ההפטרה"
            >
              <GlassCard style={styles.tile} round="lg">
                <View style={[styles.tileIcon, { backgroundColor: 'rgba(95,168,138,0.3)' }]}>
                  <Ionicons name="flame" size={22} color={colors.leaf} />
                </View>
                <Text style={styles.tileTitle}>ההפטרה</Text>
                <Text style={styles.tileSub}>ישעיהו</Text>
              </GlassCard>
            </Pressable>
          </View>

          <GlassCard strong round="xl">
            <Text style={styles.storyEyebrow}>סיפור ואז מקור</Text>
            <Text style={styles.storyTitle}>סיפור הפרשה</Text>
            <Text style={styles.storyBody} numberOfLines={4}>
              {parasha.story.adult}
            </Text>
            <GlassButton
              title="לקרוא את הסיפור"
              variant="soft"
              onPress={() => router.push({ pathname: '/story', params: { kind: 'parasha' } })}
              style={{ marginTop: 14 }}
            />
          </GlassCard>

          <GlassButton
            title={lastVerseId ? 'המשך מאיפה שעצרת' : 'למסלול הקריאה'}
            onPress={() => (doneAll ? router.push('/completion') : router.push('/reading'))}
          />
        </ScrollView>
      </SafeAreaView>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  splashHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  profileBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.55)',
  },
  splashCenter: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  heroGlass: {
    borderRadius: radii.xl,
    overflow: 'hidden',
    borderWidth: 1.25,
    borderColor: 'rgba(255,255,255,0.7)',
    ...(Platform.OS === 'web'
      ? ({
          backdropFilter: 'blur(28px)',
          WebkitBackdropFilter: 'blur(28px)',
        } as object)
      : null),
  },
  heroGlassFill: {
    ...StyleSheet.absoluteFillObject,
    // קרם שקוף — לא מוצק
    backgroundColor: 'rgba(247, 243, 236, 0.42)',
  },
  heroInner: {
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  logo: {
    width: 78,
    height: 78,
    borderRadius: 39,
    marginBottom: 14,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.65)',
  },
  appName: {
    fontFamily: fonts.uiExtra,
    fontSize: 30,
    color: colors.primaryDark,
    textAlign: 'center',
    textShadowColor: 'rgba(255,255,255,0.55)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  brandTag: {
    fontFamily: fonts.uiMedium,
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 18,
  },
  splashTitle: {
    fontFamily: fonts.uiExtra,
    fontSize: 36,
    color: colors.text,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  splashSub: {
    fontFamily: fonts.uiMedium,
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 10,
    writingDirection: 'rtl',
    lineHeight: 22,
  },
  splashBottom: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.sm,
  },
  startBtn: {
    minHeight: 58,
    borderRadius: radii.pill,
    overflow: 'hidden',
    borderWidth: 1.25,
    borderColor: 'rgba(255,255,255,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row-reverse',
    gap: 10,
    ...(Platform.OS === 'web'
      ? ({
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
        } as object)
      : null),
  },
  startFill: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.28)',
  },
  startText: {
    fontFamily: fonts.uiBold,
    fontSize: 19,
    color: '#fff',
    textShadowColor: 'rgba(15,58,64,0.45)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  startArrow: {
    position: 'absolute',
    left: 22,
  },
  scroll: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    gap: spacing.md,
    paddingBottom: spacing.lg,
  },
  dashTop: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.45)',
    borderWidth: 1,
    borderColor: colors.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dashHeading: {
    fontFamily: fonts.uiBold,
    fontSize: 20,
    color: colors.text,
  },
  dashLogo: { width: 40, height: 40, borderRadius: 20 },
  parashaRow: {
    flexDirection: 'row-reverse',
    gap: 14,
    alignItems: 'center',
  },
  thumb: { width: 64, height: 64, borderRadius: radii.md },
  eyebrow: {
    fontFamily: fonts.uiBold,
    fontSize: 12,
    color: colors.primary,
    textAlign: 'right',
  },
  parashaName: {
    fontFamily: fonts.uiExtra,
    fontSize: 32,
    color: colors.text,
    textAlign: 'right',
  },
  range: {
    fontFamily: fonts.uiMedium,
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'right',
  },
  pathHint: {
    fontFamily: fonts.uiSemi,
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'right',
    marginTop: 12,
  },
  tiles: { flexDirection: 'row-reverse', gap: 12 },
  tile: { minHeight: 120 },
  tileIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    alignSelf: 'flex-end',
  },
  tileTitle: {
    fontFamily: fonts.uiBold,
    fontSize: 16,
    color: colors.text,
    textAlign: 'right',
  },
  tileSub: {
    fontFamily: fonts.uiMedium,
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'right',
    marginTop: 4,
  },
  storyEyebrow: {
    fontFamily: fonts.uiBold,
    fontSize: 12,
    color: colors.primary,
    textAlign: 'right',
  },
  storyTitle: {
    fontFamily: fonts.uiBold,
    fontSize: 22,
    color: colors.text,
    textAlign: 'right',
    marginTop: 4,
  },
  storyBody: {
    fontFamily: fonts.ui,
    fontSize: 15,
    lineHeight: 24,
    color: colors.textSecondary,
    textAlign: 'right',
    marginTop: 10,
  },
});
