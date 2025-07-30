import { BudgetService, ClientService, ComputerService, PartService, JobService } from '../../api-service.js';
import { showError, showSuccess } from '../../utils/utils.js';
import { MobileMenu } from '../../utils/mobile-menu.js';

document.addEventListener('DOMContentLoaded', () => {
    new MobileMenu();

    // Elementos principales
    const budgetsList = document.getElementById('budgets-list');
    const searchBtn = document.getElementById('search-btn');
    const searchInput = document.getElementById('search-budget');
    const addBudgetBtn = document.getElementById('add-budget-btn');

    // Elementos de modales
    const addModal = document.getElementById('add-budget-modal');
    const editModal = document.getElementById('edit-budget-modal');
    const closeAddModalBtn = document.getElementById('close-add-modal');
    const closeEditModalBtn = document.getElementById('close-edit-modal');

    // Formularios
    const budgetForm = document.getElementById('budget-form');
    const editBudgetForm = document.getElementById('edit-budget-form');

    // Variables de estado
    let budgets = [];
    let clients = [];
    let computers = [];
    let currentClient = null;

    // Inicializar
    loadData();

    // Cargar datos iniciales
    async function loadData() {
        try {
            budgets = await BudgetService.getAll();
            clients = await ClientService.getAll();
            computers = await ComputerService.getAll();
            renderBudgets(budgets);
        } catch (error) {
            showError('Error al cargar datos: ' + error.message, budgetsList);
        }
    }

    // Renderizar presupuestos en tabla
    function renderBudgets(list) {
        budgetsList.innerHTML = '';

        if (!list || list.length === 0) {
            budgetsList.innerHTML = '<tr><td colspan="8" class="error-message">No se encontraron presupuestos</td></tr>';
            return;
        }

        list.forEach(budget => {
            const client = clients.find(c => c.id === budget.clientId);
            const computer = computers.find(c => c.id === budget.computerId);

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${budget.budgetNumber}</td>
                <td>${client ? client.name : 'N/A'}</td>
                <td>${computer ? computer.type : 'N/A'}</td>
                <td>${new Date(budget.emissionDate).toLocaleDateString()}</td>
                <td>${new Date(budget.validityDate).toLocaleDateString()}</td>
                <td class="status-${budget.status.toLowerCase()}">${budget.status}</td>
                <td>$${budget.totalAmount.toFixed(2)}</td>
                <td class="actions-cell">
                    <button class="btn-view" data-id="${budget.id}" title="Ver"><i class="fas fa-eye"></i></button>
                    <button class="btn-edit" data-id="${budget.id}" title="Editar"><i class="fas fa-edit"></i></button>
                    <button class="btn-delete" data-id="${budget.id}" title="Eliminar"><i class="fas fa-trash"></i></button>
                </td>
            `;
            budgetsList.appendChild(tr);

            // Event listeners para botones de acción
            tr.querySelector('.btn-view').addEventListener('click', () => openViewModal(budget.id));
            tr.querySelector('.btn-edit').addEventListener('click', () => openEditModal(budget.id));
            tr.querySelector('.btn-delete').addEventListener('click', () => deleteBudget(budget.id));
        });
    }

    // Buscar presupuestos
    searchBtn.addEventListener('click', async () => {
        const searchTerm = searchInput.value.trim();
        
        if (!searchTerm) {
            await loadData();
            return;
        }

        try {
            // Buscar por número de presupuesto o DNI de cliente
            let results = [];
            
            // Si parece un número de presupuesto (BGT-001)
            if (searchTerm.toUpperCase().startsWith('BGT-')) {
                const budget = await BudgetService.getById(searchTerm);
                if (budget) results = [budget];
            } 
            // Si es un DNI (8 números)
            else if (/^\d{8}$/.test(searchTerm)) {
                const client = await ClientService.getByDni(searchTerm);
                if (client) {
                    results = await BudgetService.getByClient(client.id);
                }
            }
            // Búsqueda genérica
            else {
                results = budgets.filter(b => 
                    b.number.includes(searchTerm) ||
                    (clients.find(c => c.id === b.clientId)?.name.toLowerCase().includes(searchTerm.toLowerCase()))
                );
            }

            renderBudgets(results.length > 0 ? results : []);
            
            if (results.length === 0) {
                showError('No se encontraron presupuestos', budgetsList);
            }
        } catch (error) {
            showError('Error al buscar: ' + error.message, budgetsList);
        }
    });

    // Abrir modal para nuevo presupuesto
    addBudgetBtn.addEventListener('click', () => {
        openModal(addModal);
        resetBudgetForm();
    });

    // Buscar cliente por DNI
    document.getElementById('search-client-btn').addEventListener('click', async () => {
        const dni = document.getElementById('budget-client-dni').value.trim();
        
        if (!dni) {
            showError('Ingrese un DNI', budgetForm);
            return;
        }

        try {
            const client = await ClientService.getByDni(dni);
            if (!client) {
                showError('Cliente no encontrado', budgetForm);
                return;
            }

            currentClient = client;
            document.getElementById('budget-client-name').value = client.name;
            
            // Habilitar y cargar computadoras del cliente
            const computerSelect = document.getElementById('budget-computer');
            computerSelect.disabled = false;
            computerSelect.innerHTML = '<option value="">Seleccione computadora</option>';

            console.log(computers);
            console.log(client);

        
            const filterClient = client.computers.some(comp => comp.id === client.id);

            console.log(filterClient);
            
            const clientComputers = computers.filter(c => client.computers.some(comp => comp.id === client.id));
            if (clientComputers.length === 0) {
                showError('El cliente no tiene computadoras registradas', budgetForm);
                return;
            }

            clientComputers.forEach(computer => {
                const option = document.createElement('option');
                option.value = computer.id;
                option.textContent = `${computer.type} - ${computer.processor}`;
                computerSelect.appendChild(option);
            });

            showSuccess('Cliente encontrado', budgetForm);
        } catch (error) {
            showError('Error al buscar cliente: ' + error.message, budgetForm);
        }
    });

    // Agregar item de trabajo
    document.getElementById('add-job-btn').addEventListener('click', () => {
        addJobItem();
    });

    // Agregar parte/repuesto
    document.getElementById('add-part-btn').addEventListener('click', () => {
        addPartItem();
    });

    // Calcular totales cuando cambian los valores
    document.addEventListener('input', (e) => {
        if (e.target.classList.contains('job-hours') || 
            e.target.classList.contains('job-rate') ||
            e.target.classList.contains('part-quantity') || 
            e.target.classList.contains('part-price')) {
            calculateTotals();
        }
    });

    // Enviar formulario de nuevo presupuesto
    budgetForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const computerId = document.getElementById('budget-computer').value;
        const validityDays = document.getElementById('budget-validity').value;
        const notes = document.getElementById('budget-notes').value;

        if (!currentClient) {
            showError('Seleccione un cliente válido', budgetForm);
            return;
        }

        if (!computerId) {
            showError('Seleccione una computadora', budgetForm);
            return;
        }

        // Recolectar trabajos
        const jobs = [];
        document.querySelectorAll('.job-item').forEach(item => {
            jobs.push({
                description: item.querySelector('.job-description').value,
                hours: parseFloat(item.querySelector('.job-hours').value),
                rate: parseFloat(item.querySelector('.job-rate').value)
            });
        });

        // Recolectar partes
        const parts = [];
        document.querySelectorAll('.part-item').forEach(item => {
            parts.push({
                description: item.querySelector('.part-description').value,
                quantity: parseInt(item.querySelector('.part-quantity').value),
                unitPrice: parseFloat(item.querySelector('.part-price').value)
            });
        });

        // Calcular fechas
        const issueDate = new Date();
        const expiryDate = new Date();
        expiryDate.setDate(issueDate.getDate() + parseInt(validityDays));

        // Crear objeto presupuesto
        const budgetData = {
            clientId: currentClient.id,
            computerId: computerId,
            issueDate: issueDate.toISOString(),
            expiryDate: expiryDate.toISOString(),
            status: 'Pendiente',
            notes: notes,
            jobs: jobs,
            parts: parts,
            totalAmount: parseFloat(document.getElementById('total-budget').value)
        };

        try {
            await BudgetService.create(budgetData);
            showSuccess('Presupuesto creado correctamente', budgetForm);
            resetBudgetForm();
            closeModal(addModal);
            await loadData(); // Recargar la lista
        } catch (error) {
            showError('Error al crear presupuesto: ' + error.message, budgetForm);
        }
    });

    // Enviar formulario de edición
    editBudgetForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const budgetId = editModal.getAttribute('data-budget-id');
        const status = document.getElementById('edit-status').value;
        const notes = document.getElementById('edit-notes').value;

        try {
            await BudgetService.update(budgetId, { status, notes });
            showSuccess('Presupuesto actualizado correctamente', editBudgetForm);
            closeModal(editModal);
            await loadData();
        } catch (error) {
            showError('Error al actualizar presupuesto: ' + error.message, editBudgetForm);
        }
    });

    // Imprimir presupuesto
    document.getElementById('print-budget-btn').addEventListener('click', () => {
        window.print();
    });

    // Funciones auxiliares
    function openModal(modal) {
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }

    function closeModal(modal) {
        modal.style.display = 'none';
        document.body.style.overflow = '';
    }

    function resetBudgetForm() {
        budgetForm.reset();
        currentClient = null;
        document.getElementById('budget-client-name').value = '';
        document.getElementById('budget-computer').innerHTML = '<option value="">Seleccione computadora</option>';
        document.getElementById('budget-computer').disabled = true;
        document.getElementById('jobs-container').innerHTML = '';
        document.getElementById('parts-container').innerHTML = '';
        addJobItem(); // Agregar un item de trabajo por defecto
        addPartItem(); // Agregar un item de parte por defecto
    }

    function addJobItem(description = '', hours = 1, rate = 500) {
        const container = document.getElementById('jobs-container');
        const div = document.createElement('div');
        div.className = 'job-item';
        div.innerHTML = `
            <div class="form-row">
                <div class="form-group">
                    <label>Descripción</label>
                    <input type="text" class="job-description" value="${description}" required>
                </div>
                <div class="form-group small">
                    <label>Horas</label>
                    <input type="number" class="job-hours" min="0" step="0.5" value="${hours}" required>
                </div>
                <div class="form-group small">
                    <label>Precio/Hora</label>
                    <input type="number" class="job-rate" min="0" value="${rate}" required>
                </div>
                <div class="form-group small">
                    <label>Subtotal</label>
                    <input type="number" class="job-subtotal" readonly>
                </div>
                <button type="button" class="btn-delete remove-job"><i class="fas fa-trash"></i></button>
            </div>
        `;
        container.appendChild(div);

        // Event listener para eliminar
        div.querySelector('.remove-job').addEventListener('click', () => {
            div.remove();
            calculateTotals();
        });

        calculateTotals();
    }

    function addPartItem(description = '', quantity = 1, price = 0) {
        const container = document.getElementById('parts-container');
        const div = document.createElement('div');
        div.className = 'part-item';
        div.innerHTML = `
            <div class="form-row">
                <div class="form-group">
                    <label>Descripción</label>
                    <input type="text" class="part-description" value="${description}" required>
                </div>
                <div class="form-group small">
                    <label>Cantidad</label>
                    <input type="number" class="part-quantity" min="1" value="${quantity}" required>
                </div>
                <div class="form-group small">
                    <label>Precio Unitario</label>
                    <input type="number" class="part-price" min="0" value="${price}" required>
                </div>
                <div class="form-group small">
                    <label>Subtotal</label>
                    <input type="number" class="part-subtotal" readonly>
                </div>
                <button type="button" class="btn-delete remove-part"><i class="fas fa-trash"></i></button>
            </div>
        `;
        container.appendChild(div);

        // Event listener para eliminar
        div.querySelector('.remove-part').addEventListener('click', () => {
            div.remove();
            calculateTotals();
        });

        calculateTotals();
    }

    function calculateTotals() {
        // Calcular subtotales de trabajos
        let jobsTotal = 0;
        document.querySelectorAll('.job-item').forEach(item => {
            const hours = parseFloat(item.querySelector('.job-hours').value) || 0;
            const rate = parseFloat(item.querySelector('.job-rate').value) || 0;
            const subtotal = hours * rate;
            item.querySelector('.job-subtotal').value = subtotal.toFixed(2);
            jobsTotal += subtotal;
        });

        // Calcular subtotales de partes
        let partsTotal = 0;
        document.querySelectorAll('.part-item').forEach(item => {
            const quantity = parseInt(item.querySelector('.part-quantity').value) || 0;
            const price = parseFloat(item.querySelector('.part-price').value) || 0;
            const subtotal = quantity * price;
            item.querySelector('.part-subtotal').value = subtotal.toFixed(2);
            partsTotal += subtotal;
        });

        // Calcular total general
        const total = jobsTotal + partsTotal;

        // Actualizar totales
        document.getElementById('total-jobs').value = jobsTotal.toFixed(2);
        document.getElementById('total-parts').value = partsTotal.toFixed(2);
        document.getElementById('total-budget').value = total.toFixed(2);
    }

    async function openViewModal(budgetId) {
    try {
        const budget = await BudgetService.getById(budgetId);
        const client = clients.find(c => c.id === budget.clientId);
        const computer = computers.find(c => c.id === budget.computerId);
        
        // Obtener trabajos y partes - versión corregida
        let jobs = [];
        let parts = [];
        
        // Verificar si los jobs vienen en el budget o hay que pedirlos por separado
        if (budget.jobs && Array.isArray(budget.jobs)) {
            jobs = budget.jobs;
        } else {
            // Si no vienen en el budget, hacer request separado
            const jobsResponse = await JobService.getByBudget(budgetId);
            jobs = Array.isArray(jobsResponse) ? jobsResponse : [];
        }
        
        // Verificar si las parts vienen en el budget o hay que pedirlas por separado
        if (budget.parts && Array.isArray(budget.parts)) {
            parts = budget.parts;
        } else {
            // Si no vienen en el budget, hacer request separado
            const partsResponse = await PartService.getByBudget(budgetId);
            parts = Array.isArray(partsResponse) ? partsResponse : [];
        }

        // Llenar datos básicos
        document.getElementById('budget-number').textContent = budget.budgetNumber;
        document.getElementById('edit-client-name').value = client ? client.name : 'N/A';
        document.getElementById('edit-computer-info').value = computer ? `${computer.type} - ${computer.processor}` : 'N/A';
        document.getElementById('edit-issue-date').value = new Date(budget.emissionDate).toLocaleDateString();
        document.getElementById('edit-expiry-date').value = new Date(budget.validityDate).toLocaleDateString();
        document.getElementById('edit-status').value = budget.status;
        document.getElementById('edit-notes').value = budget.notes || '';

        // Llenar trabajos
        const jobsContainer = document.getElementById('edit-jobs-container');
        jobsContainer.innerHTML = '';
        
        if (jobs.length > 0) {
            jobs.forEach(job => {
                const div = document.createElement('div');
                div.className = 'job-item';
                div.innerHTML = `
                    <div class="form-row">
                        <div class="form-group">
                            <label>Descripción</label>
                            <input type="text" value="${job.description}" readonly>
                        </div>
                        <div class="form-group small">
                            <label>Horas</label>
                            <input type="number" value="${job.hours}" readonly>
                        </div>
                        <div class="form-group small">
                            <label>Precio/Hora</label>
                            <input type="number" value="${job.hourPrice}" readonly>
                        </div>
                        <div class="form-group small">
                            <label>Subtotal</label>
                            <input type="number" value="${job.amount}" readonly>
                        </div>
                    </div>
                `;
                jobsContainer.appendChild(div);
            });
        } else {
            jobsContainer.innerHTML = '<p class="no-items">No hay trabajos registrados</p>';
        }

        // Llenar partes
        const partsContainer = document.getElementById('edit-parts-container');
        partsContainer.innerHTML = '';
        
        if (parts.length > 0) {
            parts.forEach(part => {
                const div = document.createElement('div');
                div.className = 'part-item';
                div.innerHTML = `
                    <div class="form-row">
                        <div class="form-group">
                            <label>Descripción</label>
                            <input type="text" value="${part.description}" readonly>
                        </div>
                        <div class="form-group small">
                            <label>Cantidad</label>
                            <input type="number" value="${part.quantity}" readonly>
                        </div>
                        <div class="form-group small">
                            <label>Precio Unitario</label>
                            <input type="number" value="${part.unitPrice}" readonly>
                        </div>
                        <div class="form-group small">
                            <label>Subtotal</label>
                            <input type="number" value="${part.amount}" readonly>
                        </div>
                    </div>
                `;
                partsContainer.appendChild(div);
            });
        } else {
            partsContainer.innerHTML = '<p class="no-items">No hay partes registradas</p>';
        }

        // Actualizar totales
        const jobsTotal = jobs.reduce((sum, job) => sum + (job.hours * job.rate), 0);
        const partsTotal = parts.reduce((sum, part) => sum + (part.quantity * part.unitPrice), 0);
        
        document.getElementById('edit-total-jobs').value = jobsTotal.toFixed(2);
        document.getElementById('edit-total-parts').value = partsTotal.toFixed(2);
        document.getElementById('edit-total-budget').value = (jobsTotal + partsTotal).toFixed(2);

        // Configurar modal
        editModal.setAttribute('data-budget-id', budgetId);
        openModal(editModal);
    } catch (error) {
        console.error('Error detallado:', error);
        showError('Error al cargar presupuesto: ' + error.message, budgetsList);
    }
}

    async function openEditModal(budgetId) {
        await openViewModal(budgetId); // Reutilizamos la misma función
        document.getElementById('edit-status').disabled = false;
        document.getElementById('edit-notes').readOnly = false;
    }

    async function deleteBudget(budgetId) {
        if (!confirm('¿Está seguro que desea eliminar este presupuesto?')) return;
        
        try {
            await BudgetService.delete(budgetId);
            showSuccess('Presupuesto eliminado correctamente', budgetsList);
            await loadData();
        } catch (error) {
            showError('Error al eliminar presupuesto: ' + error.message, budgetsList);
        }
    }

    // Cerrar modales al hacer clic fuera
    window.addEventListener('click', (e) => {
        if (e.target === addModal) closeModal(addModal);
        if (e.target === editModal) closeModal(editModal);
    });

    // Cerrar modales con botones
    closeAddModalBtn.addEventListener('click', () => closeModal(addModal));
    closeEditModalBtn.addEventListener('click', () => closeModal(editModal));

    // Permitir búsqueda con Enter
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') searchBtn.click();
    });
});