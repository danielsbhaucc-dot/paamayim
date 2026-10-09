import { Tabs } from 'expo-router';

/**
 * הטאבים עצמם מוסתרים — התפריט התחתון מגיע מ-GlassBottomNav
 * בתוך AppBackground בכל מסך.
 */
export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: 'none' },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'בית' }} />
      <Tabs.Screen name="path" options={{ title: 'מסלול' }} />
      <Tabs.Screen name="family" options={{ title: 'משפחה' }} />
      <Tabs.Screen name="more" options={{ title: 'הגדרות' }} />
    </Tabs>
  );
}
