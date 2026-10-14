import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import {registerSW} from 'virtual:pwa-register';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LanguageProvider } from './i18n/LanguageContext';
import './index.css';

// Attach the signed-in user's session token to same-origin API calls so the
// server returns that user's own data (credits, usage) instead of the demo sandbox.
if (typeof window !== 'undefined' && !(window as any).__clipflowAuthFetch) {
  (window as any).__clipflowAuthFetch = true;
  const originalFetch = window.fetch.bind(window);
  window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
    try {
      const token = localStorage.getItem('clipflow_auth_token');
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
      const isApi = url.startsWith('/api/') || url.startsWith(`${window.location.origin}/api/`);
      if (token && isApi) {
        const headers = new Headers(init?.headers || (input instanceof Request ? input.headers : undefined));
        if (!headers.has('Authorization')) headers.set('Authorization', `Bearer ${token}`);
        return originalFetch(input, { ...init, headers });
      }
    } catch {
      // fall through to the plain request
    }
    return originalFetch(input, init);
  };
}

// Register service worker safely for PWA compliance and offline caching
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  try {
    registerSW({
      immediate: true,
      onNeedRefresh() {
        window.dispatchEvent(new CustomEvent('pwa-update-available'));
      },
      onRegisterError(error) {
        console.warn('PWA service worker registration note:', error);
      },
    });
  } catch (err) {
    console.warn('PWA registration skipped in this environment:', err);
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <LanguageProvider>
        <App />
      </LanguageProvider>
    </ErrorBoundary>
  </StrictMode>,
);
