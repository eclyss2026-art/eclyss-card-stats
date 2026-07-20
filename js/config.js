// Configurazione globale ECLYSS
window.SNIPCART_API_KEY = 'MDVjMmQ2NmItODk2Zi00OTFkLWJmN2UtNGRhNzZhMTZhZDQxNjM5MjAxNTAzODExNjAwNDYz';

// Applica la API key al div Snipcart
document.addEventListener('DOMContentLoaded', function() {
  const snipcart = document.getElementById('snipcart');
  if (snipcart) {
    snipcart.setAttribute('data-api-key', window.SNIPCART_API_KEY);
  }
});
