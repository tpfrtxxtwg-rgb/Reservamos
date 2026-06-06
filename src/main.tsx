import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import './i18n'
import './index.css'
import { TRPCProvider } from "@/providers/trpc"
import { ClientAuthProvider } from "@/providers/ClientAuthProvider"
import App from './App.tsx'

// Debug: force Vite to generate new bundle hash
console.log('[App] v2025-06-04-22 loaded')

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
