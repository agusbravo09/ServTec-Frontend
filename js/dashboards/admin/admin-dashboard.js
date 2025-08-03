import { BudgetService, ComputerService } from '../../api-service.js';
import { formatDate, formatStatus } from '../../utils/utils.js';
import { MobileMenu } from '../../utils/mobile-menu.js';

class DashboardManager {
  constructor() {
    this.init();
  }

  init() {
    if (!this.checkAdminAccess()) return;
    
    new MobileMenu();
    this.cacheElements();
    this.loadMetrics();
    this.loadRecentBudgets();
    this.setupLogout();
  }

  checkAdminAccess() {
    const currentUser = sessionStorage.getItem('currentAdmin');
    if (!currentUser) {
      alert("Error: Debe iniciar sesión como administrador.");
      window.location.href = 'admin.html';
      return false;
    }
    return true;
  }

  cacheElements() {
    this.elements = {
      metrics: {
        inRepair: document.getElementById('metric-in-repair'),
        completedIncome: document.getElementById('metric-completed-income'),
        totalComputers: document.getElementById('metric-total-computers'),
        budgetsPending: document.getElementById('metric-budgets-pending'),
        budgetsRejected: document.getElementById('metric-budgets-rejected'),
        budgetsApproved: document.getElementById('metric-budgets-approved'),
        budgetsCompleted: document.getElementById('metric-budgets-completed')
      },
      budgetsList: document.getElementById('budgets-list')
    };
  }

  async loadMetrics() {
    try {
      const [computers, budgets] = await Promise.all([
        ComputerService.getAll(),
        BudgetService.getAll()
      ]);

      // Equipos en reparación y total de equipos
      this.elements.metrics.inRepair.textContent = 
        budgets.filter(b => b.status === 'EN_REPARACION').length;
      this.elements.metrics.totalComputers.textContent = computers.length;

      // Ingresos de presupuestos completados
      const completed = await BudgetService.getByStatus('COMPLETADO');
      const completedIncome = completed.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
      this.elements.metrics.completedIncome.textContent = `$${completedIncome.toLocaleString()}`;

      // Presupuestos por estado
      const statusMetrics = [
        { status: 'PENDIENTE', element: this.elements.metrics.budgetsPending },
        { status: 'RECHAZADO', element: this.elements.metrics.budgetsRejected },
        { status: 'APROBADO', element: this.elements.metrics.budgetsApproved },
        { status: 'COMPLETADO', element: this.elements.metrics.budgetsCompleted }
      ];

      await Promise.all(statusMetrics.map(async ({ status, element }) => {
        const data = await BudgetService.getByStatus(status);
        element.textContent = data.length;
      }));

    } catch (e) {
      Object.values(this.elements.metrics).forEach(metric => {
        metric.textContent = '-';
      });
    }
  }

  async loadRecentBudgets() {
    try {
      const allBudgets = await BudgetService.getByStatus('APROBADO');
      const recentBudgets = allBudgets.slice(0, 5);

      this.elements.budgetsList.innerHTML = recentBudgets.map(budget => `
        <div class="budget-item">
          <div class="budget-info">
            <h4>Presupuesto #${budget.id}</h4>
            <p>${formatDate(budget.emissionDate)} - $${budget.totalAmount}</p>
          </div>
          <div>
            <span class="budget-status status-aprobado">
              ${formatStatus(budget.status)}
            </span>
          </div>
        </div>
      `).join('');
    } catch (error) {
      this.elements.budgetsList.innerHTML = '<div class="no-budgets"><p>Error al cargar presupuestos</p></div>';
    }
  }

  setupLogout() {
    document.querySelector('.logout-item a').addEventListener('click', (e) => {
      e.preventDefault();
      sessionStorage.removeItem('currentAdmin');
      window.location.href = '../../index.html';
    });
  }
}

document.addEventListener('DOMContentLoaded', () => new DashboardManager());