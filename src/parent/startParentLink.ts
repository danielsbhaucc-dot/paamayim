/**
 * Native (APK/iOS): בכוונה ריק בשלב זה. החיבור הקל פעיל ב־web בלבד, כדי לא להכניס קוד חדש (crypto.subtle,
 * randomUUID) לאפליקציה המקורית על Hermes בלי בדיקת מכשיר. ההתנהגות באנדרואיד וב־iOS לא משתנה.
 */
export function startParentLink(): void { /* no-op on native */ }
