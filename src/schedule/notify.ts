/**
 * התראות מקומיות: אחת ביום בשעה שנבחרה (בימי הקריאה) + אחת ביום שישי בבוקר אם נשאר משהו.
 * אף פעם לא בשבת או ביום טוב, ולא אחרי (או סמוך ל) הדלקת נרות. כבויות עד שמפעילים.
 * ב-web — אין התראות (מדלגים בשקט). המודול הנייטיב נטען רק כשצריך (אם חסר — לא קורסים).
 */
import { Platform } from 'react-native';
import { getCurrentParasha, isParashaComplete } from '../data/parashot';
import { useAppStore } from '../store/useAppStore';
import { notificationSlots } from './calendar';

type N = typeof import('expo-notifications');

function mod(): N | null {
  if (Platform.OS === 'web') return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('expo-notifications') as N;
  } catch {
    return null;
  }
}

export const notificationsSupported = () => Platform.OS !== 'web';

/** בקשת הרשאה (כשהמשתמש מפעיל) */
export async function requestNotificationPermission(): Promise<boolean> {
  const n = mod();
  if (!n) return false;
  try {
    const cur = await n.getPermissionsAsync();
    if (cur.granted) return true;
    const res = await n.requestPermissionsAsync();
    return !!res.granted;
  } catch {
    return false;
  }
}

export async function syncNotifications(): Promise<void> {
  const n = mod();
  if (!n) return;
  const s = useAppStore.getState();
  try {
    await n.cancelAllScheduledNotificationsAsync();
    if (!s.notifyOn) return;
    const perm = await n.getPermissionsAsync();
    if (!perm.granted) return;
    if (Platform.OS === 'android') {
      await n.setNotificationChannelAsync('reading', { name: 'תזכורת קריאה', importance: n.AndroidImportance.DEFAULT });
    }
    const parasha = getCurrentParasha(s.calendarMode);
    const hasRemaining = !isParashaComplete(parasha, s.progress);
    const slots = notificationSlots({
      now: new Date(),
      days: s.readDays,
      time: s.notifyTime,
      cityId: s.cityId,
      il: s.calendarMode === 'israel',
      hasRemaining,
    });
    for (const slot of slots) {
      if (slot.kind === 'daily' && !hasRemaining) continue;
      await n.scheduleNotificationAsync({
        content: {
          title: slot.kind === 'friday' ? 'ערב שבת — עוד קצת שניים מקרא' : `פרשת ${parasha.name}`,
          body: slot.kind === 'friday' ? 'נשאר עוד מעט עד שבת. בנחת.' : 'הקריאה של היום מחכה לך.',
        },
        trigger: { type: n.SchedulableTriggerInputTypes.DATE, date: slot.at, channelId: 'reading' },
      });
    }
  } catch {
    // התראות הן תוספת — כשל לא משפיע על האפליקציה
  }
}
