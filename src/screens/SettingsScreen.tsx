import { useRouter } from 'expo-router';
import {
  ChevronLeft,
  FileText,
  Library,
  RotateCcw,
  Settings as SettingsIcon,
  Sunrise,
  type LucideIcon,
} from 'lucide-react-native';
import React, { useState } from 'react';
import { Alert, Animated, Platform, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { CalendarMode, FamilyVoice, ReadingView } from '../data/types';
import { READING_MODES } from '../reading/modes';
import { useAppStore } from '../store/useAppStore';
import { APP_NAME } from '../theme/brand';
import { nw } from '../theme/design';
import { rtl } from '../theme/rtl';
import {
  GlassSurface,
  LargeTitle,
  PersonalCard,
  PrivacyNote,
  ScreenBackground,
  ScreenHeader,
  SegmentedTabs,
  WideCols,
  WidePage,
  useCollapsingTitle,
  useLayout,
} from '../ui';

const T = { textAlign: rtl.textRight, writingDirection: 'rtl' } as const;

const MODE_HELP: Record<ReadingView, string> = {
  flow: 'כל העלייה ברצף: מקרא ותרגום לכל פסוק, והמקום נשמר תוך כדי גלילה.',
  verse: 'פסוק אחד בכל פעם, עם כרטיסי ״מה אונקלוס עשה כאן״ — לעיון מעמיק.',
  scroll: 'טקסט רציף כמו במגילה, והתרגום של הפסוק המסומן בפס שמתחת.',
};

/**
 * הגדרות — עמוד אחד מסודר (במקום ״עוד״ + ״הגדרות״ הכפולים). כל אפשרות מופיעה פעם אחת:
 * הפרטים שלך · קריאה ותצוגה · פרטיות ונתונים · מידע.
 */
export function SettingsScreen() {
  const { isWide } = useLayout();
  return isWide ? <SettingsWide /> : <SettingsMobile />;
}

function SettingsMobile() {
  const t = useCollapsingTitle();
  return (
    <ScreenBackground variant="mist">
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScreenHeader title="הגדרות" showBack={false} scrollY={t.scrollY} />
        <Animated.ScrollView
          contentContainerStyle={{ paddingBottom: 28, paddingHorizontal: nw.space.screenX }}
          showsVerticalScrollIndicator={false}
          {...t.scrollProps}
        >
          <LargeTitle
            title="הגדרות"
            subtitle="הפרטים שלך, הקריאה והפרטיות — במקום אחד"
            icon={<SettingsIcon size={28} color={nw.color.tealIcon} strokeWidth={1.75} />}
            scrollY={t.scrollY}
          />
          <PersonalSection />
          <ReadingSection />
          <PrivacySection />
          <InfoSection />
        </Animated.ScrollView>
      </SafeAreaView>
    </ScreenBackground>
  );
}

function SettingsWide() {
  return (
    <WidePage
      title="הגדרות"
      subtitle="הפרטים שלך, הקריאה והפרטיות — במקום אחד"
      icon={<SettingsIcon size={34} color={nw.color.tealIcon} strokeWidth={1.75} />}
      maxWidth={1040}
    >
      <WideCols align="flex-start" gap={28}>
        <View style={{ flex: 1 }}>
          <PersonalSection />
          <ReadingSection />
        </View>
        <View style={{ flex: 1 }}>
          <PrivacySection />
          <InfoSection />
        </View>
      </WideCols>
    </WidePage>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ marginBottom: 18 }}>
      <Text accessibilityRole="header" style={{ ...nw.type.h3, color: nw.color.ink, marginBottom: 10, ...T }}>
        {title}
      </Text>
      {children}
    </View>
  );
}

function Field({ label, help, children }: { label: string; help?: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: 8 }}>
      <Text style={{ ...nw.type.bodyStrong, color: nw.color.ink, ...T }}>{label}</Text>
      {children}
      {help ? <Text style={{ ...nw.type.bodySm, fontSize: 14, color: nw.color.inkSoft, ...T }}>{help}</Text> : null}
    </View>
  );
}

function PersonalSection() {
  return (
    <Section title="הפרטים שלך">
      <PersonalCard title="שם ופנייה" />
    </Section>
  );
}

