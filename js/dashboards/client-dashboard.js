import { ClientService, ComputerService, BudgetService } from '../api-service.js';
import { MobileMenu } from '../utils/mobile-menu.js';

document.addEventListener('DOMContentLoaded', async function() {
    new MobileMenu();
    // Elementos del DOM
    const clientName = document.getElementById('client-name');
    const computersCount = document.getElementById('computers-count');
    const repairCount = document.getElementById('repair-count');
    const completedCount = document.getElementById('completed-count');
    const budgetsList = document.getElementById('budgets-list');
    const logoutLink = document.querySelector('.logout-item a'); 

    // Obtener datos del cliente desde sessionStorage
    const clientData = JSON.parse(sessionStorage.getItem('currentClient'));
    
    // Si no hay datos de cliente, redirigir al login
    if (!clientData) {
        window.location.href = '../../index.html';
        alert("Error: Debe ingresar un documento primero.");
        return;
    }

    // Cargar datos del cliente
    async function loadClientData() {
        try {
            // Mostrar nombre del cliente
            clientName.textContent = clientData.name || clientData.nombre;
            
            // Mostrar cantidad de computadoras
            const computers = clientData.computers || [];
            computersCount.textContent = computers.length;
            
            // Obtener presupuestos del cliente
            const budgets = await BudgetService.getByClient(clientData.id);
            
            // Calcular equipos en reparación y completados
            const inRepair = budgets.filter(b => b.status === 'EN_REPARACION').length;
            const completed = budgets.filter(b => b.status === 'COMPLETADO').length;
            
            repairCount.textContent = inRepair;
            completedCount.textContent = completed;
            
            // Mostrar últimos 2 presupuestos
            const recentBudgets = budgets.slice(0, 2);
            renderBudgets(recentBudgets);
            
        } catch (error) {
            console.error('Error cargando datos:', error);
            showError('Error al cargar los datos. Intente recargar la página.');
        }
    }

    // Renderizar presupuestos
    function renderBudgets(budgets) {
        if (!budgets || budgets.length === 0) {
            budgetsList.innerHTML = `
                <div class="no-budgets">
                    <i class="fas fa-file-alt"></i>
                    <p>No hay presupuestos recientes</p>
                </div>
            `;
            return;
        }

        budgetsList.innerHTML = budgets.map(budget => `
            <div class="budget-item">
                <div class="budget-info">
                    <h4>${budget.budgetNumber || 'Equipo no especificado'}</h4>
                    <p>Presupuesto #${budget.id} - ${formatDate(budget.createdAt)}</p>
                </div>
                <div>
                    <span class="budget-status status-${budget.status.toLowerCase()}">
                        ${formatStatus(budget.status)}
                    </span>
                </div>
            </div>
        `).join('');
    }

    // Formatear fecha
    function formatDate(dateString) {
        if (!dateString) return 'Fecha no disponible';
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES');
    }

    // Traducir estado
    function formatStatus(status) {
        const statusMap = {
            'PENDIENTE': 'Pendiente',
            'EN_REPARACION': 'En reparación',
            'COMPLETADO': 'Completado',
            'APROBADO': 'Aprobado',
            'RECHAZADO': 'Rechazado'
        };
        return statusMap[status] || status;
    }

    // Mostrar mensaje de error
    function showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        document.querySelector('.main-content').prepend(errorDiv);
    }

    // Manejar cierre de sesión
    function setupLogout() {
        logoutLink.addEventListener('click', function(e) {
            e.preventDefault(); // Evita la navegación directa
            sessionStorage.removeItem('currentClient'); // Elimina los datos del cliente
            window.location.href = '../../index.html'; // Redirige al login
        });
    }

    // Inicialización
    function init() {
        setupLogout();
        loadClientData();
        
    }

    init();
});