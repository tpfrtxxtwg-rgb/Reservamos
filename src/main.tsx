import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import './i18n'  // For admin panel (react-i18next)
import './index.css'
import { TRPCProvider } from "@/providers/trpc"
import { ClientAuthProvider } from "@/providers/ClientAuthProvider"
import App from './App.tsx'

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