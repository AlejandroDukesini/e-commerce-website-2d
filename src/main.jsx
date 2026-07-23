import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { ConsentProvider } from './context/ConsentContext.jsx';

// Design system — load order matters (tokens → base → utilities → components).
import './assets/styles/tokens.css';
import './assets/styles/base.css';
import './assets/styles/utilities.css';
import './assets/styles/components.css';
import './assets/styles/layout.css';
import './assets/styles/vehicle.css';
import './assets/styles/canvas.css';
import './assets/styles/spotlight.css';
import './assets/styles/pages.css';
import './assets/styles/cookies.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ConsentProvider>
          <App />
        </ConsentProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);
