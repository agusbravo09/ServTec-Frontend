import { BudgetService, ComputerService } from '../api-service.js';
import { formatDate, formatStatus, showError } from '../utils/utils.js';
import { MobileMenu } from '../utils/mobile-menu.js';

export class BudgetsSection {
    constructor() {
        this.elements = {
            container: document.getElementById('budgets-container'),
            statusFilter: document.getElementById('budget-status-filter'),
            logoutLink: document.querySelector('.logout-item a')
        };
        
        this.clientData = JSON.parse(sessionStorage.getItem('currentClient'));
        this.urlParams = new URLSearchParams(window.location.search);
        this.computerIdFilter = this.urlParams.get('computerId');
        this.budgets = [];
        this.computers = [];
        
        new MobileMenu();
        this.init();
    }

    async init() {
        if (!this.clientData) return this.redirectToLogin();

        try {
            await this.loadData();
            if (this.computerIdFilter) this.showComputerFilterInfo();
            this.renderBudgets(this.budgets);
            this.setupEventListeners();
        } catch (error) {
            console.error('Error inicializando:', error);
            showError('Error al cargar los presupuestos. Intente recargar.');
        }
    }

    async loadData() {
        [this.budgets, this.computers] = await Promise.all([
            BudgetService.getByClient(this.clientData.id),
            ComputerService.getByClient(this.clientData.id)
        ]);

        if (this.computerIdFilter) {
            this.budgets = this.budgets.filter(budget => {
                const budgetComputerId = budget.computer?.id || budget.computerId;
                return budgetComputerId == this.computerIdFilter;
            });
        }
    }

    redirectToLogin() {
        window.location.href = '../../index.html';
        alert("Error: Debe ingresar un documento primero.");
    }

    showComputerFilterInfo() {
        const computer = this.computers.find(c => c.id == this.computerIdFilter);
        if (!computer) return;

        const filterInfo = document.createElement('div');
        filterInfo.className = 'filter-info';
        filterInfo.innerHTML = `
            <i class="fas fa-laptop"></i>
            <span>Mostrando presupuestos para: ${computer.type} ${computer.brand || ''} ${computer.model || ''}</span>
            <a href="client-budgets.html" class="clear-filter">
                <i class="fas fa-times"></i> Limpiar filtro
            </a>
        `;
        this.elements.container.prepend(filterInfo);
    }

    renderBudgets(budgetsToRender) {
        if (!budgetsToRender?.length) {
            this.elements.container.innerHTML = this.getNoBudgetsHTML();
            return;
        }

        this.elements.container.innerHTML = budgetsToRender.map(budget => 
            this.getBudgetCardHTML(budget)
        ).join('');
    }

    getBudgetCardHTML(budget) {
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
                    ${this.getBudgetInfoRows(budget, computer)}
                </div>
                
                <div class="budget-footer">
                    <button class="btn-details" data-budget-id="${budget.id}">
                        <i class="fas fa-search"></i> Ver detalles
                    </button>
                </div>
            </div>
        `;
    }

    getBudgetInfoRows(budget, computer) {
        return [
            { label: 'Equipo:', value: computer?.type || 'No especificado' },
            { label: 'Fecha:', value: formatDate(budget.emissionDate) },
            { label: 'Total:', value: budget.totalAmount ? '$' + budget.totalAmount : 'No especificado' }
        ].map(({label, value}) => `
            <div class="info-row">
                <span class="info-label">${label}</span>
                <span class="info-value">${value}</span>
            </div>
        `).join('');
    }

    setupEventListeners() {
        this.elements.statusFilter?.addEventListener('change', (e) => {
            const selectedStatus = e.target.value;
            const filteredBudgets = selectedStatus === 'all' 
                ? this.budgets 
                : this.budgets.filter(b => b.status === selectedStatus);
            this.renderBudgets(filteredBudgets);
        });

        this.elements.container.addEventListener('click', (e) => {
            const btn = e.target.closest('.btn-details');
            if (btn) this.showBudgetDetails(btn.dataset.budgetId);
        });

        this.elements.logoutLink?.addEventListener('click', (e) => {
            e.preventDefault();
            sessionStorage.removeItem('currentClient');
            window.location.href = '../../index.html';
        });
    }

    showBudgetDetails(budgetId) {
        window.location.href = `budget-details.html?id=${budgetId}`;
    }

    getNoBudgetsHTML() {
        return `
            <div class="no-budgets">
                <i class="fas fa-file-invoice-dollar"></i>
                <p>No se encontraron presupuestos</p>
            </div>
        `;
    }
}

document.addEventListener('DOMContentLoaded', () => new BudgetsSection());