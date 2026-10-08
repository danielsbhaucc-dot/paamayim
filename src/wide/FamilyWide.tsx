import { useRouter } from 'expo-router';
import { Smile, User, Users, type LucideIcon } from 'lucide-react-native';
import React, { useMemo } from 'react';
import { Text, View } from 'react-native';
import { getCurrentParasha } from '../data/parashot';
import type { FamilyVoice } from '../data/types';
import { useAppStore } from '../store/useAppStore';
import { nw } from '../theme/design';
import { img } from '../theme/images';
import { rtl } from '../theme/rtl';
import {
  GlassSurface,
  IllustrationCard,
  PillButton,
  PrimaryButton,
  WideCols,
  WidePage,
  wideText,
} from '../ui';

/** מצב משפחה — web רחב: שני הקולות זה לצד זה; בחירת כרטיס = בחירת הקול. */
export function FamilyWide() {
  const router = useRouter();
  const calendarMode = useAppStore((s) => s.calendarMode);
  const familyVoice = useAppStore((s) => s.familyVoice);
  const setFamilyVoice = useAppStore((s) => s.setFamilyVoice);
  const parasha = useMemo(() => getCurrentParasha(calendarMode), [calendarMode]);

  const openStory = () => router.push({ pathname: '/story', params: { kind: 'parasha' } });
  const openReading = () =>
    router.push({
      pathname: '/reading',
      params: { focus: parasha.story.verseIds.join(','), aliyah: '1' },
    });

  const card = (voice: FamilyVoice, label: string, Icon: LucideIcon) => {
    const isChild = voice === 'child';
    const selected = familyVoice === voice;
    return (
      <GlassSurface
        variant="strong"
        radius={26}
        style={{ flex: 1 }}
        borderColor={selected ? nw.color.selectedBorder : undefined}
        borderWidth={selected ? 2 : 1}
        onPress={() => setFamilyVoice(voice)}
        accessibilityLabel={label}
        accessibilityRole="tab"
        accessibilityState={{ selected }}
        contentStyle={{ padding: 14 }}
      >
        <IllustrationCard
          source={isChild ? img.familyChild : img.familyAdult}
          aspectRatio={16 / 10}
          radius={18}
        />
        <View style={{ padding: 12, paddingTop: 16 }}>
          <View style={{ flexDirection: rtl.row, alignItems: 'center', gap: 8 }}>
            <Icon size={20} color={nw.color.tealIcon} strokeWidth={1.75} />
            <Text style={{ ...nw.type.label, color: nw.color.tealIcon, writingDirection: 'rtl' }}>
              {selected ? `${label} · נבחר` : label}
            </Text>
          </View>
          <Text style={{ ...wideText(nw.type.h2), color: nw.color.ink, marginTop: 8 }}>
            {isChild ? 'הכל התחיל באור' : parasha.story.title}
          </Text>
          <Text numberOfLines={7} style={{ ...wideText(nw.type.body), color: nw.color.inkSoft, marginTop: 8 }}>
            {isChild ? parasha.story.child : parasha.story.adult}
          </Text>
          <PillButton
            title="לסיפור המלא"
            style={{ marginTop: 18 }}
            onPress={() => {
              setFamilyVoice(voice);
              openStory();
            }}
          />
        </View>
      </GlassSurface>
    );
  };

  return (
    <WidePage
      title="מצב משפחה"
      subtitle="שני קולות, סיפור אחד"
      icon={<Users size={34} color={nw.color.tealIcon} strokeWidth={1.75} />}
    >
      <WideCols>
        {card('adult', 'מבוגר', User)}
        {card('child', 'ילד/ה', Smile)}
      </WideCols>
      <PrimaryButton
        variant="solid"
        title={
          familyVoice === 'child' ? 'הצג את הפסוקים שהסיפור נשען עליהם' : 'עבור לכרטיס הקריאה'
        }
        style={{ marginTop: 26, width: '100%', maxWidth: 520, alignSelf: 'center' }}
        onPress={openReading}
      />
    </WidePage>
  );
}
