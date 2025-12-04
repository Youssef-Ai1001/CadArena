'use client';

import { useEffect } from 'react';

/**
 * SessionInitializer
 * ------------------
 * Keeps auth tokens in sync between cookies and localStorage so that
 * users stay logged in across full browser restarts.
 *
 * - On mount, if localStorage is empty but cookies are present, it restores tokens.
 * - This runs once at the app root (see layout.tsx).
 */
export default function SessionInitializer() {
  useEffect(() => {
    if (typeof document === 'undefined' || typeof window === 'undefined') return;

    const getCookie = (name: string): string | null => {
      const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
      return match ? decodeURIComponent(match[1]) : null;
    };

    const accessInStorage = window.localStorage.getItem('access_token');
    const refreshInStorage = window.localStorage.getItem('refresh_token');
    const accessCookie = getCookie('cadarena_access');
    const refreshCookie = getCookie('cadarena_refresh');

    // If localStorage is empty but cookies exist, restore from cookies
    if (!accessInStorage && accessCookie) {
      window.localStorage.setItem('access_token', accessCookie);
    }
    if (!refreshInStorage && refreshCookie) {
      window.localStorage.setItem('refresh_token', refreshCookie);
    }
  }, []);

  return null;
}


