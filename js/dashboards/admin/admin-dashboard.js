import { BudgetService, ComputerService } from '../../api-service.js';
import { formatDate, formatStatus } from '../../utils/utils.js';
import { MobileMenu } from '../../utils/mobile-menu.js';

document.addEventListener('DOMContentLoaded', async () => {
    // Control de acceso: solo administradores
    const currentUser = sessionStorage.getItem('currentAdmin');
    if (!currentUser) {
        alert("Error: Debe iniciar sesión como administrador.");
        window.location.href = 'admin.html';
        return;
    }

    new MobileMenu();

    const metrics = {
        inRepair: document.getElementById('metric-in-repair'),
        completedIncome: document.getElementById('metric-completed-income'),
        totalComputers: document.getElementById('metric-total-computers'),
        budgetsPending: document.getElementById('metric-budgets-pending'),
        budgetsRejected: document.getElementById('metric-budgets-rejected'),
        budgetsApproved: document.getElementById('metric-budgets-approved'),
        budgetsCompleted: document.getElementById('metric-budgets-completed')
    };

    // 1. Equipos en reparación (solo en curso)
    try {
        const computers = await ComputerService.getAll();
        const budgets = await BudgetService.getAll();
        const inRepair = budgets.filter(b => b.status === 'EN_REPARACION').length;
        metrics.inRepair.textContent = inRepair;
        // 3. Equipos ingresados (total)
        metrics.totalComputers.textContent = computers.length;
    } catch (e) {
        metrics.inRepair.textContent = '-';
        metrics.totalComputers.textContent = '-';
    }

    // 2. Ingresos de presupuestos completados (total)
    try {
        const completed = await BudgetService.getByStatus('COMPLETADO');
        const completedIncome = completed.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
        metrics.completedIncome.textContent = `$${completedIncome.toLocaleString()}`;
    } catch (e) {
        metrics.completedIncome.textContent = '-';
    }

    // 4. Presupuestos pendientes
    try {
        const pending = await BudgetService.getByStatus('PENDIENTE');
        metrics.budgetsPending.textContent = pending.length;
    } catch (e) {
        metrics.budgetsPending.textContent = '-';
    }

    // 5. Presupuestos rechazados
    try {
        const rejected = await BudgetService.getByStatus('RECHAZADO');
        metrics.budgetsRejected.textContent = rejected.length;
    } catch (e) {
        metrics.budgetsRejected.textContent = '-';
    }

    // 6. Presupuestos aprobados
    try {
        const approved = await BudgetService.getByStatus('APROBADO');
        metrics.budgetsApproved.textContent = approved.length;
    } catch (e) {
        metrics.budgetsApproved.textContent = '-';
    }

    // 7. Presupuestos completados
    try {
        const completed = await BudgetService.getByStatus('COMPLETADO');
        metrics.budgetsCompleted.textContent = completed.length;
    } catch (e) {
        metrics.budgetsCompleted.textContent = '-';
    }

    // Últimos 5 presupuestos confirmados
    const budgetsList = document.getElementById('budgets-list');
    try {
        const allBudgets = await BudgetService.getByStatus('APROBADO');

        const recentBudgets = allBudgets.slice(0, 5);

        budgetsList.innerHTML = recentBudgets.map(budget => `
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
        budgetsList.innerHTML = '<div class="no-budgets"><p>Error al cargar presupuestos</p></div>';
    }

    // Logout
    document.querySelector('.logout-item a').addEventListener('click', (e) => {
        e.preventDefault();
        sessionStorage.removeItem('currentAdmin');
        window.location.href = '../../index.html';
    });
});