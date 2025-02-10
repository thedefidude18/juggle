import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { PrivyProvider } from '@privy-io/react-auth';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { SettingsProvider } from './contexts/SettingsContext';
import App from './App';
import './index.css';

// Polyfills
import { Buffer } from 'buffer';
import process from 'process';

globalThis.Buffer = Buffer;
globalThis.process = process;

const PRIVY_APP_ID = import.meta.env.VITE_PRIVY_APP_ID;

if (!PRIVY_APP_ID) {
  throw new Error('Missing Privy App ID');
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found');
}

createRoot(rootElement).render(
  <StrictMode>
    <PrivyProvider
      appId={PRIVY_APP_ID}
      config={{
        loginMethods: ['email', 'google', 'discord', 'github'], // Removed Twitter since it's not configured
        appearance: {
          theme: 'dark',
          accentColor: '#CCFF00',
          logo: 'data:image/svg+xml;base64,PHN2ZyB2aWV3Qm94PSIwIDAgMTAwMCAxMDAwIj48cGF0aCBmaWxsPSIjQ0NGRjAwIiBkPSJNNTAwIDBDNzc2LjE0MiAwIDEwMDAgMjIzLjg1OCAxMDAwIDUwMEMxMDAwIDc3Ni4xNDIgNzc2LjE0MiAxMDAwIDUwMCAxMDAwQzIyMy44NTggMTAwMCAwIDc3Ni4xNDIgMCA1MDBDMCAyMjMuODU4IDIyMy44NTggMCA1MDAgMFpNNTAwIDEwMEMyNzkuMDg2IDEwMCAxMDAgMjc5LjA4NiAxMDAgNTAwQzEwMCA3MjAuOTE0IDI3OS4wODYgOTAwIDUwMCA5MDBDNDI3LjkxNCA5MDAgOTAwIDcyMC45MTQgOTAwIDUwMEM5MDAgMjc5LjA4NiA3MjAuOTE0IDEwMCA1MDAgMTAwWiIvPjxwYXRoIGZpbGw9IiNDQ0ZGMDAiIGQ9Ik01MDAgNjAwQzU1Mi44NDMgNjAwIDYwMCA1NTIuODQzIDYwMCA1MDBDNM2MDAgNDQ3LjE1NyA1NTIuODQzIDQwMCA1MDAgNDAwQzQ0Ny4xNTcgNDAwIDQwMCA0NDcuMTU3IDQwMCA1MDBDNM0wMCA1NTIuODQzIDQ0Ny4xNTcgNjAwIDUwMCA2MDBaIi8+PC9zdmc+',
          showWalletLoginFirst: false
        },
        embeddedWallets: {
          createOnLogin: 'all-users',
          noPromptOnSignature: true
        },
        oauth: {
          google: {
            clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
          },
          discord: {
            clientId: import.meta.env.VITE_DISCORD_CLIENT_ID,
          },
          github: {
            clientId: import.meta.env.VITE_GITHUB_CLIENT_ID,
          }
        }
      }}
    >
      <ToastProvider>
        <AuthProvider>
          <SettingsProvider>
            <App />
          </SettingsProvider>
        </AuthProvider>
      </ToastProvider>
    </PrivyProvider>
  </StrictMode>
);