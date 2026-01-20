import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import './index.css';
import "@fortawesome/fontawesome-free/css/all.min.css";
import App from "./App";

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

console.log("origin=", window.location.origin);
console.log("VITE_GOOGLE_CLIENT_ID=", clientId);

if (!clientId) {
  console.error("VITE_GOOGLE_CLIENT_ID is missing. Check .env/.env.local and restart dev server.");
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={clientId ?? ""}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </GoogleOAuthProvider>
  </StrictMode>
);