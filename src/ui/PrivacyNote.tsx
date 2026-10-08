import React, { useState } from 'react';
import { Alert, Platform, Pressable, Text, View } from 'react-native';
import { PRIVACY } from '../greeting/texts';
import { useAppStore } from '../store/useAppStore';
import { nw } from '../theme/design';
import { fonts } from '../theme/fonts';
import { rtl } from '../theme/rtl';

/** הסבר פרטיות קצר + מחיקת הפרטים האישיים (שם / פנייה) מהמכשיר */
export function PrivacyNote({ compact }: { compact?: boolean }) {
  const clear = useAppStore((s) => s.clearPersonalData);
  const hasData = useAppStore((s) => Boolean(s.userName || s.userGender));
  const [done, setDone] = useState(false);
  const run = () => {
    clear();
    setDone(true);
  };
  const ask = () => {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm(PRIVACY.confirm)) run();
      return;
    }
    Alert.alert(PRIVACY.delete, PRIVACY.confirm, [
      { text: 'ביטול', style: 'cancel' },
      { text: 'מחיקה', style: 'destructive', onPress: run },
    ]);
  };
  const T = { textAlign: rtl.textRight, writingDirection: 'rtl' as const };
  return (
    <View style={{ gap: 8 }}>
      {!compact ? <Text style={{ ...nw.type.h3, color: nw.color.ink, ...T }}>{PRIVACY.title}</Text> : null}
      <Text style={{ ...nw.type.bodySm, fontSize: compact ? 13 : 15, lineHeight: compact ? 20 : 24, color: nw.color.inkSoft, ...T }}>
        {PRIVACY.body}
      </Text>
      {hasData || done ? (
        <Pressable
          onPress={ask}
          disabled={done}
          accessibilityRole="button"
          accessibilityLabel={PRIVACY.delete}
          style={{ alignSelf: rtl.alignRight, minHeight: 44, justifyContent: 'center' }}
        >
          <Text style={{ fontFamily: fonts.uiBold, fontSize: 14, color: done ? nw.color.inkMuted : nw.color.dangerText, ...T }}>
            {done ? PRIVACY.done : PRIVACY.delete}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}
