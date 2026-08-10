import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/global.css'
import App from './App.tsx'
import { SessaoProvider } from './state/SessaoContext.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SessaoProvider>
      <App />
    </SessaoProvider>
  </StrictMode>,
)
