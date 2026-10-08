import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Check, Leaf, Trophy } from 'lucide-react-native';
import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { countPasses, getCurrentParasha, isParashaComplete } from '../src/data/parashot';
import { useAppStore } from '../src/store/useAppStore';
import { nw } from '../src/theme/design';
import { fonts } from '../src/theme/fonts';
import { img, imgReady } from '../src/theme/images';
import { rtl } from '../src/theme/rtl';
import {
  GlassSurface,
  PrimaryButton,
  ScreenBackground,
  ScreenHeader,
  StatTile,
} from '../src/ui';

const LEAVES: {
  left: number;
  top: number;
  size: number;
  rotate: string;
  color: string;
}[] = [
  { left: 20, top: 40, size: 18, rotate: '-30deg', color: nw.color.tealBright },
  { left: 60, top: 10, size: 14, rotate: '20deg', color: nw.color.gold },
  { left: 250, top: 30, size: 20, rotate: '35deg', color: nw.color.tealBright },
  { left: 285, top: 80, size: 14, rotate: '-15deg', color: nw.color.tealIcon },
  { left: 30, top: 140, size: 16, rotate: '60deg', color: nw.color.tealIcon },
  { left: 270, top: 150, size: 18, rotate: '-50deg', color: nw.color.gold },
  { left: 100, top: 0, size: 12, rotate: '10deg', color: nw.color.tealIcon },
  { left: 210, top: 5, size: 12, rotate: '-20deg', color: nw.color.tealBright },
];

export default function CompletionScreen() {
  const router = useRouter();
  const calendarMode = useAppStore((s) => s.calendarMode);
  const progress = useAppStore((s) => s.progress);

  const parasha = useMemo(() => getCurrentParasha(calendarMode), [calendarMode]);
  const counts = useMemo(() => countPasses(parasha, progress), [parasha, progress]);
  const complete = useMemo(() => isParashaComplete(parasha, progress), [parasha, progress]);

  const total = parasha.verses.length;
  const fullDone = parasha.verses.filter((v) => {
    const p = progress[v.id];
    return p?.mikra1 && p?.mikra2 && p?.onkelos;
  }).length;
  const pct = total ? Math.round((fullDone / total) * 100) : 0;

  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [anim]);

  const scale = anim.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] });

  return (
    <ScreenBackground variant="photo" source={img.completion} showNav={false}>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <ScreenHeader title="" />
        <ScrollView
          contentContainerStyle={{
            alignItems: 'center',
            paddingHorizontal: nw.space.screenX,
            paddingTop: 12,
            paddingBottom: 120,
          }}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            style={{
              width: 320,
              height: 220,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: anim,
              transform: [{ scale }],
            }}
          >
            {imgReady.confettiLeaves ? (
              <Image
                source={img.confettiLeaves}
                contentFit="contain"
                style={{ position: 'absolute', width: 320, height: 220 }}
              />
            ) : (
              LEAVES.map((leaf, i) => (
                <View
                  key={i}
                  pointerEvents="none"
                  style={{
                    position: 'absolute',
                    left: leaf.left,
                    top: leaf.top,
                    opacity: 0.85,
                    transform: [{ rotate: leaf.rotate }],
                  }}
                >
                  <Leaf size={leaf.size} color={leaf.color} strokeWidth={1.75} />
                </View>
              ))
            )}

            <GlassSurface
              variant="subtle"
              tint="rgba(227,244,240,0.8)"
              radius={58}
              padded={false}
              style={{ width: 116, height: 116, alignSelf: 'center' }}
              contentStyle={{ alignItems: 'center', justifyContent: 'center' }}
            >
              {imgReady.trophy ? (
                <Image
                  source={img.trophy}
                  contentFit="contain"
                  style={{ width: 76, height: 76 }}
                />
              ) : (
                <Trophy
                  size={52}
                  color={nw.color.gold}
                  strokeWidth={1.75}
                  fill="rgba(242,180,32,0.25)"
                />
              )}
            </GlassSurface>
          </Animated.View>

          <Text
            accessibilityRole="header"
            style={{
              ...nw.type.display,
              color: nw.color.ink,
              textAlign: 'center',
              writingDirection: 'rtl',
              marginTop: 4,
            }}
          >
            {complete ? 'סיימת!' : 'כמעט שם'}
          </Text>

          <Text
            style={{
              fontFamily: fonts.uiBold,
              fontSize: 18,
              color: nw.color.tealDeep,
              textAlign: 'center',
              writingDirection: 'rtl',
              marginTop: 4,
            }}
          >
            שניים מקרא ואחד תרגום
          </Text>

          <View
            style={{
              flexDirection: rtl.row,
              gap: 12,
              marginTop: 28,
              justifyContent: 'center',
            }}
          >
            <StatTile tone="snow" caption={`${fullDone}/${total} פסוקים`}>
              <View
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                  backgroundColor: nw.color.mint,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {complete ? (
                  <Check size={30} color={nw.color.tealBright} strokeWidth={3} />
                ) : (
                  <Text
                    style={{
                      fontFamily: fonts.uiBold,
                      fontSize: 16,
                      color: nw.color.tealDeep,
                      textAlign: 'center',
                    }}
                  >
                    {`${pct}%`}
                  </Text>
                )}
              </View>
            </StatTile>
            <StatTile
              tone="mint"
              value="2"
              label="מקרא"
              sub="(פעמיים)"
              caption={`${Math.min(counts.mikra1, counts.mikra2)}/${total}`}
            />
            <StatTile
              tone="sky"
              value="1"
              label="תרגום"
              sub="אונקלוס"
              caption={`${counts.onkelos}/${total}`}
            />
          </View>

          <Text
            style={{
              fontFamily: fonts.uiBold,
              fontSize: 20,
              lineHeight: 30,
              color: nw.color.ink,
              textAlign: 'center',
              writingDirection: 'rtl',
              marginTop: 32,
            }}
          >
            {'"כל צעד קטן בלימוד\nהוא צעד גדול בדרך"'}
          </Text>
        </ScrollView>

        <View
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 24,
            paddingHorizontal: nw.space.screenX,
            gap: 10,
          }}
        >
          {!complete ? (
            <Pressable
              onPress={() => router.replace('/(tabs)')}
              accessibilityRole="button"
              accessibilityLabel="חזרה לבית"
              style={{ minHeight: 44, justifyContent: 'center' }}
            >
              <Text
                style={{
                  ...nw.type.bodyStrong,
                  color: nw.color.ink,
                  textShadowColor: nw.color.glow,
                  textShadowOffset: { width: 0, height: 0 },
                  textShadowRadius: 8,
                  textAlign: 'center',
                  writingDirection: 'rtl',
                }}
              >
                חזרה לבית
              </Text>
            </Pressable>
          ) : null}
          <PrimaryButton
            title={complete ? 'לפרשה הבאה' : 'להמשיך לקרוא'}
            icon="arrow"
            onPress={() =>
              complete ? router.replace('/(tabs)') : router.replace('/reading')
            }
          />
        </View>
      </SafeAreaView>
    </ScreenBackground>
  );
}
