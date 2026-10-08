import { useAppStore } from '../store/useAppStore';
import { g, type Gender, type Gendered } from './gender';

/** המגדר שנבחר (null → רבים) */
export function useGender(): Gender {
  return useAppStore((s) => s.userGender) ?? 'p';
}

/** קיצור לשימוש בקומפוננטות: const t = useG(); t(TEXTS.x) */
export function useG(): (text: Gendered | string) => string {
  const gender = useGender();
  return (text) => g(text, gender);
}
