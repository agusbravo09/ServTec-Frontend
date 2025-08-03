/**
 * utils.js - Funciones de utilidad optimizadas
 */

const statusMap = {
  'PENDIENTE': 'Pendiente',
  'EN_REPARACION': 'En reparación',
  'COMPLETADO': 'Completado',
  'APROBADO': 'Aprobado',
  'RECHAZADO': 'Rechazado',
  'CANCELADO': 'Cancelado',
  'EN_REVISION': 'En revisión'
};

export const formatStatus = status => statusMap[status] || status;

export const formatDate = (dateString) => {
  if (!dateString) return 'Fecha no disponible';
  
  try {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  } catch (error) {
    console.error('Error formateando fecha:', error);
    return 'Fecha inválida';
  }
};

const createMessage = (type, message) => {
  const div = document.createElement('div');
  div.className = `${type}-message`;
  div.innerHTML = `
    <i class="fas fa-${type === 'error' ? 'exclamation' : 'check'}-circle"></i>
    <span>${message}</span>
  `;
  return div;
};

export const showError = (message, container = document.body) => {
  const errorDiv = createMessage('error', message);
  container.prepend(errorDiv);
  setTimeout(() => errorDiv.remove(), 5000);
};

export const showSuccess = (message, container = document.body) => {
  const successDiv = createMessage('success', message);
  container.prepend(successDiv);
  setTimeout(() => successDiv.remove(), 5000);
};

export default {
  formatStatus,
  formatDate,
  showError,
  showSuccess
};