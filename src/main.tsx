import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/heebo/400.css';
import '@fontsource/heebo/600.css';
import '@fontsource/heebo/700.css';
import './styles/tokens.css';
import './styles/global.css';
import App from './App';
import { registerSW } from 'virtual:pwa-register';

// Register the offline worker. No onNeedRefresh: updates never reload a running game (ADR-6)
registerSW({ immediate: true });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
