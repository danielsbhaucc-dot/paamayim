import { useRouter } from 'expo-router';
import {
  Check,
  ChevronLeft,
  FileText,
  Globe,
  Menu,
  RotateCcw,
  Settings,
  Sunrise,
  type LucideIcon,
} from 'lucide-react-native';
import React from 'react';
import { Alert, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppStore } from '../../src/store/useAppStore';
import { APP_NAME } from '../../src/theme/brand';
import { nw } from '../../src/theme/design';
import { rtl } from '../../src/theme/rtl';
import {
  GlassSurface,
  IsraelFlag,
  ScreenBackground,
  ScreenHeader,
  WideCols,
  WidePage,
  WideSectionTitle,
  useLayout,
} from '../../src/ui';

export default function MoreScreen() {
  const { isWide } = useLayout();
  return isWide ? <MoreWide /> : <MoreMobile />;
}

function MoreMobile() {
  const router = useRouter();
  const openSideMenu = useAppStore((s) => s.openSideMenu);
  const calendarMode = useAppStore((s) => s.calendarMode);
  const setCalendarMode = useAppStore((s) => s.setCalendarMode);
  const resetProgress = useAppStore((s) => s.resetProgress);
  const setOnboardingDone = useAppStore((s) => s.setOnboardingDone);

  return (
    <ScreenBackground variant="mist">
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView contentContainerStyle={{ paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
          <ScreenHeader title="עוד אפשרויות" showBack={false} />

          <Text style={sectionTitle}>בחירת לוח</Text>
          <View style={{ flexDirection: rtl.row, gap: 12, paddingHorizontal: nw.space.screenX }}>
            <CalCard
              active={calendarMode === 'israel'}
              title="לוח ישראל"
              icon={<IsraelFlag size={44} />}
              onPress={() => setCalendarMode('israel')}
            />
            <CalCard
              active={calendarMode === 'diaspora'}
              title="לוח חו״ל"
              icon={<Globe size={36} color={nw.color.tealIcon} strokeWidth={1.5} />}
              onPress={() => setCalendarMode('diaspora')}
            />
          </View>

          <GlassSurface
            variant="card"
            padded={false}
            style={{ marginHorizontal: nw.space.screenX, marginTop: nw.space.gap + 6 }}
            contentStyle={{ paddingHorizontal: 16, paddingVertical: 4 }}
          >
            <MenuRow Icon={Menu} title="פתח תפריט ניווט" onPress={openSideMenu} />
            <MenuRow Icon={Sunrise} title="מסך פתיחה מחדש" onPress={() => setOnboardingDone(false)} />
            <MenuRow Icon={FileText} title="משפטי" onPress={() => router.push('/legal')} />
            <MenuRow
              Icon={RotateCcw}
              title="איפוס התקדמות"
              danger
              last
              onPress={() =>
                Alert.alert('איפוס התקדמות?', 'כל סימוני המעברים יימחקו.', [
                  { text: 'ביטול', style: 'cancel' },
                  {
                    text: 'איפוס',
                    style: 'destructive',
                    onPress: () => {
                      resetProgress();
                      setOnboardingDone(false);
                    },
                  },
                ])
              }
            />
          </GlassSurface>

          <Text
            style={{
              ...nw.type.caption,
              color: nw.color.inkMuted,
              textAlign: 'center',
              writingDirection: 'rtl',
              marginTop: 18,
            }}
          >
            {`${APP_NAME} · גרסה 1.0`}
          </Text>
        </ScrollView>
      </SafeAreaView>
    </ScreenBackground>
  );
}

const sectionTitle = {
  ...nw.type.h3,
  color: nw.color.ink,
  textAlign: rtl.textRight,
  writingDirection: 'rtl' as const,
  paddingHorizontal: nw.space.screenX,
  marginTop: 8,
  marginBottom: 10,
};

function CalCard({
  active,
  title,
  icon,
  onPress,
}: {
  active: boolean;
  title: string;
  icon: React.ReactNode;
  onPress: () => void;
}) {
  return (
    <View style={{ flex: 1 }}>
      <GlassSurface
        variant="strong"
        radius={nw.radius.card}
        padded={false}
        borderColor={active ? nw.color.selectedBorder : undefined}
        borderWidth={active ? 1.5 : 1}
        contentStyle={{ alignItems: 'center', paddingVertical: 20, gap: 10 }}
        onPress={onPress}
        accessibilityRole="radio"
        accessibilityState={{ checked: active }}
        accessibilityLabel={title}
      >
        <View
          style={{
            width: 60,
            height: 60,
            borderRadius: 30,
            backgroundColor: '#FFFFFF',
            alignItems: 'center',
            justifyContent: 'center',
            ...nw.shadow.card,
          }}
        >
          {icon}
        </View>
        <Text style={{ ...nw.type.bodyStrong, color: nw.color.ink, textAlign: 'center', writingDirection: 'rtl' }}>
          {title}
        </Text>
      </GlassSurface>
      {active ? (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: 10,
            ...rtl.left(10),
            width: 24,
            height: 24,
            borderRadius: 12,
            backgroundColor: nw.color.tealBright,
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2,
          }}
        >
          <Check size={14} color="#FFFFFF" strokeWidth={3} />
        </View>
      ) : null}
    </View>
  );
}

