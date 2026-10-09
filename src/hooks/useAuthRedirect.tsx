// app/hooks/useAuthRedirect.tsx
import { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import axios from 'axios';
import { useBroker, BrokerDetails } from '../contexts/BrokerContext';
import { showToast, WEBSERVICE } from '../services/CoreDataService';
import CryptoJS from "crypto-js";
import { isOwnApi, isPaybitoApi, localApiUrl } from '../utils/apiHosts';
import { takePendingAuthorize } from '../utils/pendingAuthorize';

// White-label: send unauthenticated users to THIS deployment's own /login (same origin),
// never the hardcoded mothership. Relative path keeps it domain-agnostic.
const LOGIN_REDIRECT_URL = '/login';

const SECRETKEY = '4f8e1c9a7b3d22e5a6f3c4d2b8a7e1f0c9d8a2b1c4e5f6d7a8b9c0d1e2f3a4b5';

const TOKEN_COOKIE_NAME = 'paybito_launch_platform_token';
const USERNAME_COOKIE_NAME = 'paybito_launch_platform_username';
const UUID_COOKIE_NAME = 'paybito_launch_platform_uuid';

// ========================================
// Environment-aware cookie configuration
// ========================================
const isLocalhost =
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

const COOKIE_DOMAIN_BITOCIRCLE = isLocalhost ? '' : ' domain=.bitocircle.com;';
const COOKIE_DOMAIN_PAYBITO = isLocalhost ? '' : ' domain=.paybito.com;';
const COOKIE_SECURE = isLocalhost ? '' : ' Secure;';

interface BrokerDetailsResponse {
  error?: {
    error_data: number;
    error_msg?: string;
  };
  brokerInfo: BrokerDetails;
}

interface UseAuthRedirectOptions {
  skipRedirect?: boolean;
}

interface SettingsResponse {
  success: boolean;
  data?: {
    pushNotifications?: boolean;
    emailNotifications?: boolean;
    smsNotifications?: boolean;
  };
}

// ========================================
// Cookie helpers for access token
// ========================================
export const tokenCookie = {
  set: (token: string, days: number = 7): void => {
    if (typeof document === 'undefined') return;
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = `${TOKEN_COOKIE_NAME}=${encodeURIComponent(token)}; expires=${expires}; path=/;${COOKIE_DOMAIN_BITOCIRCLE}${COOKIE_SECURE} SameSite=Lax`;
  },
  get: (): string | null => {
    if (typeof document === 'undefined') return null;
    const match = document.cookie.match(new RegExp(`(?:^|; )${TOKEN_COOKIE_NAME}=([^;]*)`));
    return match ? decodeURIComponent(match[1]) : null;
  },
  remove: (): void => {
    if (typeof document === 'undefined') return;
    document.cookie = `${TOKEN_COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;${COOKIE_DOMAIN_BITOCIRCLE}`;
  },
};

export const usernameCookie = {
  set: (username: string, days: number = 7): void => {
    if (typeof document === 'undefined') return;
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = `${USERNAME_COOKIE_NAME}=${encodeURIComponent(username)}; expires=${expires}; path=/;${COOKIE_DOMAIN_BITOCIRCLE}${COOKIE_SECURE} SameSite=Lax`;
  },
  get: (): string | null => {
    if (typeof document === 'undefined') return null;
    const match = document.cookie.match(new RegExp(`(?:^|; )${USERNAME_COOKIE_NAME}=([^;]*)`));
    return match ? decodeURIComponent(match[1]) : null;
  },
  remove: (): void => {
    if (typeof document === 'undefined') return;
    document.cookie = `${USERNAME_COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;${COOKIE_DOMAIN_BITOCIRCLE}`;
  },
};
export const uuidCookie = {
  set: (username: string, days: number = 7): void => {
    if (typeof document === 'undefined') return;
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = `${UUID_COOKIE_NAME}=${encodeURIComponent(username)}; expires=${expires}; path=/;${COOKIE_DOMAIN_BITOCIRCLE}${COOKIE_SECURE} SameSite=Lax`;
  },
  get: (): string | null => {
    if (typeof document === 'undefined') return null;
    const match = document.cookie.match(new RegExp(`(?:^|; )${UUID_COOKIE_NAME}=([^;]*)`));
    return match ? decodeURIComponent(match[1]) : null;
  },
  remove: (): void => {
    if (typeof document === 'undefined') return;
    document.cookie = `${UUID_COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;${COOKIE_DOMAIN_BITOCIRCLE}`;
  },
};

export const safeLocalStorage = {
  getItem: (key: string): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(key);
  },
  setItem: (key: string, value: string): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(key, value);
  },
  removeItem: (key: string): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(key);
  }
};

