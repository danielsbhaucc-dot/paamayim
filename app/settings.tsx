import { Redirect } from 'expo-router';
import React from 'react';

/** /settings נשאר לקישורים ישנים — עמוד ההגדרות האחד נמצא בלשונית ״הגדרות״ */
export default function SettingsRedirect() {
  return <Redirect href={'/(tabs)/more' as never} />;
}
