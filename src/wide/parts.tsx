import type { LucideIcon } from 'lucide-react-native';
import React from 'react';
import { View } from 'react-native';
import { nw } from '../theme/design';

/** עיגול מנטה עם אייקון קו — לאריחים ולכרטיסים ב-web רחב */
export function IconBadge({ Icon, size = 48 }: { Icon: LucideIcon; size?: number }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: nw.color.mint,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.9)',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Icon size={Math.round(size * 0.5)} color={nw.color.tealIcon} strokeWidth={1.75} />
    </View>
  );
}
