/**
 * Manejo optimizado de la sesión
 */
const handleSessionClear = () => {
  if (document.visibilityState === 'hidden' && 
      !document.referrer.includes(window.location.origin)) {
    sessionStorage.clear();
  }
};

document.addEventListener('visibilitychange', handleSessionClear);