function MenuRow({
  Icon,
  title,
  onPress,
  danger,
  last,
}: {
  Icon: LucideIcon;
  title: string;
  onPress: () => void;
  danger?: boolean;
  last?: boolean;
}) {
  const color = danger ? nw.color.danger : nw.color.ink;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
      style={({ pressed }) => ({
        flexDirection: rtl.row,
        alignItems: 'center',
        gap: 12,
        minHeight: 56,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: nw.color.divider,
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <Icon size={nw.icon.size} color={danger ? nw.color.danger : nw.color.tealIcon} strokeWidth={nw.icon.stroke} />
      <Text style={{ ...nw.type.bodyStrong, color, flex: 1, textAlign: rtl.textRight, writingDirection: 'rtl' }}>
        {title}
      </Text>
      <ChevronLeft size={nw.icon.sizeSm} color={nw.color.inkMuted} strokeWidth={nw.icon.stroke} />
    </Pressable>
  );
}

/** עוד — web רחב: בחירת לוח מימין, פעולות משמאל. */
function MoreWide() {
  const router = useRouter();
  const openSideMenu = useAppStore((s) => s.openSideMenu);
  const calendarMode = useAppStore((s) => s.calendarMode);
  const setCalendarMode = useAppStore((s) => s.setCalendarMode);
  const resetProgress = useAppStore((s) => s.resetProgress);
  const setOnboardingDone = useAppStore((s) => s.setOnboardingDone);

  const confirmReset = () => {
    const doReset = () => {
      resetProgress();
      setOnboardingDone(false);
    };
    // Alert.alert לא מציג דיאלוג ב-web — שם משתמשים ב-confirm של הדפדפן
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      if (window.confirm('איפוס התקדמות?\nכל סימוני המעברים יימחקו.')) doReset();
      return;
    }
    Alert.alert('איפוס התקדמות?', 'כל סימוני המעברים יימחקו.', [
      { text: 'ביטול', style: 'cancel' },
      { text: 'איפוס', style: 'destructive', onPress: doReset },
    ]);
  };

  return (
    <WidePage title="עוד אפשרויות" maxWidth={980}>
      <WideCols align="flex-start" gap={28}>
        <View style={{ flex: 1 }}>
          <WideSectionTitle>בחירת לוח</WideSectionTitle>
          <View style={{ flexDirection: rtl.row, gap: 16 }}>
            <CalCard
              active={calendarMode === 'israel'}
              title="לוח ישראל"
              icon={<IsraelFlag size={44} />}
              onPress={() => setCalendarMode('israel')}
            />
            <CalCard
              active={calendarMode === 'diaspora'}
              title="לוח חו״ל"
              icon={<Globe size={36} color={nw.color.tealIcon} strokeWidth={1.5} />}
              onPress={() => setCalendarMode('diaspora')}
            />
          </View>
        </View>
        <View style={{ flex: 1 }}>
          <WideSectionTitle>פעולות</WideSectionTitle>
          <GlassSurface variant="card" padded={false} contentStyle={{ paddingHorizontal: 18, paddingVertical: 4 }}>
            <MenuRow Icon={Settings} title="הגדרות" onPress={() => router.push('/settings')} />
            <MenuRow Icon={Menu} title="פתח תפריט ניווט" onPress={openSideMenu} />
            <MenuRow Icon={Sunrise} title="מסך פתיחה מחדש" onPress={() => setOnboardingDone(false)} />
            <MenuRow Icon={FileText} title="משפטי" onPress={() => router.push('/legal')} />
            <MenuRow Icon={RotateCcw} title="איפוס התקדמות" danger last onPress={confirmReset} />
          </GlassSurface>
        </View>
      </WideCols>
      <Text style={{ ...nw.type.caption, color: nw.color.inkMuted, textAlign: 'center', writingDirection: 'rtl', marginTop: 28 }}>
        {`${APP_NAME} · גרסה 1.0`}
      </Text>
    </WidePage>
  );
}
