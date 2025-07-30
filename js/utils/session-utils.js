// Limpia el sessionStorage solo si el usuario realmente abandona el sitio
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') {
    if (!document.referrer.includes(window.location.origin)) {
      sessionStorage.clear();
    }
  }
});