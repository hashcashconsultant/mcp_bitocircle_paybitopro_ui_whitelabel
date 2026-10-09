import { tokenCookie, uuidCookie } from '../hooks/useAuthRedirect';
import { isOwnApi, isPaybitoApi, localApiUrl } from './apiHosts';

export { isOwnApi, isPaybitoApi };

/**
 * The signed-in user's uuid. The cookie is not always readable from this page (it can be missing or set for another
 * domain by an earlier sign-in), so fall back to localStorage 'uuid', which the rest of the app already uses.
 */
export const signedInUuid = (): string | null => {
  const fromCookie = uuidCookie.get();
  if (fromCookie) return fromCookie;
  try {
    return typeof window !== 'undefined' ? window.localStorage.getItem('uuid') : null;
  } catch {
    return null;
  }
};

/**
 * Which hosts get which sign-in headers.
 *
 * - BitoCircle's own APIs (BitohubService, MonetizeService) get `authorization: bearer <token>` AND `uuid`.
 *   Their gate needs both to know who is calling.
 * - Other PayBito APIs get only the bearer token (as before). They do not allow a `uuid` header in CORS.
 * - Everything else (ipgeolocation, Pinata, Moralis, ...) gets nothing: the PayBito token must never leave PayBito.
 *
 * Returns the headers to add to a request for this URL, given the current sign-in.
 */
export const authHeadersFor = (url: string): Record<string, string> => {
  const token = tokenCookie.get();
  if (!token || !isPaybitoApi(url)) return {};
  const headers: Record<string, string> = { authorization: `bearer ${token}` };
  const uuid = signedInUuid();
  if (uuid && isOwnApi(url)) headers.uuid = uuid;
  return headers;
};

const urlOf = (input: RequestInfo | URL): string =>
  typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;

/**
 * Wrap window.fetch once so every call to a BitoCircle API carries the sign-in, including the many places
 * that call fetch() directly. Headers the caller set explicitly are kept.
 */
export const installApiAuth = (): void => {
  if (typeof window === 'undefined') return;
  const w = window as typeof window & { __bcApiAuthInstalled?: boolean };
  if (w.__bcApiAuthInstalled) return;
  w.__bcApiAuthInstalled = true;

  const original = window.fetch.bind(window);
  window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
    const url = urlOf(input);
    const extra = authHeadersFor(url);
    const target = localApiUrl(url);
    if (target !== url && typeof input === 'string') input = target;
    if (Object.keys(extra).length === 0) return original(input, init);
    const headers = new Headers(init?.headers ?? (input instanceof Request ? input.headers : undefined));
    for (const [name, value] of Object.entries(extra)) {
      if (!headers.has(name)) headers.set(name, value);
    }
    return original(input, { ...init, headers });
  };
};

/**
 * POST JSON while the page is closing (tab close, navigation away). Works like navigator.sendBeacon, but a beacon
 * cannot carry headers, so it would arrive without the sign-in and BitoCircle refuses it. fetch with keepalive
 * also survives the page closing and goes through the wrapper above, which adds the token and uuid.
 * Falls back to a beacon if the browser cannot send it this way.
 */
export const sendOnPageExit = (url: string, payload: unknown): void => {
  const body = JSON.stringify(payload);
  try {
    void fetch(url, { method: 'POST', keepalive: true, headers: { 'Content-Type': 'application/json' }, body }).catch(() => {});
  } catch {
    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      navigator.sendBeacon(url, new Blob([body], { type: 'application/json' }));
    }
  }
};

/** STOMP CONNECT headers for the BitoCircle sockets. */
export const stompConnectHeaders = (): Record<string, string> => {
  const token = tokenCookie.get();
  const uuid = signedInUuid();
  return token && uuid ? { Authorization: `Bearer ${token}`, uuid } : {};
};

/** Query string for the live-stream WebSocket, which cannot carry headers. */
export const liveSocketQuery = (): string => {
  const token = tokenCookie.get();
  const uuid = signedInUuid();
  return token && uuid ? `?uuid=${encodeURIComponent(uuid)}&token=${encodeURIComponent(token)}` : '';
};
