import { ChevronDown, type LucideIcon } from 'lucide-react-native';
import React, { useState } from 'react';
import { Pressable, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { nw } from '../theme/design';
import { fonts } from '../theme/fonts';
import { rtl } from '../theme/rtl';
import { GlassSurface } from './GlassSurface';

type Props = {
  title: string;
  Icon: LucideIcon;
  /** תווית קצרה כשסגור (למשל ״3 חידושים״) */
  preview?: string;
  /** פתוח כברירת מחדל */
  defaultOpen?: boolean;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
};

/**
 * אקורדיון לתוכן בונוס בקריאה (הסבר אונקלוס, חידושים…).
 * סגור כברירת מחדל — המשתמש פותח רק מה שמעניין אותו.
 */
export function BonusFold({ title, Icon, preview, defaultOpen = false, style, children }: Props) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <GlassSurface
      reading
      variant="card"
      radius={22}
      style={style}
      padded={false}
      contentStyle={{ padding: 0, overflow: 'hidden' }}
    >
      <Pressable
        onPress={() => setOpen((o) => !o)}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={`${title}${open ? ', פתוח' : ', סגור'}${preview && !open ? `, ${preview}` : ''}`}
        style={({ pressed }) => [{
          flexDirection: rtl.row,
          alignItems: 'center',
          gap: 10,
          paddingVertical: 14,
          paddingHorizontal: 18,
          minHeight: 52,
          opacity: pressed ? 0.9 : 1,
        }]}
      >
        <Icon size={20} color={nw.color.tealIcon} strokeWidth={1.75} />
        <View style={{ flex: 1, gap: 2 }}>
          <Text
            style={{
              fontFamily: fonts.uiBold,
              fontSize: 16,
              color: nw.color.ink,
              textAlign: rtl.textRight,
              writingDirection: 'rtl',
            }}
          >
            {title}
          </Text>
          {!open && preview ? (
            <Text
              style={{
                fontFamily: fonts.uiSemi,
                fontSize: 13,
                color: nw.color.inkMuted,
                textAlign: rtl.textRight,
                writingDirection: 'rtl',
              }}
              numberOfLines={1}
            >
              {preview}
            </Text>
          ) : null}
        </View>
        <ChevronDown
          size={20}
          color={nw.color.inkMuted}
          strokeWidth={1.75}
          style={{ transform: [{ rotate: open ? '180deg' : '0deg' }] }}
        />
      </Pressable>
      {open ? (
        <View style={{ paddingHorizontal: 18, paddingBottom: 16, paddingTop: 2, gap: 8 }}>{children}</View>
      ) : null}
    </GlassSurface>
  );
}
