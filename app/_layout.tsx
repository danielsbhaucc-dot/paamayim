import { useFonts } from 'expo-font';
import * as Font from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import { I18nManager, Pressable, ScrollView, Text } from 'react-native';
import { describeError } from '../src/safeStartup';
import { AppLoadingScreen } from '../src/components/AppLoadingScreen';
import { startContentSync } from '../src/content';
import { SideMenuHost } from '../src/components/SideMenuHost';
import { ReadingWatcher } from '../src/schedule/ReadingWatcher';
import { coreFontAssets, mikraFontAssets, setMikraFontsReady } from '../src/theme/fonts';
import { colors } from '../src/theme/tokens';
import { applyWebA11y, capFontScaling, enforceRTL } from '../src/utils/a11y';

SplashScreen.preventAutoHideAsync().catch(() => undefined);
enforceRTL();
capFontScaling();
applyWebA11y();

/** כל שגיאה במסך: הודעה רגועה עם הטקסט שלה ו״לנסות שוב״ — לא סגירה שקטה */
export function ErrorBoundary({ error, retry }: { error: Error; retry: () => Promise<void> }) {
  useEffect(() => {
    SplashScreen.hideAsync().catch(() => undefined);
  }, []);
  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 28, backgroundColor: '#F4F1EA' }}>
      <Text style={{ fontSize: 22, fontWeight: '700', color: '#14284B', textAlign: 'center', writingDirection: 'rtl' }}>
        משהו השתבש בפתיחה
      </Text>
      <Text style={{ fontSize: 16, color: '#3A4A5C', textAlign: 'center', writingDirection: 'rtl', marginTop: 10 }}>
        אפשר לנסות שוב. אם זה חוזר — צלמו את המסך ושלחו לנו.
      </Text>
      <Text selectable style={{ fontSize: 12, color: '#6B7280', marginTop: 18, textAlign: 'left' }}>
        {describeError(error)}
      </Text>
      <Pressable
        onPress={() => retry()}
        accessibilityRole="button"
        style={{ marginTop: 24, alignSelf: 'center', backgroundColor: '#1F6F68', paddingHorizontal: 28, paddingVertical: 12, borderRadius: 999 }}
      >
        <Text style={{ color: '#fff', fontSize: 17, fontWeight: '700' }}>לנסות שוב</Text>
      </Pressable>
    </ScrollView>
  );
}

export default function RootLayout() {
  // רק פונטי UI — בלי NehoraMikra (באנדרואיד טעינתם קורסת את ה-APK בפתיחה)
  const [loaded, fontError] = useFonts(coreFontAssets);
  const [showLoader, setShowLoader] = useState(true);

  useEffect(() => {
    // תוכן מפורסם: ארוז → מטמון → סנכרון מהשרת (ברקע, בלי לחסום את הטעינה)
    startContentSync();
  }, []);

  useEffect(() => {
    if (!I18nManager.isRTL) {
      I18nManager.allowRTL(true);
      I18nManager.forceRTL(true);
    }
  }, []);

  useEffect(() => {
    if (!loaded && !fontError) return;
    const assets = mikraFontAssets;
    if (!Object.keys(assets).length) {
      setMikraFontsReady(false);
      return;
    }
    Font.loadAsync(assets)
      .then(() => setMikraFontsReady(true))
      .catch(() => setMikraFontsReady(false));
  }, [loaded, fontError]);

  useEffect(() => {
    if (loaded || fontError) {
      // מסך הטעינה המותאם מחליף את ה-native splash
      SplashScreen.hideAsync().catch(() => undefined);
    }
  }, [loaded, fontError]);

  const onLoaderFinish = useCallback(() => {
    setShowLoader(false);
  }, []);

  if (!loaded && !fontError) return null;

  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.primaryDark },
          animation: 'fade',
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="story" options={{ presentation: 'card' }} />
        <Stack.Screen name="reading" options={{ presentation: 'card' }} />
        <Stack.Screen name="completion" options={{ presentation: 'modal' }} />
        <Stack.Screen name="settings" options={{ presentation: 'modal' }} />
        <Stack.Screen name="legal" options={{ presentation: 'modal' }} />
        <Stack.Screen name="colors" options={{ presentation: 'card' }} />
        <Stack.Screen name="calendar" options={{ presentation: 'card' }} />
        <Stack.Screen name="parashot" options={{ presentation: 'card' }} />
        <Stack.Screen name="siyum" options={{ presentation: 'modal' }} />
      </Stack>
      <SideMenuHost />
      <ReadingWatcher />
      {showLoader ? <AppLoadingScreen ready={!!loaded || !!fontError} onFinish={onLoaderFinish} /> : null}
    </>
  );
}
