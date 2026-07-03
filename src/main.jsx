import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
/* i18n MUST load before App: the stores call i18n.t while rehydrating at import time */
import './i18n'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
