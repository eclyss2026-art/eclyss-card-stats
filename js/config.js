// Configurazione globale ECLYSS
window.SNIPCART_API_KEY = 'API_KEY_PLACEHOLDER';

// Applica la API key al div Snipcart
document.addEventListener('DOMContentLoaded', function() {
  const snipcart = document.getElementById('snipcart');
  if (snipcart) {
    snipcart.setAttribute('data-api-key', window.SNIPCART_API_KEY);
  }
});
