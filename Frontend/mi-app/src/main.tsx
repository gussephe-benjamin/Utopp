import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

//import { GoogleOAuthProvider } from "@react-oauth/google";

const apiUrl = import.meta.env.VITE_GOOGLE_CLIENT_ID;

function print(){
  console.log("ApiURL: ", apiUrl)
}

print()

// createRoot(document.getElementById('root')!).render(
//   <StrictMode>
//     <GoogleOAuthProvider clientId={apiUrl}> 
//       <App/>
//     </GoogleOAuthProvider>
//   </StrictMode>,
// )

createRoot(document.getElementById('root')!).render(
  <StrictMode>
      <App/>
  </StrictMode>,
)
