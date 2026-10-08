import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Image as ExpoImage } from 'expo-image';
import { useRouter } from 'expo-router';
import { BookOpen, BookOpenText, Sunrise } from 'lucide-react-native';
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
import { BOTTOM_NAV_SPACE } from '../../src/components/GlassBottomNav';
import { MenuButton } from '../../src/components/MenuButton';
import { getCurrentParasha, isParashaComplete } from '../../src/data/parashot';
import { useAppStore } from '../../src/store/useAppStore';
import { APP_NAME, APP_TAGLINE } from '../../src/theme/brand';
import { nw } from '../../src/theme/design';
import { fonts } from '../../src/theme/fonts';
import { img, imgReady } from '../../src/theme/images';
import { rtl } from '../../src/theme/rtl';
import { assets, radii, spacing } from '../../src/theme/tokens';
import {
  CalendarPill,
  GlassSurface,
  HeroBanner,
  PillButton,
  PrimaryButton,
  ScreenBackground,
  ScreenHeader,
} from '../../src/ui';

function haftaraBook(source: string): string {
  const match = source.match(/^(.*?)\s+[\u0590-\u05EA״׳]+[:：]/);
  return (match?.[1] ?? source).trim();
}

export default function HomeScreen() {
  const router = useRouter();
  const calendarMode = useAppStore((s) => s.calendarMode);
  const progress = useAppStore((s) => s.progress);
  const lastVerseId = useAppStore((s) => s.lastVerseId);
  const onboardingDone = useAppStore((s) => s.onboardingDone);

  const parasha = useMemo(() => getCurrentParasha(calendarMode), [calendarMode]);
  const doneAll = useMemo(() => isParashaComplete(parasha, progress), [parasha, progress]);

  if (!onboardingDone) {
    return (
      <ScreenBackground variant="photo" source={img.heroSunrise} showNav={false}>
        <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
          <View style={styles.splashHeader}>
            <MenuButton light />
            <CalendarPill mode={calendarMode} onPress={() => router.push('/calendar')} />
          </View>

          <View style={{ flex: 1, paddingHorizontal: nw.space.screenX }}>
            <View style={{ marginTop: 28, alignItems: 'center' }}>
              {imgReady.logoLeaf ? (
                <ExpoImage
                  source={img.logoLeaf}
                  style={{ width: 96, height: 96 }}
                  contentFit="contain"
                />
              ) : (
                <Image
                  source={assets.icon}
                  style={{ width: 84, height: 84, borderRadius: 22 }}
                  resizeMode="cover"
                />
              )}
              <Text
                style={{
                  fontFamily: fonts.uiExtra,
                  fontSize: 36,
                  lineHeight: 44,
                  color: '#FFFFFF',
                  textShadowColor: 'rgba(10,40,60,0.35)',
                  textShadowOffset: { width: 0, height: 2 },
                  textShadowRadius: 10,
                  textAlign: 'center',
                  writingDirection: 'rtl',
                  marginTop: 12,
                }}
              >
                {APP_NAME}
              </Text>
              <Text
                style={{
                  fontFamily: fonts.uiSemi,
                  fontSize: 16,
                  color: 'rgba(255,255,255,0.92)',
                  textShadowColor: 'rgba(10,40,60,0.35)',
                  textShadowOffset: { width: 0, height: 2 },
                  textShadowRadius: 10,
                  textAlign: 'center',
                  writingDirection: 'rtl',
                  marginTop: 4,
                }}
              >
                {APP_TAGLINE}
              </Text>
            </View>

            <View style={{ flex: 1 }} />

            <View style={{ alignItems: 'center' }}>
              <Text
                accessibilityRole="header"
                style={{
                  fontFamily: fonts.uiExtra,
                  fontSize: 34,
                  lineHeight: 42,
                  color: '#FFFFFF',
                  textShadowColor: 'rgba(10,40,60,0.40)',
                  textShadowOffset: { width: 0, height: 2 },
                  textShadowRadius: 14,
                  textAlign: 'center',
                  writingDirection: 'rtl',
                }}
              >
                פרשת השבוע
              </Text>
              <Text
                style={{
                  fontFamily: fonts.uiSemi,
                  fontSize: 16,
                  color: 'rgba(255,255,255,0.92)',
                  textShadowColor: 'rgba(10,40,60,0.40)',
                  textShadowOffset: { width: 0, height: 2 },
                  textShadowRadius: 14,
                  textAlign: 'center',
                  writingDirection: 'rtl',
                  marginTop: 8,
                }}
              >
                סיפורים. מקרא. תרגום. בדרך שלך.
              </Text>
            </View>

            <View style={{ flex: 0.6 }} />
          </View>

          <View style={styles.splashBottom}>
            <Pressable
              onPress={() =>
                router.push({ pathname: '/calendar', params: { onboarding: '1' } })
              }
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
      </ScreenBackground>
    );
  }

  return (
    <ScreenBackground variant="mist">
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScreenHeader title="פרשת השבוע" />
        <ScrollView
          contentContainerStyle={{ paddingBottom: BOTTOM_NAV_SPACE + 24 }}
          showsVerticalScrollIndicator={false}
        >
          <HeroBanner parashaName={parasha.name} rangeLabel={parasha.rangeLabel} />

          <View
            style={{
              flexDirection: rtl.row,
              gap: 14,
              marginHorizontal: nw.space.screenX,
              marginTop: 16,
            }}
          >
            <Pressable
              style={{ flex: 1 }}
              onPress={() => router.push({ pathname: '/story', params: { kind: 'parasha' } })}
              accessibilityRole="button"
              accessibilityLabel="הפרשה"
            >
              <GlassSurface
                variant="card"
                radius={18}
                style={{ flex: 1, height: 128 }}
                contentStyle={{
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                }}
              >
                <Text
                  style={{
                    fontFamily: fonts.uiBold,
                    fontSize: 17,
                    color: nw.color.ink,
                    textAlign: 'center',
                    writingDirection: 'rtl',
                  }}
                >
                  הפרשה
                </Text>
                <Text
                  style={{
                    fontFamily: fonts.uiBold,
                    fontSize: 17,
                    color: nw.color.ink,
                    textAlign: 'center',
                    writingDirection: 'rtl',
                  }}
                >
                  {parasha.name}
                </Text>
                <BookOpen size={24} color={nw.color.tealIcon} strokeWidth={1.75} style={{ marginTop: 8 }} />
              </GlassSurface>
            </Pressable>
            <Pressable
              style={{ flex: 1 }}
              onPress={() => router.push({ pathname: '/story', params: { kind: 'haftara' } })}
              accessibilityRole="button"
              accessibilityLabel="ההפטרה"
            >
              <GlassSurface
                variant="card"
                radius={18}
                style={{ flex: 1, height: 128 }}
                contentStyle={{
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                }}
              >
                <Text
                  style={{
                    fontFamily: fonts.uiBold,
                    fontSize: 17,
                    color: nw.color.ink,
                    textAlign: 'center',
                    writingDirection: 'rtl',
                  }}
                >
                  ההפטרה
                </Text>
                <Text
                  style={{
                    fontFamily: fonts.uiBold,
                    fontSize: 17,
                    color: nw.color.ink,
                    textAlign: 'center',
                    writingDirection: 'rtl',
                  }}
                >
                  {haftaraBook(
                    calendarMode === 'israel'
                      ? parasha.haftara.sourceIsrael
                      : parasha.haftara.sourceDiaspora
                  )}
                </Text>
                <Sunrise size={24} color={nw.color.tealIcon} strokeWidth={1.75} style={{ marginTop: 8 }} />
              </GlassSurface>
            </Pressable>
          </View>

          <GlassSurface
            variant="card"
            radius={22}
            style={{ marginHorizontal: nw.space.screenX, marginTop: 14 }}
            contentStyle={{ padding: 20 }}
          >
            <View style={{ flexDirection: rtl.row, gap: 10, alignItems: 'center' }}>
              <BookOpenText size={24} color={nw.color.tealIcon} strokeWidth={1.75} />
              <Text
                style={{
                  ...nw.type.h3,
                  color: nw.color.ink,
                  textAlign: rtl.textRight,
                  writingDirection: 'rtl',
                }}
              >
                סיפור הפרשה
              </Text>
            </View>
            <Text
              style={{
                ...nw.type.bodyStrong,
                color: nw.color.ink,
                marginTop: 12,
                textAlign: rtl.textRight,
                writingDirection: 'rtl',
              }}
            >
              {`${parasha.name} – ${parasha.story.title}`}
            </Text>
            <Text
              numberOfLines={4}
              style={{
                ...nw.type.bodySm,
                color: nw.color.inkSoft,
                marginTop: 8,
                textAlign: rtl.textRight,
                writingDirection: 'rtl',
              }}
            >
              {parasha.story.adult}
            </Text>
            <PillButton
              title="קרא את הסיפור"
              style={{ marginTop: 16 }}
              onPress={() => router.push({ pathname: '/story', params: { kind: 'parasha' } })}
            />
          </GlassSurface>

          <PrimaryButton
            variant="solid"
            title={lastVerseId ? 'המשך מאיפה שעצרת' : 'למסלול הקריאה'}
            style={{ marginHorizontal: nw.space.screenX, marginTop: 16 }}
            onPress={() => (doneAll ? router.push('/completion') : router.push('/reading'))}
          />
        </ScrollView>
      </SafeAreaView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  splashHeader: {
    flexDirection: rtl.row,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
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
});
