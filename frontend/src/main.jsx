import React, { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n';
import './global.css'
import './force_theme.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <I18nextProvider i18n={i18n}>
      <React.Suspense fallback="Loading...">
        <App />
      </React.Suspense>
    </I18nextProvider>
  </StrictMode>,
)
