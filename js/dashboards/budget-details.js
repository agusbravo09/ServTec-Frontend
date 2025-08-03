import { BudgetService, ComputerService } from '../api-service.js';
import { formatDate, formatStatus, showError, showSuccess } from '../utils/utils.js';
import { MobileMenu } from '../utils/mobile-menu.js';

export class BudgetDetails {
    constructor() {
        this.elements = {
            container: document.getElementById('budget-details-container'),
            logoutLink: document.querySelector('.logout-item a')
        };
        
        this.urlParams = new URLSearchParams(window.location.search);
        this.budgetId = this.urlParams.get('id');
        this.clientData = JSON.parse(sessionStorage.getItem('currentClient'));
        
        new MobileMenu();
        this.init();
    }

    async init() {
        if (!this.clientData || !this.budgetId) return this.redirectToLogin();

        try {
            const budget = await BudgetService.getById(this.budgetId);
            
            if (budget.clientId !== this.clientData.id) {
                return this.showErrorState('No tienes permiso para ver este presupuesto');
            }

            const computer = await ComputerService.getById(budget.computerId);
            this.renderBudgetDetails(budget, computer);
            this.setupActionButtons(budget);
        } catch (error) {
            console.error('Error cargando detalles:', error);
            this.showErrorState('Error al cargar los detalles del presupuesto');
        }
    }

    redirectToLogin() {
        window.location.href = '../../index.html';
        alert("Error: Debe ingresar un documento primero.");
    }

    renderBudgetDetails(budget, computer) {
        const totalAmount = budget.totalAmount || 
            (budget.jobItems?.reduce((sum, item) => sum + item.amount, 0) || 0) +
            (budget.partItems?.reduce((sum, item) => sum + item.amount, 0) || 0);

        this.elements.container.innerHTML = `
            <div class="budget-details-header">
                <span class="budget-id">Presupuesto #${budget.id}</span>
                <span class="budget-status status-${budget.status.toLowerCase()}">
                    ${formatStatus(budget.status)}
                </span>
            </div>
            
            <div class="budget-details-grid">
                ${this.getDetailGroupsHTML(budget, computer)}
            </div>
            
            <div class="services-list">
                ${this.getServicesListHTML(budget)}
                
                <div class="total-amount">
                    Total: $${totalAmount.toLocaleString()}
                </div>
            </div>
            
            ${budget.status === 'PENDIENTE' ? this.getActionButtonsHTML() : ''}
        `;
    }

    getDetailGroupsHTML(budget, computer) {
        return [
            { label: 'Equipo', value: computer?.type || 'No especificado' },
            { label: 'Comentarios', value: budget.comments || 'No especificado' },
            { label: 'Fecha de emisión', value: formatDate(budget.emissionDate) },
            { label: 'Fecha de vencimiento', value: budget.validityDate ? formatDate(budget.validityDate) : 'No especificada' }
        ].map(({label, value}) => `
            <div class="detail-group">
                <span class="detail-label">${label}</span>
                <p class="detail-value">${value}</p>
            </div>
        `).join('');
    }

    getServicesListHTML(budget) {
        return `
            <h3>Trabajos a realizar</h3>
            ${budget.jobItems?.length > 0 ? 
                budget.jobItems.map(item => this.getServiceItemHTML(item)).join('') : 
                '<p>No se especificaron trabajos</p>'}
            
            <h3 style="margin-top: 20px;">Repuestos/Partes</h3>
            ${budget.partItems?.length > 0 ? 
                budget.partItems.map(item => this.getPartItemHTML(item)).join('') : 
                '<p>No se especificaron repuestos</p>'}
        `;
    }

    getServiceItemHTML(item) {
        return `
            <div class="service-item">
                <span class="service-name">${item.description}</span>
                <span class="service-price">${item.hours} hs x $${item.hourPrice} = $${item.amount}</span>
            </div>
        `;
    }

    getPartItemHTML(item) {
        return `
            <div class="service-item">
                <span class="service-name">${item.description} (${item.quantity} x $${item.unitPrice})</span>
                <span class="service-price">$${item.amount}</span>
            </div>
        `;
    }

    getActionButtonsHTML() {
        return `
            <div class="budget-actions">
                <button class="btn-action btn-reject" id="btnReject">
                    <i class="fas fa-times"></i> Rechazar presupuesto
                </button>
                <button class="btn-action btn-accept" id="btnAccept">
                    <i class="fas fa-check"></i> Aceptar presupuesto
                </button>
            </div>
        `;
    }

    setupActionButtons(budget) {
        if (budget.status !== 'PENDIENTE') return;

        document.getElementById('btnAccept').addEventListener('click', 
            () => this.handleBudgetAction('APROBADO'));
        document.getElementById('btnReject').addEventListener('click', 
            () => this.handleBudgetAction('RECHAZADO'));
    }

    async handleBudgetAction(newStatus) {
        if (!confirm(`¿Estás seguro que deseas ${newStatus === 'APROBADO' ? 'aceptar' : 'rechazar'} este presupuesto?`)) {
            return;
        }

        const btnAccept = document.getElementById('btnAccept');
        const btnReject = document.getElementById('btnReject');
        const originalAcceptText = btnAccept?.innerHTML;
        const originalRejectText = btnReject?.innerHTML;

        try {
            if (newStatus === 'APROBADO' && btnAccept) {
                btnAccept.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';
            } else if (btnReject) {
                btnReject.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';
            }

            const currentBudget = await BudgetService.getById(this.budgetId);
            const updateData = { ...currentBudget, status: newStatus };
            await BudgetService.update(this.budgetId, updateData);

            setTimeout(() => window.location.reload(), 200);
        } catch (error) {
            console.error('Error actualizando presupuesto:', error);

            if (newStatus === 'APROBADO' && btnAccept) {
                btnAccept.innerHTML = originalAcceptText;
            } else if (btnReject) {
                btnReject.innerHTML = originalRejectText;
            }

            showError('Error al actualizar el presupuesto. Intente nuevamente.');
        }
    }

    showErrorState(message) {
        this.elements.container.innerHTML = `
            <div class="error-state">
                <i class="fas fa-exclamation-triangle"></i>
                <p>${message}</p>
                <a href="client-budgets.html" class="btn-back">Volver a presupuestos</a>
            </div>
        `;
    }

    setupLogout() {
        this.elements.logoutLink?.addEventListener('click', (e) => {
            e.preventDefault();
            sessionStorage.removeItem('currentClient');
            window.location.href = '../../index.html';
        });
    }
}

document.addEventListener('DOMContentLoaded', () => new BudgetDetails());