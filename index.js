// נקודת הכניסה: polyfills ופתיחה בטוחה לפני כל קוד אחר, ואז expo-router.
// (Hermes של React Native אין בו structuredClone — @hebcal/leyning צריך אותו.)
import './src/polyfills';
import { installSafeStartup } from './src/safeStartup';
installSafeStartup();
require('expo-router/entry');
