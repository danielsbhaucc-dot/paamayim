/** לקוח ה-API: עוגיית session (HttpOnly) + כותרת CSRF לכל שינוי. */
let csrf: string | null = null;
export const setCsrf = (t: string | null) => {
  csrf = t;
};

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
  }
}

let onUnauthorized: () => void = () => {};
export const setOnUnauthorized = (fn: () => void) => {
  onUnauthorized = fn;
};

export async function api<T = any>(path: string, opts: { method?: string; json?: unknown; form?: FormData } = {}): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  const method = opts.method ?? (opts.json !== undefined || opts.form ? 'POST' : 'GET');
  if (method !== 'GET' && csrf) headers['X-CSRF-Token'] = csrf;
  let body: BodyInit | undefined;
  if (opts.form) body = opts.form;
  else if (opts.json !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(opts.json);
  }
  const res = await fetch(`/api${path}`, { method, headers, body, credentials: 'same-origin' });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401 && path !== '/login') onUnauthorized();
  if (!res.ok) throw new ApiError(res.status, data?.error ?? `שגיאה ${res.status}`);
  return data as T;
}
