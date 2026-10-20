import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './duepoint-compact-nav-v2.css'
import App from './App.tsx'

import './duepoint-compact-mobile-v3.css'

import './duepoint-breathable-v4.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)