export const isUserAuthenticated = (): boolean => {
  if (typeof window === 'undefined') return false;
  const accessToken = tokenCookie.get();
  return accessToken !== null && accessToken !== '' && accessToken !== 'null';
};

const clearAuthCookies = (): void => {
  const bitocircleCookies = [
    'paybito_bitocircle_token',
    'paybito_bitocircle_broker_id',
    'paybito_bitocircle_user_id',
    'paybito_bitocircle_uuid',
    'paybito_bitoconnect_token',
    'paybito_bitoconnect_broker_id',
    'paybito_bitoconnect_user_id',
    'paybito_bitoconnect_uuid',
    TOKEN_COOKIE_NAME,
    UUID_COOKIE_NAME,
  ];

  const paybitoCookies = [
    'paybito_bitohub_token',
    'paybito_bitohub_broker_id',
    'paybito_bitohub_user_id',
    'paybito_bitohub_uuid',
  ];

  bitocircleCookies.forEach(cookieName => {
    document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;${COOKIE_DOMAIN_BITOCIRCLE}`;
  });

  paybitoCookies.forEach(cookieName => {
    document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;${COOKIE_DOMAIN_PAYBITO}`;
  });
};

// Direct cleanup without API call — used by 401 interceptor
export const forceLogout = (): void => {
  tokenCookie.remove();
  uuidCookie.remove();
  localStorage.clear();
  clearAuthCookies();
};

// Full logout with API call — used by logout buttons
export const logoutUser = async (): Promise<boolean> => {
  const adminUserName = safeLocalStorage.getItem('adminUserName') || '';
  const accessToken = tokenCookie.get();

  try {
    const response = await axios.post<{ error: { error_data: number; error_msg: string } }>(
      `${WEBSERVICE}/adminAccess/LogoutAdmin`,
      { user_name: adminUserName },
      {
        headers: {
          'Content-Type': 'application/json',
          authorization: `bearer ${accessToken}`,
        },
      }
    );

    if (response.data?.error?.error_data === 0) {
      forceLogout();
      return true;
    }
    return false;
  } catch (error) {
    console.error('Logout API failed:', error);
    return false;
  }
};



