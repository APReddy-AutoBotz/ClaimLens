import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './design-tokens.css';
import './kiroween-theme.css';
import './index.css';
import './accessibility.css';
import { registerSW } from './utils/register-sw';
import { setupAutoSync } from './utils/background-sync';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);

// Register service worker
registerSW();

// Setup background sync
setupAutoSync();
