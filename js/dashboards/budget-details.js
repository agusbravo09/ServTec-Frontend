import { BudgetService, ComputerService } from '../api-service.js';
import { formatDate, formatStatus, showError, showSuccess } from '../utils/utils.js';
import { MobileMenu } from '../utils/mobile-menu.js';

export class BudgetDetails {
    constructor() {
        this.detailsContainer = document.getElementById('budget-details-container');
        this.urlParams = new URLSearchParams(window.location.search);
        this.budgetId = this.urlParams.get('id');
        this.clientData = JSON.parse(sessionStorage.getItem('currentClient'));
        this.init();
        this.setupLogout();
        new MobileMenu();
    }

    async init() {
        if (!this.clientData || !this.budgetId) {
            window.location.href = '../../index.html';
            alert("Error: Debe ingresar un documento primero.");
            return;
        }

        try {
            const budget = await BudgetService.getById(this.budgetId);

            // Verificar que el presupuesto pertenece al cliente
            if (budget.clientId !== this.clientData.id) {
                this.showErrorState('No tienes permiso para ver este presupuesto');
                return;
            }

            const computer = await ComputerService.getById(budget.computerId);
            this.renderBudgetDetails(budget, computer);
        } catch (error) {
            console.error('Error cargando detalles:', error);
            this.showErrorState('Error al cargar los detalles del presupuesto');
        }
    }

    renderBudgetDetails(budget, computer) {
        // Calcular total si no viene en el JSON (aunque en tu caso sí viene)
        const totalAmount = budget.totalAmount ||
            (budget.jobItems?.reduce((sum, item) => sum + item.amount, 0) || 0) +
            (budget.partItems?.reduce((sum, item) => sum + item.amount, 0) || 0);

        this.detailsContainer.innerHTML = `
            <div class="budget-details-header">
                <span class="budget-id">Presupuesto ${budget.budgetNumber}</span>
                <span class="budget-status status-${budget.status.toLowerCase()}">
                    ${formatStatus(budget.status)}
                </span>
            </div>
            
            <div class="budget-details-grid">
                <div class="detail-group">
                    <span class="detail-label">Equipo</span>
                    <p class="detail-value">${computer?.type || 'No especificado'}</p>
                </div>
                
                <div class="detail-group">
                    <span class="detail-label">Comentarios</span>
                    <p class="detail-value">${budget.comments || 'No especificado'}</p>
                </div>
                
                <div class="detail-group">
                    <span class="detail-label">Fecha de emisión</span>
                    <p class="detail-value">${formatDate(budget.emissionDate)}</p>
                </div>
                
                <div class="detail-group">
                    <span class="detail-label">Fecha de vencimiento</span>
                    <p class="detail-value">${budget.validityDate ? formatDate(budget.validityDate) : 'No especificada'}</p>
                </div>
                
            </div>
            
            <div class="services-list">
                <h3>Trabajos a realizar</h3>
                ${budget.jobItems?.length > 0 ?
                budget.jobItems.map(item => `
                        <div class="service-item">
                            <span class="service-name">${item.description}</span>
                            <span class="service-price">${item.hours} hs x $${item.hourPrice} = $${item.amount}</span>
                        </div>
                    `).join('') : '<p>No se especificaron trabajos</p>'}
                
                <h3 style="margin-top: 20px;">Repuestos/Partes</h3>
                ${budget.partItems?.length > 0 ?
                budget.partItems.map(item => `
                        <div class="service-item">
                            <span class="service-name">${item.description} (${item.quantity} x $${item.unitPrice})</span>
                            <span class="service-price">$${item.amount}</span>
                        </div>
                    `).join('') : '<p>No se especificaron repuestos</p>'}
                
                <div class="total-amount">
                    Total: $${totalAmount.toLocaleString()}
                </div>
            </div>
            
            ${budget.status === 'PENDIENTE' ? `
                <div class="budget-actions">
                    <button class="btn-action btn-reject" id="btnReject">
                        <i class="fas fa-times"></i> Rechazar presupuesto
                    </button>
                    <button class="btn-action btn-accept" id="btnAccept">
                        <i class="fas fa-check"></i> Aceptar presupuesto
                    </button>
                </div>
            ` : ''}
        `;

        // Configurar eventos para los botones de acción
        if (budget.status === 'PENDIENTE') {
            document.getElementById('btnAccept').addEventListener('click', () => this.handleBudgetAction('APROBADO'));
            document.getElementById('btnReject').addEventListener('click', () => this.handleBudgetAction('RECHAZADO'));
        }
    }

    async handleBudgetAction(newStatus) {
        if (!confirm(`¿Estás seguro que deseas ${newStatus === 'APROBADO' ? 'aceptar' : 'rechazar'} este presupuesto?`)) {
            return;
        }

        // Guardar textos originales de los botones
        const originalAcceptText = document.getElementById('btnAccept')?.innerHTML;
        const originalRejectText = document.getElementById('btnReject')?.innerHTML;

        try {
            // 1. Obtener el presupuesto actual primero
            const currentBudget = await BudgetService.getById(this.budgetId);

            // 2. Enviar todos los campos importantes + nuevo estado
            const updateData = {
                ...currentBudget, // Mantener todos los valores existentes
                status: newStatus // Sobrescribir solo el estado
            };

            await BudgetService.update(this.budgetId, updateData);

            // Recarga después de 1.5 segundos (para que se vea el mensaje)
            setTimeout(() => {
                window.location.reload(); // ← Recarga completa
            }, 500);
        } catch (error) {
            console.error('Error actualizando presupuesto:', error);

            // Restaurar texto original de los botones
            if (newStatus === 'APROBADO' && document.getElementById('btnAccept')) {
                document.getElementById('btnAccept').innerHTML = originalAcceptText;
            } else if (document.getElementById('btnReject')) {
                document.getElementById('btnReject').innerHTML = originalRejectText;
            }

            showError('Error al actualizar el presupuesto. Intente nuevamente.');
        }
    }

    setupLogout() {
        const logoutLink = document.querySelector('.logout-item a');
        if (!logoutLink) return;

        logoutLink.addEventListener('click', (e) => {
            e.preventDefault();
            sessionStorage.removeItem('currentClient');
            window.location.href = '../../index.html';
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new BudgetDetails();
});