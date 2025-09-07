// import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import 'bootstrap/dist/css/bootstrap.min.css'
// import 'primereact/resources/themes/lara-light-indigo/theme.css'
// import 'primereact/resources/primereact.min.css'
// import 'primeicons/primeicons.css'
import './index.css'
import App from './App.tsx'

const root = createRoot(document.getElementById('root')!)

// root.render(
//   <StrictMode>
//     <BrowserRouter>
//       <App />
//     </BrowserRouter>
//   </StrictMode>,
// )

root.render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
)
