// Loader per variabili d'ambiente durante lo sviluppo locale
// Carica da .env durante il dev, da variabili di environment durante il build/deploy
(function() {
  // Durante il build (Netlify/CI), le variabili saranno iniettate tramite process.env
  // Se disponibili, usiamole
  if (typeof window.VITE_SNIPCART_API_KEY === 'undefined' && typeof process !== 'undefined') {
    if (process.env.VITE_SNIPCART_API_KEY) {
      window.VITE_SNIPCART_API_KEY = process.env.VITE_SNIPCART_API_KEY;
    }
  }
})();
