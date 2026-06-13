import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import i18n from './i18n'
import './index.css'
import { TRPCProvider } from "@/providers/trpc"
import { ClientAuthProvider } from "@/providers/ClientAuthProvider"
import App from './App.tsx'

// Set language from URL query parameter
const urlParams = new URLSearchParams(window.location.search);
const urlLang = urlParams.get('lang');
if (urlLang && ['en', 'es', 'pt'].includes(urlLang)) {
  i18n.changeLanguage(urlLang);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <TRPCProvider>
        <ClientAuthProvider>
          <App />
        </ClientAuthProvider>
      </TRPCProvider>
    </BrowserRouter>
  </StrictMode>,
)