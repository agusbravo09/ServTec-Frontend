/**
 * utils.js - Funciones de utilidad compartidas
 */

/**
 * Formatea el estado del presupuesto para mostrarlo al usuario
 * @param {string} status - Estado del presupuesto (ej: 'PENDIENTE')
 * @returns {string} Estado formateado (ej: 'Pendiente')
 */
export function formatStatus(status) {
    const statusMap = {
        'PENDIENTE': 'Pendiente',
        'EN_REPARACION': 'En reparación',
        'COMPLETADO': 'Completado',
        'APROBADO': 'Aprobado',
        'RECHAZADO': 'Rechazado',
        'CANCELADO': 'Cancelado',
        'EN_REVISION': 'En revisión'
    };
    return statusMap[status] || status;
}

/**
 * Formatea una fecha para mostrarla al usuario
 * @param {string} dateString - Fecha en formato ISO
 * @returns {string} Fecha formateada (ej: '12/05/2023')
 */
export function formatDate(dateString) {
    if (!dateString) return 'Fecha no disponible';
    
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    } catch (error) {
        console.error('Error formateando fecha:', error);
        return 'Fecha inválida';
    }
}

/**
 * Muestra un mensaje de error en la UI
 * @param {string} message - Mensaje de error
 * @param {HTMLElement} container - Contenedor donde mostrar el error
 */
export function showError(message, container = document.body) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.innerHTML = `
        <i class="fas fa-exclamation-circle"></i>
        <span>${message}</span>
    `;
    container.prepend(errorDiv);
    
    setTimeout(() => errorDiv.remove(), 5000);
}

/**
 * Muestra un mensaje de éxito en la UI
 * @param {string} message - Mensaje de éxito
 * @param {HTMLElement} container - Contenedor donde mostrar el mensaje
 */
export function showSuccess(message, container = document.body) {
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.innerHTML = `
        <i class="fas fa-check-circle"></i>
        <span>${message}</span>
    `;
    container.prepend(successDiv);
    
    setTimeout(() => successDiv.remove(), 5000);
}

// Exportación global
export default {
    formatStatus,
    formatDate,
    showError,
    showSuccess
};