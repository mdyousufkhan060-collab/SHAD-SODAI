import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { LanguageProvider } from './context/LanguageContext';
import { BrandingProvider } from './context/BrandingContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LanguageProvider>
      <BrandingProvider>
        <App />
      </BrandingProvider>
    </LanguageProvider>
  </StrictMode>,
);
