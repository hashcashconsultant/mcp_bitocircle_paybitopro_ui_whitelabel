import { authHeadersFor } from './apiAuth';

/** fetch() with the sign-in headers for this URL. JSON content type unless the body is FormData. */
export const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
  const isForm = typeof FormData !== 'undefined' && options.body instanceof FormData;
  const headers = {
    ...(isForm ? {} : { 'Content-Type': 'application/json' }),
    ...authHeadersFor(url),
    ...options.headers,
  };
  return fetch(url, { ...options, headers });
};
