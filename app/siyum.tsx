import { Asset } from 'expo-asset';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { shareSiyum } from '../src/schedule/shareSiyum';
import { useAppStore } from '../src/store/useAppStore';
import { nw } from '../src/theme/design';
import { fonts } from '../src/theme/fonts';
import { img } from '../src/theme/images';
import { SiyumCardView } from '../src/ui/SiyumCard';

/** כרטיס סיום — חומש או התורה כולה. אפשר גם ?demo=genesis לתצוגה */
export default function SiyumScreen() {
  const router = useRouter();
  const { key, demo } = useLocalSearchParams<{ key?: string; demo?: string }>();
  const siyumim = useAppStore((s) => s.siyumim);
  const clear = useAppStore((s) => s.clearPendingSiyum);
  const ref = useRef<View>(null);
  const [busy, setBusy] = useState(false);
  const s =
    siyumim.find((x) => x.key === key) ??
    (demo ? { key: 'demo', book: demo, year: 5787, parashot: demo === 'genesis' ? 12 : 54 } : siyumim[siyumim.length - 1]);
  const all = demo === 'torah' ? [{ book: 'torah', year: 5786 }, { book: 'torah', year: 5785 }, { book: 'torah', year: 5787 }] : siyumim;

  const onShare = async () => {
    if (!s) return;
    setBusy(true);
    try {
      const logo = Platform.OS === 'web' ? Asset.fromModule(img.logoMark).uri : undefined;
      await shareSiyum(ref.current, s, all, logo);
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#E9EEF0' }}>
      <ScrollView contentContainerStyle={{ alignItems: 'center', padding: 24, gap: 22 }}>
        {s ? <SiyumCardView ref={ref} s={s} all={all} /> : <Text style={{ fontFamily: fonts.ui }}>אין עדיין סיום</Text>}
        {s ? (
          <Pressable
            accessibilityRole="button"
            onPress={onShare}
            disabled={busy}
            style={{ backgroundColor: nw.color.tealBright, paddingHorizontal: 30, paddingVertical: 13, borderRadius: 999 }}
          >
            <Text style={{ fontFamily: fonts.uiBold, fontSize: 17, color: '#fff' }}>
              {Platform.OS === 'web' ? 'הורדת התמונה' : 'שיתוף'}
            </Text>
          </Pressable>
        ) : null}
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            clear();
            router.canGoBack() ? router.back() : router.replace('/');
          }}
          hitSlop={8}
        >
          <Text style={{ fontFamily: fonts.uiSemi, fontSize: 16, color: nw.color.tealText }}>חזרה</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
