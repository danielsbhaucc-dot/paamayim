import React from 'react';
import { Pressable, View } from 'react-native';
import { useAppStore } from '../store/useAppStore';
import { useLayout } from '../ui/useLayout';
import { SideMenu } from './SideMenu';

/** רוחב מגירת התפריט ב-web רחב */
const DRAWER_W = 420;

/**
 * מארח ל-SideMenu (שנשאר ללא שינוי).
 * טלפון / native: מרונדר בדיוק כמו קודם — מסך מלא.
 * web רחב: אותו תפריט בתוך מגירה מימין ברוחב 420, עם רקע מעומעם שסוגר בלחיצה.
 * ה-transform יוצר containing block, כך שה-position:fixed של התפריט נשאר בתוך המגירה.
 */
export function SideMenuHost() {
  const { isWide } = useLayout();
  const open = useAppStore((s) => s.sideMenuOpen);
  const close = useAppStore((s) => s.closeSideMenu);

  if (!isWide) return <SideMenu />;

  return (
    <>
      {open ? (
        <Pressable
          onPress={close}
          accessibilityRole="button"
          accessibilityLabel="סגור תפריט"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 9998,
            backgroundColor: 'rgba(11,42,74,0.22)',
          }}
        />
      ) : null}
      <View
        pointerEvents="box-none"
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          right: 0,
          width: DRAWER_W,
          zIndex: 9999,
          overflow: 'hidden',
          borderTopLeftRadius: 28,
          borderBottomLeftRadius: 28,
          transform: [{ translateX: 0 }],
        }}
      >
        <SideMenu />
      </View>
    </>
  );
}
