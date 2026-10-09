import { BookOpen, Languages, Repeat } from 'lucide-react-native';
import React from 'react';
import { type StyleProp, type ViewStyle } from 'react-native';
import type { Aliyah } from '../data/types';
import { ORDINAL_SHORT, dayName } from '../reading/journey';
import { useAppStore } from '../store/useAppStore';
import { aliyahHue, passHue } from '../theme/design';
import { CheckRow } from './CheckRow';
import { GlassSurface } from './GlassSurface';
import { SectionHeader } from './Section';

/** שניים מקרא ואחד תרגום — התקדמות כל מעבר בעלייה הנבחרת, כל מעבר בגוון משלו */
export function PassProgressCard({ aliyah, style, wide }: { aliyah: Aliyah; style?: StyleProp<ViewStyle>; wide?: boolean }) {
  const progress = useAppStore((s) => s.progress);
  let m1 = 0;
  let m2 = 0;
  let onk = 0;
  for (const id of aliyah.verseIds) {
    const p = progress[id];
    if (p?.mikra1) m1++;
    if (p?.mikra2) m2++;
    if (p?.onkelos) onk++;
  }
  const n = aliyah.verseIds.length;
  const row = (count: number) => ({
    done: n > 0 && count >= n,
    inProgress: count > 0 && count < n,
    ratio: n ? count / n : 0,
    caption: `${count}/${n} פסוקים`,
  });
  return (
    <GlassSurface variant="card" radius={22} style={style} contentStyle={{ paddingVertical: 10, paddingHorizontal: wide ? 24 : 18 }}>
      <SectionHeader
        title="שניים מקרא ואחד תרגום"
        subtitle={`${dayName(aliyah)} · עלייה ${ORDINAL_SHORT[aliyah.id - 1]}`}
        size="sm"
        color={aliyahHue(aliyah.id).solid}
        style={{ marginTop: 8, marginBottom: 2 }}
      />
      <CheckRow label="מקרא – קריאה ראשונה" Icon={BookOpen} hue={passHue.mikra1} {...row(m1)} />
      <CheckRow label="מקרא – קריאה שנייה" Icon={Repeat} hue={passHue.mikra2} {...row(m2)} />
      <CheckRow label="תרגום אונקלוס" Icon={Languages} hue={passHue.onkelos} {...row(onk)} last />
    </GlassSurface>
  );
}
