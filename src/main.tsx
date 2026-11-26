import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(<App />);

// Register Service Worker for PWA installability & desktop/mobile shortcut icon resolution
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').then((registration) => {
      // Force update check on every load
      registration.update().catch(() => {});
    }).catch(() => {
      // Ignore registration errors in restricted contexts
    });
  });
}