export const useAuthRedirect = (options: UseAuthRedirectOptions = {}): { isLoading: boolean; isAuthenticated: boolean } => {
  const { skipRedirect = false } = options;
  const router = useRouter();
  const searchParams = useSearchParams();
  const { brokerDetails, updateBrokerDetails } = useBroker();
  const [brokerDetailsFetched, setBrokerDetailsFetched] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(!skipRedirect);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return isUserAuthenticated();
  });

  const hasProcessedParams = useRef<boolean>(false);
  const hasCheckedExternalRedirect = useRef<boolean>(false);

  // ========================================
  // EARLY RETURN FOR PUBLIC PAGES (skipRedirect=true)
  // ========================================
  useEffect(() => {
    if (!skipRedirect) return;

    const authenticated = isUserAuthenticated();
    setIsAuthenticated(authenticated);
    setIsLoading(false);

    if (authenticated && !brokerDetailsFetched && !brokerDetails) {
      loadBrokerDetailsInBackground();
    }
  }, [skipRedirect, brokerDetailsFetched, brokerDetails]);

  // Background loader for broker details (non-blocking, for public pages)
  const loadBrokerDetailsInBackground = async () => {
    const storedAccessToken = tokenCookie.get();
    const storedBrokerId = safeLocalStorage.getItem('brokerId');
    const storedUserId = safeLocalStorage.getItem('userId');

    if (storedAccessToken && storedBrokerId && storedUserId) {
      try {
        const response = await axios.get<BrokerDetailsResponse>(
          `${WEBSERVICE}/admin/getBrokerDetails?brokerId=${storedBrokerId}`,
          {
            headers: { authorization: `bearer ${storedAccessToken}` },
          }
        );

        if (!response.data.error || response.data.error.error_data === 0) {
          const fullResponseData = response.data.brokerInfo;
          const financeHubUuid = fullResponseData.financeHubUuid || '';
          safeLocalStorage.setItem('profileImage', fullResponseData.profilePicUrl || 'https://i.pravatar.cc/300');
          localStorage.setItem('financeHubUuid', String(financeHubUuid || ''));

          updateBrokerDetails(fullResponseData);
          setBrokerDetailsFetched(true);

          const existingPushSetting = safeLocalStorage.getItem('pushNotificationsEnabled');
          if (existingPushSetting === null) {
            try {
              const childUserId = safeLocalStorage.getItem('childUserId') || storedUserId;
              const settingsResponse = await axios.get<SettingsResponse>(
                `https://institutional-bo.paybito.com:8443/BitohubService/settings?userId=${childUserId}`
              );
              if (settingsResponse.data.success && settingsResponse.data.data) {
                const pushEnabled = settingsResponse.data.data.pushNotifications ?? true;
                safeLocalStorage.setItem('pushNotificationsEnabled', pushEnabled ? 'true' : 'false');
              } else {
                safeLocalStorage.setItem('pushNotificationsEnabled', 'true');
              }
            } catch (settingsError) {
              console.warn('Failed to fetch push notification settings:', settingsError);
              safeLocalStorage.setItem('pushNotificationsEnabled', 'true');
            }
          }
        }
      } catch (error) {
        console.warn('Background broker details fetch failed:', error);
      }
    }
  };

  // Axios interceptors setup
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const requestInterceptor = axios.interceptors.request.use(
      (config) => {
        const storedAccessToken = tokenCookie.get();
        const url = `${config.baseURL ?? ''}${config.url ?? ''}`;
        // PayBito credentials go to PayBito APIs only; BitoCircle's own APIs also need the uuid.
        if (storedAccessToken && config.headers && isPaybitoApi(url)) {
          config.headers.authorization = `bearer ${storedAccessToken}`;
          // Same fallback as utils/apiAuth signedInUuid(): the cookie is not always readable here.
          const uuid = uuidCookie.get() || safeLocalStorage.getItem('uuid');
          if (uuid && isOwnApi(url)) {
            config.headers.uuid = uuid;
          }
        }
        const target = localApiUrl(url);
        if (target !== url) {
          config.baseURL = undefined;
          config.url = target;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    const responseInterceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response && error.response.status === 401) {
          forceLogout();

          if (!skipRedirect) {
            window.location.href = LOGIN_REDIRECT_URL;
          }
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.request.eject(requestInterceptor);
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, [skipRedirect]);

  // ========================================
  // MAIN AUTH EFFECT - Only for protected pages (skipRedirect=false)
  // ========================================
  useEffect(() => {
    if (skipRedirect) {
      return;
    }

    if (typeof window === 'undefined') {
      setIsLoading(false);
      return;
    }

    const handleAuth = async (): Promise<void> => {
      const app = searchParams.get('app');
      const rawQuery = location.search;
      const appRaw = rawQuery.split("app=")[1];

      if (app && !hasProcessedParams.current) {
        try {
          localStorage.setItem('appData', app);
          localStorage.setItem('appDataRaw', appRaw);

          const bytes = CryptoJS.AES.decrypt(app, SECRETKEY);
          const decrypted = bytes.toString(CryptoJS.enc.Utf8);

          const BrokerDetailsData = JSON.parse(decrypted);

          const access_token = BrokerDetailsData.token || '';
          const brokerId = BrokerDetailsData.adminUsersResult.brokerId || '';
          const userId = BrokerDetailsData.adminUsersResult.user_id || '';
          const uuid = BrokerDetailsData.adminUsersResult.uuid || '';
          const adminUserName = BrokerDetailsData.adminUsersResult.user_name || '';

          if (access_token) {
            tokenCookie.set(access_token);
          }
          if (brokerId) {
            safeLocalStorage.setItem('brokerId', brokerId);
          }
          if (userId) {
            safeLocalStorage.setItem('userId', userId);
          }
          if (adminUserName) {
            safeLocalStorage.setItem('adminUserName', adminUserName);
            usernameCookie.set(adminUserName);
          }
          if (uuid) {
            const prevPageId = safeLocalStorage.getItem('pageId');
            safeLocalStorage.setItem('uuid', uuid);
            safeLocalStorage.setItem('pageId', prevPageId || '0');
            uuidCookie.set(uuid)
          }

          hasProcessedParams.current = true;
          setIsAuthenticated(true);

          // Fetch and store push notification setting after successful login
          try {
            const childUserId = userId;
            const settingsResponse = await axios.get<SettingsResponse>(
              `https://institutional-bo.paybito.com:8443/BitohubService/settings?userId=${childUserId}`
            );
            if (settingsResponse.data.success && settingsResponse.data.data) {
              const pushEnabled = settingsResponse.data.data.pushNotifications ?? true;
              safeLocalStorage.setItem('pushNotificationsEnabled', pushEnabled ? 'true' : 'false');
            } else {
              safeLocalStorage.setItem('pushNotificationsEnabled', 'true');
            }
          } catch (settingsError) {
            console.warn('Failed to fetch push notification settings:', settingsError);
            safeLocalStorage.setItem('pushNotificationsEnabled', 'true');
          }

          // Dispatch auth change event to notify AuthContext
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new Event('authStateChanged'));
          }

          // Back to an app authorization the user started before signing in.
          const pendingAuthorize = takePendingAuthorize();
          if (pendingAuthorize) {
            window.location.replace(pendingAuthorize);
            return;
          }

          router.replace(window.location.pathname);
          return;
        } catch (error: unknown) {
          const err = error as Error;
          console.error('=== DECRYPTION ERROR ===');
          console.error('Error:', err.message);
          console.error('App param length:', app ? app.length : 0);
          console.error('First 100 chars:', app ? app.substring(0, 100) : 'null');
          console.error('=======================');
        }
      }

      // Check current authentication status
      const currentlyAuthenticated = isUserAuthenticated();
      setIsAuthenticated(currentlyAuthenticated);

      // Skip if broker details already fetched
      if (brokerDetails && brokerDetailsFetched) {
        handleExternalRedirection();
        setIsLoading(false);
        return;
      }

      const storedAccessToken = tokenCookie.get();
      const storedBrokerId = safeLocalStorage.getItem('brokerId');
      const storedUserId = safeLocalStorage.getItem('userId');

      if (storedAccessToken && storedBrokerId && storedUserId && !brokerDetailsFetched) {
        try {
          const response = await axios.get<BrokerDetailsResponse>(
            `${WEBSERVICE}/admin/getBrokerDetails?brokerId=${storedBrokerId}`,
            {
              headers: { authorization: `bearer ${storedAccessToken}` },
            }
          );

          if (response.data.error && response.data.error.error_data !== 0) {
            showToast('error', response.data.error.error_msg || 'Failed to fetch broker details.');
          } else {
            const fullResponseData = response.data.brokerInfo;
            safeLocalStorage.setItem('profileImage', fullResponseData.profilePicUrl || 'https://i.pravatar.cc/300');
            console.log('fullResponseData.financeHubUuid', fullResponseData);

            localStorage.setItem('financeHubUuid', String(fullResponseData.financeHubUuid || ''));

            updateBrokerDetails(fullResponseData);
            setBrokerDetailsFetched(true);
            setIsAuthenticated(true);

            const existingPushSetting = safeLocalStorage.getItem('pushNotificationsEnabled');
            if (existingPushSetting === null) {
              try {
                const childUserId = safeLocalStorage.getItem('childUserId') || storedUserId;
                const settingsResponse = await axios.get<SettingsResponse>(
                  `https://institutional-bo.paybito.com:8443/BitohubService/settings?userId=${childUserId}`
                );
                if (settingsResponse.data.success && settingsResponse.data.data) {
                  const pushEnabled = settingsResponse.data.data.pushNotifications ?? true;
                  safeLocalStorage.setItem('pushNotificationsEnabled', pushEnabled ? 'true' : 'false');
                } else {
                  safeLocalStorage.setItem('pushNotificationsEnabled', 'true');
                }
              } catch (settingsError) {
                console.warn('Failed to fetch push notification settings:', settingsError);
                safeLocalStorage.setItem('pushNotificationsEnabled', 'true');
              }
            }

            if (typeof window !== 'undefined') {
              window.dispatchEvent(new Event('authStateChanged'));
            }

            handleExternalRedirection();
          }
        } catch (error: unknown) {
          const err = error as { response?: { status: number } };
          console.error('API call failed:', error);

          if (err.response && err.response.status === 401) {
            showToast('error', 'Session expired or unauthorized. Please log in again.');
            forceLogout();
            window.location.href = LOGIN_REDIRECT_URL;
          } else {
            showToast('error', 'Failed to load broker details. Please try again.');
          }
        }
      } else if (!storedAccessToken || !storedBrokerId || !storedUserId) {
        if (hasProcessedParams.current || !app) {
          console.warn("Required authentication data not found in localStorage. Redirecting to login.");
          forceLogout();
          window.location.href = LOGIN_REDIRECT_URL;
          return;
        }
      }

      setIsLoading(false);
    };

    const handleExternalRedirection = (): void => {
      if (hasCheckedExternalRedirect.current) return;

      const externalRedirectionLink = safeLocalStorage.getItem('token_marketplace_review_rating_redirect_url');

      if (externalRedirectionLink) {
        safeLocalStorage.removeItem('token_marketplace_review_rating_redirect_url');
        hasCheckedExternalRedirect.current = true;

        if (externalRedirectionLink.startsWith('/')) {
          router.push(externalRedirectionLink);
        } else if (externalRedirectionLink.startsWith('http://') || externalRedirectionLink.startsWith('https://')) {
          window.location.href = externalRedirectionLink;
        } else {
          router.push(`/${externalRedirectionLink}`);
        }
      }
    };

    handleAuth();
  }, [searchParams, router, updateBrokerDetails, brokerDetails, brokerDetailsFetched, skipRedirect]);

  return { isLoading, isAuthenticated };
};