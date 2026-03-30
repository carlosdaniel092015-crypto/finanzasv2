import "./instrument.js"; // ← debe ser la primera línea siempre
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Registrar el Service Worker con logs de diagnóstico
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(registration => {
        console.log('✅ SW registrado con éxito en el ámbito:', registration.scope);
      })
      .catch(error => {
        console.error('❌ Falló el registro del SW:', error);
      });

    // Recargar la página automáticamente cuando se activa un nuevo SW
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });
  });
} else {
  console.warn('⚠️ Service Workers no son compatibles con este navegador.');
}
