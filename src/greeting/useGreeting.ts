import { useEffect, useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { getGreeting, type Greeting } from './greeting';

/** שעה נוכחית שמתעדכנת כל דקה (כדי שהברכה תתחלף בזמן) */
export function useNow(intervalMs = 60_000): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

export function useGreeting(): Greeting {
  const name = useAppStore((s) => s.userName);
  const now = useNow();
  return getGreeting(now, name);
}
