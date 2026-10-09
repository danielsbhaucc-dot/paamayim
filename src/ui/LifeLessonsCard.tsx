import { Sprout } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import type { ContentItem } from '../data/types';
import { nw } from '../theme/design';
import { fonts } from '../theme/fonts';
import { rtl } from '../theme/rtl';
import { GlassSurface } from './GlassSurface';
import { SectionHeader } from './Section';

type Props = {
  items: ContentItem[];
  /** web רחב: פריסה בשתי עמודות וטקסט מעט גדול יותר */
  wide?: boolean;
  /** בשולחן עבודה רחב — ארבעה פריטים בשורה אחת */
  columns?: 1 | 2 | 4;
  child?: boolean;
  style?: StyleProp<ViewStyle>;
};

/** ״מה אפשר לקחת לחיים״ — כרטיס זכוכית עם עיגולי מנטה ממוספרים. לא מוצג בלי תוכן מפורסם. */
export function LifeLessonsCard({ items, wide = false, columns = 1, child = false, style }: Props) {
  if (!items.length) return null;
  const cols = wide ? columns : 1;
  return (
    <GlassSurface variant="card" radius={wide ? 24 : 22} style={style} contentStyle={{ padding: wide ? 24 : 20 }}>
      <SectionHeader
        title="מה אפשר לקחת לחיים"
        icon={<Sprout size={22} color={nw.color.tealIcon} strokeWidth={1.75} />}
        ornament="leaf"
        style={{ marginTop: 0, marginBottom: 4 }}
      />
      {child ? (
        <Text style={[styles.rtl, { ...nw.type.label, color: nw.color.tealText, marginTop: 4 }]}>
          בשביל הילדים
        </Text>
      ) : null}
      <View
        style={{
          flexDirection: cols > 1 ? rtl.row : 'column',
          flexWrap: 'wrap',
          gap: cols > 1 ? 22 : 16,
          marginTop: 16,
        }}
      >
        {items.map((item, i) => (
          <View
            key={i}
            style={{
              flexDirection: rtl.row,
              gap: 12,
              alignItems: 'flex-start',
              ...(cols > 1 ? { flexBasis: cols === 4 ? '22%' : '45%', flexGrow: 1 } : null),
            }}
          >
            <View style={styles.num}>
              <Text style={styles.numText}>{i + 1}</Text>
            </View>
            <View style={{ flex: 1 }}>
              {item.title ? (
                <Text style={[styles.rtl, { ...nw.type.bodyStrong, color: nw.color.ink, fontSize: wide ? 17 : 16 }]}>
                  {item.title}
                </Text>
              ) : null}
              {item.text ? (
                <Text
                  style={[
                    styles.rtl,
                    {
                      ...nw.type.bodySm,
                      color: nw.color.inkSoft,
                      marginTop: item.title ? 3 : 0,
                      ...(wide ? { fontSize: 16, lineHeight: 26 } : null),
                    },
                  ]}
                >
                  {item.text}
                </Text>
              ) : null}
            </View>
          </View>
        ))}
      </View>
    </GlassSurface>
  );
}

const styles = StyleSheet.create({
  rtl: { textAlign: rtl.textRight, writingDirection: 'rtl' },
  num: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: nw.color.mint,
    borderWidth: 1,
    borderColor: nw.surface.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  numText: { fontFamily: fonts.uiBold, fontSize: 15, color: nw.color.tealDeep },
});