function ReadingSection() {
  const router = useRouter();
  const readingView = useAppStore((s) => s.readingView);
  const setReadingView = useAppStore((s) => s.setReadingView);
  const calendarMode = useAppStore((s) => s.calendarMode);
  const setCalendarMode = useAppStore((s) => s.setCalendarMode);
  const familyVoice = useAppStore((s) => s.familyVoice);
  const setFamilyVoice = useAppStore((s) => s.setFamilyVoice);
  const setOnboardingDone = useAppStore((s) => s.setOnboardingDone);
  return (
    <Section title="קריאה ותצוגה">
      <GlassSurface variant="card" radius={22} contentStyle={{ padding: 18, gap: 18 }}>
        <Field label="מצב קריאה" help={MODE_HELP[readingView]}>
          <SegmentedTabs size="md" options={READING_MODES} value={readingView} onChange={(id) => setReadingView(id as ReadingView)} />
        </Field>
        <Field label="לוח" help="קובע איזו פרשה והפטרה נקראות השבוע.">
          <SegmentedTabs
            size="md"
            options={[
              { id: 'israel', label: 'לוח ישראל' },
              { id: 'diaspora', label: 'לוח חו״ל' },
            ]}
            value={calendarMode}
            onChange={(id) => setCalendarMode(id as CalendarMode)}
          />
        </Field>
        <Field label="סיפורים — ברירת מחדל" help="אפשר תמיד להחליף בתוך הסיפור עצמו.">
          <SegmentedTabs
            size="md"
            options={[
              { id: 'adult', label: 'מבוגרים' },
              { id: 'child', label: 'ילדים' },
            ]}
            value={familyVoice}
            onChange={(id) => setFamilyVoice(id as FamilyVoice)}
          />
        </Field>
        <View>
          <Row Icon={Library} title="כל הפרשות" sub="לקרוא פרשה אחרת" onPress={() => router.push('/parashot' as never)} />
          <Row Icon={Sunrise} title="מסך הפתיחה" sub="להציג שוב את מסך ״התחל״" last onPress={() => setOnboardingDone(false)} />
        </View>
      </GlassSurface>
    </Section>
  );
}

function PrivacySection() {
  const resetProgress = useAppStore((s) => s.resetProgress);
  const [done, setDone] = useState(false);
  const confirmReset = () => {
    const run = () => {
      resetProgress();
      setDone(true);
    };
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm('איפוס התקדמות?\nכל סימוני הקריאה יימחקו.')) run();
      return;
    }
    Alert.alert('איפוס התקדמות?', 'כל סימוני הקריאה יימחקו.', [
      { text: 'ביטול', style: 'cancel' },
      { text: 'איפוס', style: 'destructive', onPress: run },
    ]);
  };
  return (
    <Section title="פרטיות ונתונים">
      <GlassSurface variant="card" radius={22} contentStyle={{ padding: 18, gap: 6 }}>
        <PrivacyNote />
        <Row
          Icon={RotateCcw}
          title={done ? 'ההתקדמות אופסה' : 'איפוס התקדמות'}
          sub="מוחק את סימוני הקריאה בכל הפרשות"
          danger
          last
          onPress={confirmReset}
        />
      </GlassSurface>
    </Section>
  );
}

function InfoSection() {
  const router = useRouter();
  return (
    <Section title="מידע">
      <GlassSurface variant="card" radius={22} contentStyle={{ padding: 18, gap: 10 }}>
        <Row Icon={FileText} title="משפטי ומקורות" sub="מקור הטקסטים, הרישיון ומה שלא כלול" last onPress={() => router.push('/legal')} />
        <Text style={{ ...nw.type.bodyStrong, color: nw.color.ink, ...T }}>נגישות</Text>
        <Text style={{ ...nw.type.bodySm, fontSize: 14, color: nw.color.inkSoft, ...T }}>
          כפתורים בגודל מגע מינימלי, תוויות בעברית לקוראי מסך, ניגודיות AA, וניווט מקלדת ב-web. מצב הקריאה ״גלילה״ נוח גם להגדלת טקסט בדפדפן.
        </Text>
        <Text style={{ ...nw.type.caption, color: nw.color.inkMuted, textAlign: 'center', writingDirection: 'rtl', marginTop: 6 }}>
          {`${APP_NAME} · גרסה 1.0`}
        </Text>
      </GlassSurface>
    </Section>
  );
}

function Row({
  Icon,
  title,
  sub,
  onPress,
  danger,
  last,
}: {
  Icon: LucideIcon;
  title: string;
  sub?: string;
  onPress: () => void;
  danger?: boolean;
  last?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={sub ? `${title}: ${sub}` : title}
      style={({ pressed }) => ({
        flexDirection: rtl.row,
        alignItems: 'center',
        gap: 12,
        minHeight: 58,
        borderRadius: 14,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: nw.color.divider,
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <Icon size={nw.icon.size} color={danger ? nw.color.danger : nw.color.tealIcon} strokeWidth={nw.icon.stroke} />
      <View style={{ flex: 1 }}>
        <Text style={{ ...nw.type.bodyStrong, color: danger ? nw.color.dangerText : nw.color.ink, ...T }}>{title}</Text>
        {sub ? <Text style={{ ...nw.type.caption, fontSize: 13, color: nw.color.inkMuted, ...T }}>{sub}</Text> : null}
      </View>
      <ChevronLeft size={nw.icon.sizeSm} color={nw.color.inkMuted} strokeWidth={nw.icon.stroke} />
    </Pressable>
  );
}
