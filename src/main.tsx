import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';

// Notice the "!" at the very end of this next line:
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);