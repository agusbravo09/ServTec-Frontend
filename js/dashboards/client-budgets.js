import { BudgetService, ComputerService } from '../api-service.js';
import { formatDate, formatStatus, showError } from '../utils/utils.js';
import { MobileMenu } from '../utils/mobile-menu.js';

export class BudgetsSection {
    constructor() {
        this.budgetsContainer = document.getElementById('budgets-container');
        this.statusFilter = document.getElementById('budget-status-filter');
        this.clientData = JSON.parse(sessionStorage.getItem('currentClient'));
        const urlParams = new URLSearchParams(window.location.search);
        this.computerIdFilter = urlParams.get('computerId');
        this.setupLogout();
        this.budgets = [];
        this.computers = [];
        this.init();
        new MobileMenu();
    }

    async init() {
        if (!this.clientData) {
            window.location.href = '../../index.html';
            alert("Error: Debe ingresar un documento primero.");
            return;
        }

        try {
            // Cargar presupuestos (con filtro si existe)
            this.budgets = await BudgetService.getByClient(this.clientData.id);
            this.computers = await ComputerService.getByClient(this.clientData.id);

            // Aplicar filtro por computadora si existe
            if (this.computerIdFilter) {
                this.budgets = this.budgets.filter(budget => {
                    const budgetComputerId = budget.computer?.id || budget.computerId;
                    return budgetComputerId == this.computerIdFilter;
                });

                // Mostrar mensaje indicando el filtro
                this.showComputerFilterInfo();
            }

            this.renderBudgets(this.budgets);
            this.setupEventListeners();
        } catch (error) {
            console.error('Error inicializando:', error);
            showError('Error al cargar los presupuestos. Intente recargar.');
        }
    }

    showComputerFilterInfo() {
        const computer = this.computers.find(c => c.id == this.computerIdFilter);
        if (computer) {
            const filterInfo = document.createElement('div');
            filterInfo.className = 'filter-info';
            filterInfo.innerHTML = `
                <i class="fas fa-laptop"></i>
                <span>Mostrando presupuestos para: ${computer.type} ${computer.brand || ''} ${computer.model || ''}</span>
                <a href="client-budgets.html" class="clear-filter">
                    <i class="fas fa-times"></i> Limpiar filtro
                </a>
            `;
            this.budgetsContainer.prepend(filterInfo);
        }
    }

    renderBudgets(budgetsToRender) {
        if (!budgetsToRender || budgetsToRender.length === 0) {
            this.budgetsContainer.innerHTML = `
                <div class="no-budgets">
                    <i class="fas fa-file-invoice-dollar"></i>
                    <p>No se encontraron presupuestos</p>
                </div>
            `;
            return;
        }

        this.budgetsContainer.innerHTML = budgetsToRender.map(budget => {
            // Buscar la computadora asociada
            const computer = this.computers.find(c => c.id === (budget.computer?.id || budget.computerId));

            return `
                <div class="budget-card" data-status="${budget.status.toLowerCase()}">
                    <div class="budget-header">
                        <span class="budget-id">Presupuesto #${budget.id}</span>
                        <span class="budget-status status-${budget.status.toLowerCase()}">
                            ${formatStatus(budget.status)}
                        </span>
                    </div>
                    
                    <div class="budget-info">
                        <div class="info-row">
                            <span class="info-label">Equipo:</span>
                            <span class="info-value">${computer?.type || 'No especificado'}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Fecha:</span>
                            <span class="info-value">${formatDate(budget.emissionDate)}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Total:</span>
                            <span class="info-value">${budget.totalAmount ? '$' + budget.totalAmount : 'No especificado'}</span>
                        </div>
                    </div>
                    
                    <div class="budget-footer">
                        <button class="btn-details" data-budget-id="${budget.id}">
                            <i class="fas fa-search"></i> Ver detalles
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    setupEventListeners() {
        // Filtro por estado
        this.statusFilter.addEventListener('change', (e) => {
            const selectedStatus = e.target.value;
            let filteredBudgets = this.budgets;

            if (selectedStatus !== 'all') {
                filteredBudgets = this.budgets.filter(
                    budget => budget.status === selectedStatus
                );
            }

            this.renderBudgets(filteredBudgets);
        });

        // Botones de detalles
        this.budgetsContainer.addEventListener('click', (e) => {
            const btn = e.target.closest('.btn-details');
            if (btn) {
                this.showBudgetDetails(btn.dataset.budgetId);
            }
        });
    }

    showBudgetDetails(budgetId) {
        // Aquí implementarías la lógica para mostrar los detalles completos
        // Podría ser un modal, una nueva página, etc.
        console.log('Mostrando detalles del presupuesto:', budgetId);
        // Ejemplo:
        window.location.href = `budget-details.html?id=${budgetId}`;
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

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    new BudgetsSection();
});