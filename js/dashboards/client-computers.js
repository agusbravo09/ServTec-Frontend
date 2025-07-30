import { ComputerService, BudgetService } from '../api-service.js';
import { formatDate, formatStatus, showError } from '../utils/utils.js';
import { MobileMenu } from '../utils/mobile-menu.js';

export class ComputersSection {
    constructor() {
        this.computersContainer = document.getElementById('computers-container');
        this.typeFilter = document.getElementById('computer-type-filter');
        this.clientData = JSON.parse(sessionStorage.getItem('currentClient'));
        this.init();
        this.setupLogout();
        new MobileMenu();
    }

    async init() {
        if (!this.clientData){
        window.location.href = '../../index.html';
        alert("Error: Debe ingresar un documento primero.");
        return;
        }

        try {
            // 1. Cargar computadoras del cliente
            const computers = await ComputerService.getByClient(this.clientData.id);

            // 2. Cargar todos los presupuestos del cliente
            const budgets = await BudgetService.getByClient(this.clientData.id);

            // 3. Renderizar con los datos combinados
            this.renderComputers(computers, budgets);

        } catch (error) {
            console.error('Error inicializando:', error);
            showError('Error al cargar los datos. Intente recargar.');
        }
    }

    renderComputers(computers, budgets) {
        if (!computers || computers.length === 0) {
            this.computersContainer.innerHTML = `
                <div class="no-computers">
                    <i class="fas fa-laptop"></i>
                    <p>No se encontraron computadoras</p>
                </div>
            `;
            return;
        }

        this.computersContainer.innerHTML = computers.map(computer => {
            // Filtrar presupuestos para esta computadora
            const computerBudgets = budgets.filter(budget => {
                // Verificamos si budget tiene computerId (puede ser objeto o solo ID)
                const budgetComputerId = budget.computer?.id || budget.computerId;
                return budgetComputerId === computer.id;
            });

            return `
                <div class="computer-card" data-id="${computer.id}">
                    <div class="computer-header">
                        <span class="computer-type">${computer.type}</span>
                        <span class="computer-id">#${computer.id}</span>
                    </div>
                    
                    <div class="computer-specs">
                        <div class="spec-item">
                            <span class="spec-label">Procesador:</span>
                            <span class="spec-value">${computer.processor || 'No especificado'}</span>
                        </div>
                        <div class="spec-item">
                            <span class="spec-label">RAM:</span>
                            <span class="spec-value">${computer.ram || 'No especificado'}</span>
                        </div>
                        <div class="spec-item">
                            <span class="spec-label">Almacenamiento:</span>
                            <span class="spec-value">${computer.storage || 'No especificado'}</span>
                        </div>
                        <div class="spec-item">
                            <span class="spec-label">Placa madre:</span>
                            <span class="spec-value">${computer.motherboard || 'No especificado'}</span>
                        </div>
                        <div class="spec-item">
                            <span class="spec-label">Fuente de Alimentación:</span>
                            <span class="spec-value">${computer.powerSupply || 'No especificado'}</span>
                        </div>
                        <div class="spec-item">
                            <span class="spec-label">Gráficos:</span>
                            <span class="spec-value">${computer.graphics || 'No especificado'}</span>
                        </div>
                    </div>
                    
                    <div class="computer-footer">
                        <div class="budgets-count">
                            <i class="fas fa-file-invoice-dollar"></i>
                            <span>${computerBudgets.length} presupuesto(s)</span>
                        </div>
                        <button class="btn-budgets" data-computer-id="${computer.id}">
                            <i class="fas fa-eye"></i> Ver
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        this.setupEventListeners();
    }

    setupEventListeners() {
        this.computersContainer.addEventListener('click', (e) => {
            const btn = e.target.closest('.btn-budgets');
            if (btn) {
                const computerId = btn.dataset.computerId;
                this.showBudgetsForComputer(computerId);
            }
        });
    }

    showBudgetsForComputer(computerId) {
        // Redirigir a client-budgets.html con el parámetro de filtro
        window.location.href = `client-budgets.html?computerId=${computerId}`;
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
    new ComputersSection();
});