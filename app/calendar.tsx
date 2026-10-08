import { useLocalSearchParams, useRouter } from 'expo-router';
import { CalendarDays, Check, Globe } from 'lucide-react-native';
import React from 'react';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppStore } from '../src/store/useAppStore';
import { nw } from '../src/theme/design';
import { fonts } from '../src/theme/fonts';
import { img } from '../src/theme/images';
import { rtl } from '../src/theme/rtl';
import {
  GlassSurface,
  IsraelFlag,
  PrimaryButton,
  ScreenBackground,
  ScreenHeader,
  useLayout,
} from '../src/ui';

export default function CalendarScreen() {
  const { onboarding } = useLocalSearchParams<{ onboarding?: string }>();
  const router = useRouter();
  const calendarMode = useAppStore((s) => s.calendarMode);
  const setCalendarMode = useAppStore((s) => s.setCalendarMode);
  const setOnboardingDone = useAppStore((s) => s.setOnboardingDone);
  // web רחב: שני הכרטיסים זה לצד זה בעמודה ממורכזת; בטלפון — בדיוק כמו קודם
  const { isWide } = useLayout();

  const onContinue = () => {
    if (onboarding === '1') {
      setOnboardingDone(true);
      router.replace('/(tabs)');
    } else {
      router.back();
    }
  };

  return (
    <ScreenBackground
      variant="photo"
      source={img.calendar}
      showNav={false}
      wideNav={onboarding !== '1'}
      wideMaxWidth={880}
    >
      <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1 }}>
        <ScreenHeader
          title="בחירת לוח"
          endSlot={<CalendarDays size={24} color={nw.color.tealIcon} strokeWidth={1.75} />}
        />

        <View
          style={[
            {
              flex: 1,
              paddingHorizontal: nw.space.screenX,
              paddingTop: 12,
              gap: 16,
            },
            isWide && {
              flexGrow: 0,
              flexShrink: 0,
              flexBasis: 'auto',
              flexDirection: rtl.row,
              gap: 24,
              paddingTop: 64,
              paddingBottom: 36,
            },
          ]}
        >
          <ModeCard
            wide={isWide}
            selected={calendarMode === 'israel'}
            onPress={() => setCalendarMode('israel')}
            icon={
              <View
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: 36,
                  backgroundColor: '#FFFFFF',
                  alignItems: 'center',
                  justifyContent: 'center',
                  ...nw.shadow.card,
                }}
              >
                <IsraelFlag size={60} />
              </View>
            }
            title="לוח ישראל"
            description="הזמנים לפי לוח השנה הרגיל בישראל"
          />

          <ModeCard
            wide={isWide}
            selected={calendarMode === 'diaspora'}
            onPress={() => setCalendarMode('diaspora')}
            icon={<Globe size={48} color={nw.color.tealIcon} strokeWidth={1.5} />}
            title="לוח חו״ל"
            description="לפי לוח שנה מקובל בחו״ל"
          />
        </View>

        <PrimaryButton
          title="המשך"
          icon="none"
          onPress={onContinue}
          style={[
            { marginHorizontal: nw.space.screenX, marginBottom: 24 },
            isWide && { width: 420, alignSelf: 'center' },
          ]}
        />
      </SafeAreaView>
    </ScreenBackground>
  );
}

function ModeCard({
  wide,
  selected,
  onPress,
  icon,
  title,
  description,
}: {
  wide?: boolean;
  selected: boolean;
  onPress: () => void;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <View style={wide ? { flex: 1 } : undefined}>
      <GlassSurface
        variant="strong"
        radius={24}
        padded={false}
        borderColor={selected ? nw.color.selectedBorder : undefined}
        borderWidth={selected ? 1.5 : 1}
        contentStyle={{ alignItems: 'center', paddingVertical: 28, paddingHorizontal: 24 }}
        onPress={onPress}
        accessibilityRole="radio"
        accessibilityState={{ checked: selected }}
        accessibilityLabel={title}
      >
        {icon}
        <Text
          style={{
            fontFamily: fonts.uiBold,
            fontSize: 21,
            color: nw.color.ink,
            marginTop: 14,
            textAlign: 'center',
            writingDirection: 'rtl',
          }}
        >
          {title}
        </Text>
        <Text
          style={{
            fontFamily: fonts.uiMedium,
            fontSize: 15,
            lineHeight: 22,
            color: nw.color.inkSoft,
            textAlign: 'center',
            writingDirection: 'rtl',
            maxWidth: 230,
            marginTop: 6,
          }}
        >
          {description}
        </Text>
      </GlassSurface>
      {selected ? (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: 14,
            ...rtl.left(14),
            width: 26,
            height: 26,
            borderRadius: 13,
            backgroundColor: nw.color.tealBright,
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2,
          }}
        >
          <Check size={16} color="#fff" strokeWidth={3} />
        </View>
      ) : null}
    </View>
  );
}
