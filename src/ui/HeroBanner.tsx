import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Text, useWindowDimensions, View } from 'react-native';
import { nw } from '../theme/design';
import { fonts } from '../theme/fonts';
import { img } from '../theme/images';
import { rtl } from '../theme/rtl';
import { GlassSurface } from './GlassSurface';
import { frostText } from './frostText';
import { WaveEdge } from './WaveEdge';

type Props = {
  parashaName: string;
  /** כותרת־על מעל שם הפרשה (ברירת מחדל: ״פרשת השבוע״) */
  eyebrow?: string;
  rangeLabel: string;
  /**
   * כמה הבאנר נמשך למעלה מתחת לכותרת הצפה (status bar + header + 8).
   * התוכן שמתחת נשאר בדיוק באותו מקום; התמונה ממשיכה מאחורי הכותרת עם scrim רך.
   */
  underlay?: number;
  /**
   * חלק מ-underlay שהוא safe-area עליון (notch / Dynamic Island).
   * התמונה ממוסגרת לפי הגובה בלי ה-inset, כך שבאייפון עם notch היא לא ״מתקרבת״;
   * הרצועה שמעליה מתמלאת בהשתקפות של שמי התמונה (מתחת ל-scrim של הכותרת).
   */
  safeTop?: number;
};

/** מידות home-hero-tree.jpg */
const HERO_W = 1168;
const HERO_H = 784;

/** cover + עיגון לשמאל, בגובה מסגרת קבוע — לא תלוי ב-safe area */
function HeroImage({ frameH, safeTop }: { frameH: number; safeTop: number }) {
  const { width } = useWindowDimensions();
  const scale = Math.max(width / HERO_W, frameH / HERO_H);
  const w = HERO_W * scale;
  const h = HERO_H * scale;
  const top = safeTop + (frameH - h) / 2;
  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden' }}>
      {top > 0 ? (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: top + 1, overflow: 'hidden' }}>
          <Image
            source={img.homeHeroTree}
            style={{ position: 'absolute', ...rtl.left(0), top: top - h, width: w, height: h, transform: [{ scaleY: -1 }] }}
          />
        </View>
      ) : null}
      <Image source={img.homeHeroTree} style={{ position: 'absolute', ...rtl.left(0), top, width: w, height: h }} />
    </View>
  );
}

/** באנר הבית: קצה תחתון גלי ועדין, עם קו לבן דק שמפריד בין התמונה לדף. */
export function HeroBanner({ parashaName, eyebrow = 'פרשת השבוע', rangeLabel, underlay, safeTop = 0 }: Props) {
  const under = underlay ?? 0;
  return (
    <View
      style={{
        width: '100%',
        height: 262 + under,
        marginTop: underlay != null ? 0 : 8,
      }}
    >
      {underlay != null ? (
        <HeroImage frameH={262 + under - safeTop} safeTop={safeTop} />
      ) : (
        <Image
          source={img.homeHeroTree}
          contentFit="cover"
          contentPosition="center"
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        />
      )}
      {underlay != null ? (
        <LinearGradient
          pointerEvents="none"
          colors={nw.header.scrim}
          locations={nw.header.scrimLocations}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, height: under + 28 }}
        />
      ) : (
        <LinearGradient
          colors={[`${nw.color.mistTop}E6`, 'transparent']}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 40 }}
        />
      )}
      <WaveEdge />
      <GlassSurface
        variant="frost"
        radius={22}
        style={{
          position: 'absolute',
          top: 18 + under,
          bottom: 44,
          ...rtl.right(18),
          width: '58%',
        }}
        contentStyle={{
          alignItems: 'center',
          justifyContent: 'center',
          padding: 18,
        }}
      >
        <Text
          style={{
            fontFamily: fonts.uiSemi,
            fontSize: 16,
            color: nw.color.ink,
            textAlign: 'center',
            writingDirection: 'rtl',
          }}
        >
          {eyebrow}
        </Text>
        <Text
          accessibilityRole="header"
          style={{
            ...nw.type.parashaName,
            color: nw.color.ink,
            ...frostText,
            textAlign: 'center',
            writingDirection: 'rtl',
          }}
        >
          {parashaName}
        </Text>
        <GlassSurface
          variant="subtle"
          radius={nw.radius.pill}
          padded={false}
          style={{ marginTop: 10 }}
          contentStyle={{ paddingVertical: 6, paddingHorizontal: 16 }}
        >
          <Text
            style={{
              ...nw.type.label,
              color: nw.color.inkSoft,
              textAlign: 'center',
              writingDirection: 'rtl',
            }}
          >
            {rangeLabel}
          </Text>
        </GlassSurface>
      </GlassSurface>
    </View>
  );
}
