import { X } from 'lucide-react-native';
import React from 'react';
import { Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { nw } from '../theme/design';
import { fonts } from '../theme/fonts';
import { rtl } from '../theme/rtl';
import { GlassSurface } from './GlassSurface';

/** מצב ״פסוקי הסיפור״: מסביר איפה אני ונותן יציאה ברורה חזרה לקריאת העלייה */
export function FocusBanner({ onExit, style }: { onExit: () => void; style?: StyleProp<ViewStyle> }) {
  return (
    <GlassSurface
      variant="subtle"
      radius={nw.radius.pill}
      padded={false}
      shadow="none"
      onPress={onExit}
      accessibilityRole="button"
      accessibilityLabel="יציאה מפסוקי הסיפור וחזרה לקריאת העלייה"
      style={[{ alignSelf: 'center' }, style]}
      contentStyle={{ flexDirection: rtl.row, alignItems: 'center', gap: 8, paddingVertical: 8, paddingHorizontal: 14 }}
    >
      <Text style={{ fontFamily: fonts.uiSemi, fontSize: 13, color: nw.color.inkSoft, writingDirection: 'rtl' }}>
        מעיינים בפסוקי הסיפור ·
      </Text>
      <Text style={{ fontFamily: fonts.uiBold, fontSize: 13, color: nw.color.teal, writingDirection: 'rtl' }}>
        חזרה לקריאת העלייה
      </Text>
      <View
        style={{
          width: 20,
          height: 20,
          borderRadius: 10,
          backgroundColor: nw.color.tealSoft,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <X size={13} color={nw.color.teal} strokeWidth={2.5} />
      </View>
    </GlassSurface>
  );
}
