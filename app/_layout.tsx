import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import { I18nManager } from 'react-native';
import { AppLoadingScreen } from '../src/components/AppLoadingScreen';
import { SideMenuHost } from '../src/components/SideMenuHost';
import { fontAssets } from '../src/theme/fonts';
import { colors } from '../src/theme/tokens';
import { enforceRTL } from '../src/utils/a11y';

SplashScreen.preventAutoHideAsync().catch(() => undefined);
enforceRTL();

export default function RootLayout() {
  const [loaded] = useFonts(fontAssets);
  const [showLoader, setShowLoader] = useState(true);

  useEffect(() => {
    if (!I18nManager.isRTL) {
      I18nManager.allowRTL(true);
      I18nManager.forceRTL(true);
    }
  }, []);

  useEffect(() => {
    if (loaded) {
      // מסך הטעינה המותאם מחליף את ה-native splash
      SplashScreen.hideAsync().catch(() => undefined);
    }
  }, [loaded]);

  const onLoaderFinish = useCallback(() => {
    setShowLoader(false);
  }, []);

  if (!loaded) return null;

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
        <Stack.Screen name="calendar" options={{ presentation: 'card' }} />
      </Stack>
      <SideMenuHost />
      {showLoader ? <AppLoadingScreen ready={loaded} onFinish={onLoaderFinish} /> : null}
    </>
  );
}
