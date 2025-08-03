import { ComputerService, BudgetService } from '../api-service.js';
import { formatDate, formatStatus, showError } from '../utils/utils.js';
import { MobileMenu } from '../utils/mobile-menu.js';

export class ComputersSection {
    constructor() {
        this.elements = {
            container: document.getElementById('computers-container'),
            typeFilter: document.getElementById('computer-type-filter'),
            logoutLink: document.querySelector('.logout-item a')
        };
        this.clientData = JSON.parse(sessionStorage.getItem('currentClient'));
        this.init();
        new MobileMenu();
    }

    async init() {
        if (!this.clientData) return this.redirectToLogin();

        try {
            const [computers, budgets] = await Promise.all([
                ComputerService.getByClient(this.clientData.id),
                BudgetService.getByClient(this.clientData.id)
            ]);
            
            this.renderComputers(computers, budgets);
        } catch (error) {
            console.error('Error inicializando:', error);
            showError('Error al cargar los datos. Intente recargar.');
        }
    }

    redirectToLogin() {
        window.location.href = '../../index.html';
        alert("Error: Debe ingresar un documento primero.");
    }

    renderComputers(computers, budgets) {
        if (!computers?.length) {
            this.elements.container.innerHTML = this.getNoComputersHTML();
            return;
        }

        this.elements.container.innerHTML = computers.map(computer => 
            this.getComputerCardHTML(computer, budgets)
        ).join('');

        this.setupEventListeners();
    }

    getComputerCardHTML(computer, budgets) {
        const computerBudgets = budgets.filter(budget => 
            (budget.computer?.id || budget.computerId) === computer.id
        );

        return `
            <div class="computer-card" data-id="${computer.id}">
                <div class="computer-header">
                    <span class="computer-type">${computer.type}</span>
                    <span class="computer-id">#${computer.id}</span>
                </div>
                
                <div class="computer-specs">
                    ${this.getSpecItemsHTML(computer)}
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
    }

    getSpecItemsHTML(computer) {
        const specs = [
            { label: 'Procesador', value: computer.processor },
            { label: 'RAM', value: computer.ram },
            { label: 'Almacenamiento', value: computer.storage },
            { label: 'Placa madre', value: computer.motherboard },
            { label: 'Fuente de Alimentación', value: computer.powerSupply },
            { label: 'Gráficos', value: computer.graphics }
        ];

        return specs.map(({label, value}) => `
            <div class="spec-item">
                <span class="spec-label">${label}:</span>
                <span class="spec-value">${value || 'No especificado'}</span>
            </div>
        `).join('');
    }

    setupEventListeners() {
        this.elements.container.addEventListener('click', (e) => {
            const btn = e.target.closest('.btn-budgets');
            if (btn) this.showBudgetsForComputer(btn.dataset.computerId);
        });

        if (this.elements.logoutLink) {
            this.elements.logoutLink.addEventListener('click', (e) => {
                e.preventDefault();
                sessionStorage.removeItem('currentClient');
                window.location.href = '../../index.html';
            });
        }
    }

    showBudgetsForComputer(computerId) {
        window.location.href = `client-budgets.html?computerId=${computerId}`;
    }

    getNoComputersHTML() {
        return `
            <div class="no-computers">
                <i class="fas fa-laptop"></i>
                <p>No se encontraron computadoras</p>
            </div>
        `;
    }
}

document.addEventListener('DOMContentLoaded', () => new ComputersSection());