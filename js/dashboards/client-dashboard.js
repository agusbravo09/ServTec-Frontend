import { BudgetService } from '../api-service.js';
import { formatDate, formatStatus, showError } from '../utils/utils.js';
import { MobileMenu } from '../utils/mobile-menu.js';

export class ClientDashboard {
    constructor() {
        this.elements = {
            clientName: document.getElementById('client-name'),
            computersCount: document.getElementById('computers-count'),
            repairCount: document.getElementById('repair-count'),
            completedCount: document.getElementById('completed-count'),
            budgetsList: document.getElementById('budgets-list'),
            logoutLink: document.querySelector('.logout-item a')
        };

        this.clientData = JSON.parse(sessionStorage.getItem('currentClient'));
        new MobileMenu();
        this.init();
    }

    async init() {
        if (!this.clientData) return this.redirectToLogin();
        
        this.setupLogout();
        await this.loadClientData();
    }

    redirectToLogin() {
        window.location.href = '../../index.html';
        alert("Error: Debe ingresar un documento primero.");
    }

    async loadClientData() {
        try {
            this.elements.clientName.textContent = this.clientData.name || this.clientData.nombre;
            
            const computers = this.clientData.computers || [];
            this.elements.computersCount.textContent = computers.length;
            
            const budgets = await BudgetService.getByClient(this.clientData.id);
            
            const inRepair = budgets.filter(b => b.status === 'EN_REPARACION').length;
            const completed = budgets.filter(b => b.status === 'COMPLETADO').length;
            
            this.elements.repairCount.textContent = inRepair;
            this.elements.completedCount.textContent = completed;
            
            this.renderBudgets(budgets.slice(0, 2));
        } catch (error) {
            console.error('Error cargando datos:', error);
            showError('Error al cargar los datos. Intente recargar la página.');
        }
    }

    renderBudgets(budgets) {
        if (!budgets?.length) {
            this.elements.budgetsList.innerHTML = this.getNoBudgetsHTML();
            return;
        }

        this.elements.budgetsList.innerHTML = budgets.map(budget => `
            <div class="budget-item">
                <div class="budget-info">
                    <h4>${budget.comments || 'Equipo no especificado'}</h4>
                    <p>Presupuesto #${budget.id} - ${this.formatDate(budget.emissionDate)}</p>
                </div>
                <div>
                    <span class="budget-status status-${budget.status.toLowerCase()}">
                        ${this.formatStatus(budget.status)}
                    </span>
                </div>
            </div>
        `).join('');
    }

    formatDate(dateString) {
        if (!dateString) return 'Fecha no disponible';
        return new Date(dateString).toLocaleDateString('es-ES');
    }

    formatStatus(status) {
        const statusMap = {
            'PENDIENTE': 'Pendiente',
            'EN_REPARACION': 'En reparación',
            'COMPLETADO': 'Completado',
            'APROBADO': 'Aprobado',
            'RECHAZADO': 'Rechazado'
        };
        return statusMap[status] || status;
    }

    setupLogout() {
        this.elements.logoutLink?.addEventListener('click', (e) => {
            e.preventDefault();
            sessionStorage.removeItem('currentClient');
            window.location.href = '../../index.html';
        });
    }

    getNoBudgetsHTML() {
        return `
            <div class="no-budgets">
                <i class="fas fa-file-alt"></i>
                <p>No hay presupuestos recientes</p>
            </div>
        `;
    }
}

document.addEventListener('DOMContentLoaded', () => new ClientDashboard());