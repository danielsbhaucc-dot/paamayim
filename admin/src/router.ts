import { useEffect, useState } from 'react';

/** ניתוב לפי hash: #/  #/p/bereshit  #/p/bereshit/onkelos?v=3  #/greetings  #/ai  #/settings */
export function parseHash(h = window.location.hash) {
  const raw = h.replace(/^#/, '') || '/';
  const [pathPart, query = ''] = raw.split('?');
  const parts = pathPart.split('/').filter(Boolean);
  return { parts, query: new URLSearchParams(query), path: '/' + parts.join('/') };
}

export function useRoute() {
  const [route, setRoute] = useState(parseHash());
  useEffect(() => {
    const on = () => setRoute(parseHash());
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return route;
}

export const go = (to: string) => {
  window.location.hash = to;
};
