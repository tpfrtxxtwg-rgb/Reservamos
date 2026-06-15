import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import { TranslationProvider } from './context/TranslationContext'
import './i18n'
import './index.css'
import { TRPCProvider } from "@/providers/trpc"
import { ClientAuthProvider } from "@/providers/ClientAuthProvider"
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <TRPCProvider>
        <ClientAuthProvider>
          <TranslationProvider>
            <App />
          </TranslationProvider>
        </ClientAuthProvider>
      </TRPCProvider>
    </BrowserRouter>
  </StrictMode>,
)