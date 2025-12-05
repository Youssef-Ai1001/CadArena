'use client';

import { useEffect } from 'react';

/**
 * SessionInitializer
 * ------------------
 * Manages session tokens between cookies (primary) and localStorage (fallback).
 * Cookies are set by the backend, localStorage is used as fallback for API calls.
 */
export default function SessionInitializer() {
  useEffect(() => {
    if (typeof document === 'undefined' || typeof window === 'undefined') return;

    const getCookie = (name: string): string | null => {
      const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
      return match ? decodeURIComponent(match[1]) : null;
    };

    // Check for tokens in cookies (set by backend) or localStorage (fallback)
    const accessCookie = getCookie('access_token') || getCookie('cadarena_access');
    const refreshCookie = getCookie('refresh_token') || getCookie('cadarena_refresh');
    const sessionCookie = getCookie('session_token');

    // Sync cookies to localStorage for API interceptor compatibility
    if (accessCookie && !window.localStorage.getItem('access_token')) {
      window.localStorage.setItem('access_token', accessCookie);
    }
    if (refreshCookie && !window.localStorage.getItem('refresh_token')) {
      window.localStorage.setItem('refresh_token', refreshCookie);
    }

    // If no tokens found anywhere, user is logged out
    if (!accessCookie && !window.localStorage.getItem('access_token')) {
      // Clear any stale localStorage tokens
      window.localStorage.removeItem('access_token');
      window.localStorage.removeItem('refresh_token');
    }
  }, []);

  return null;
}


