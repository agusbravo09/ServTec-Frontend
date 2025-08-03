import { BudgetService, ClientService, ComputerService, PartService, JobService } from '../../api-service.js';
import { showError, showSuccess } from '../../utils/utils.js';
import { MobileMenu } from '../../utils/mobile-menu.js';

class BudgetManager {
  constructor() {
    this.budgets = [];
    this.clients = [];
    this.computers = [];
    this.currentClient = null;
    this.currentStatusFilter = '';
    this.init();
  }

  async init() {
    if (!this.checkAdminAccess()) return;
    
    new MobileMenu();
    this.cacheElements();
    this.setupEventListeners();
    await this.loadData();
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
      budgetsList: document.getElementById('budgets-list'),
      searchBtn: document.getElementById('search-btn'),
      searchInput: document.getElementById('search-budget'),
      addBudgetBtn: document.getElementById('add-budget-btn'),
      addModal: document.getElementById('add-budget-modal'),
      editModal: document.getElementById('edit-budget-modal'),
      closeAddModalBtn: document.getElementById('close-add-modal'),
      closeEditModalBtn: document.getElementById('close-edit-modal'),
      budgetForm: document.getElementById('budget-form'),
      editBudgetForm: document.getElementById('edit-budget-form'),
      statusFilter: document.getElementById('status-filter')
    };
  }

  setupEventListeners() {
    this.elements.statusFilter.addEventListener('change', (e) => {
      this.currentStatusFilter = e.target.value;
      this.filterByStatus();
    });

    this.elements.searchBtn.addEventListener('click', () => this.searchBudgets());
    this.elements.searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.searchBudgets();
    });

    this.elements.addBudgetBtn.addEventListener('click', () => this.openAddModal());
    this.elements.closeAddModalBtn.addEventListener('click', () => this.closeModal(this.elements.addModal));
    this.elements.closeEditModalBtn.addEventListener('click', () => this.closeModal(this.elements.editModal));

    document.getElementById('search-client-btn').addEventListener('click', () => this.searchClient());
    document.getElementById('add-job-btn').addEventListener('click', () => this.addJobItem());
    document.getElementById('add-part-btn').addEventListener('click', () => this.addPartItem());

    document.addEventListener('input', (e) => {
      if (e.target.classList.contains('job-hours') || e.target.classList.contains('job-rate') || 
          e.target.classList.contains('part-quantity') || e.target.classList.contains('part-price')) {
        this.calculateTotals();
      }
    });

    this.elements.budgetForm.addEventListener('submit', (e) => this.handleBudgetSubmit(e));
    this.elements.editBudgetForm.addEventListener('submit', (e) => this.handleEditBudgetSubmit(e));

    window.addEventListener('click', (e) => {
      if (e.target === this.elements.addModal) this.closeModal(this.elements.addModal);
      if (e.target === this.elements.editModal) this.closeModal(this.elements.editModal);
    });

    document.querySelector('.logout-item a').addEventListener('click', (e) => {
      e.preventDefault();
      sessionStorage.removeItem('currentAdmin');
      window.location.href = '../../index.html';
    });
  }

  async loadData() {
    try {
      [this.budgets, this.clients, this.computers] = await Promise.all([
        BudgetService.getAll(),
        ClientService.getAll(),
        ComputerService.getAll()
      ]);
      this.renderBudgets(this.budgets);
    } catch (error) {
      showError('Error al cargar datos: ' + error.message, this.elements.budgetsList);
    }
  }

  renderBudgets(list) {
    const { budgetsList } = this.elements;
    budgetsList.innerHTML = '';

    if (!list?.length) {
      budgetsList.innerHTML = '<tr><td colspan="8" class="error-message">No se encontraron presupuestos</td></tr>';
      return;
    }

    list.forEach(budget => {
      const client = this.clients.find(c => c.id === budget.clientId);
      const computer = this.computers.find(c => c.id === budget.computerId);

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${budget.id}</td>
        <td>${client?.name || 'N/A'}</td>
        <td>${computer?.type || 'N/A'}</td>
        <td>${new Date(budget.emissionDate).toLocaleDateString()}</td>
        <td>${new Date(budget.validityDate).toLocaleDateString()}</td>
        <td class="status-${budget.status.toLowerCase()}">${budget.status}</td>
        <td>$${budget.totalAmount.toFixed(2)}</td>
        <td class="actions-cell">
          <button class="btn-edit" data-id="${budget.id}" title="Ver/Editar"><i class="fas fa-edit"></i></button>
          <button class="btn-delete" data-id="${budget.id}" title="Eliminar"><i class="fas fa-trash"></i></button>
        </td>
      `;
      budgetsList.appendChild(tr);

      tr.querySelector('.btn-edit').addEventListener('click', () => this.openEditModal(budget.id));
      tr.querySelector('.btn-delete').addEventListener('click', () => this.deleteBudget(budget.id));
    });
  }

  filterByStatus() {
    try {
      let filteredBudgets = [...this.budgets];
      if (this.currentStatusFilter) {
        filteredBudgets = filteredBudgets.filter(b => b.status === this.currentStatusFilter);
      }
      this.renderBudgets(filteredBudgets);
      if (!filteredBudgets.length) {
        showError('No hay presupuestos con este estado', this.elements.budgetsList);
      }
    } catch (error) {
      showError('Error al filtrar por estado: ' + error.message, this.elements.budgetsList);
    }
  }

  async searchBudgets() {
    const searchTerm = this.elements.searchInput.value.trim();
    if (!searchTerm) {
      this.filterByStatus();
      return;
    }

    try {
      let results = [];
      if (searchTerm.toUpperCase().startsWith('BGT-')) {
        const budget = await BudgetService.getById(searchTerm);
        if (budget) results = [budget];
      } else if (/^\d{8}$/.test(searchTerm)) {
        const client = await ClientService.getByDni(searchTerm);
        if (client) results = await BudgetService.getByClient(client.id);
      } else {
        results = this.budgets.filter(b => 
          b.budgetNumber.includes(searchTerm) || 
          this.clients.find(c => c.id === b.clientId)?.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      if (this.currentStatusFilter) {
        results = results.filter(b => b.status === this.currentStatusFilter);
      }

      this.renderBudgets(results);
      if (!results.length) {
        showError('No se encontraron presupuestos', this.elements.budgetsList);
      }
    } catch (error) {
      showError('Error al buscar: ' + error.message, this.elements.budgetsList);
    }
  }

  openAddModal() {
    this.openModal(this.elements.addModal);
    this.resetBudgetForm();
  }

  async searchClient() {
    const dni = document.getElementById('budget-client-dni').value.trim();
    if (!dni) {
      showError('Ingrese un DNI', this.elements.budgetForm);
      return;
    }

    try {
      const client = await ClientService.getByDni(dni);
      if (!client) {
        showError('Cliente no encontrado', this.elements.budgetForm);
        return;
      }

      this.currentClient = client;
      document.getElementById('budget-client-name').value = client.name;

      const computerSelect = document.getElementById('budget-computer');
      computerSelect.disabled = false;
      computerSelect.innerHTML = '<option value="">Seleccione computadora</option>';

      if (!client.computers.length) {
        showError('El cliente no tiene computadoras registradas', this.elements.budgetForm);
        return;
      }

      client.computers.forEach(computer => {
        const option = document.createElement('option');
        option.value = computer.id;
        option.textContent = `${computer.type} - ${computer.processor}`;
        computerSelect.appendChild(option);
      });

      showSuccess('Cliente encontrado', this.elements.budgetForm);
    } catch (error) {
      showError('Error al buscar cliente: ' + error.message, this.elements.budgetForm);
    }
  }

  addJobItem(description = '', hours = 1, rate = 500) {
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

    div.querySelector('.remove-job').addEventListener('click', () => {
      div.remove();
      this.calculateTotals();
    });
    this.calculateTotals();
  }

  addPartItem(description = '', quantity = 1, price = 0) {
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

    div.querySelector('.remove-part').addEventListener('click', () => {
      div.remove();
      this.calculateTotals();
    });
    this.calculateTotals();
  }

  calculateTotals() {
    let jobsTotal = 0;
    document.querySelectorAll('.job-item').forEach(item => {
      const hours = parseFloat(item.querySelector('.job-hours').value) || 0;
      const rate = parseFloat(item.querySelector('.job-rate').value) || 0;
      const subtotal = hours * rate;
      item.querySelector('.job-subtotal').value = subtotal.toFixed(2);
      jobsTotal += subtotal;
    });

    let partsTotal = 0;
    document.querySelectorAll('.part-item').forEach(item => {
      const quantity = parseInt(item.querySelector('.part-quantity').value) || 0;
      const price = parseFloat(item.querySelector('.part-price').value) || 0;
      const subtotal = quantity * price;
      item.querySelector('.part-subtotal').value = subtotal.toFixed(2);
      partsTotal += subtotal;
    });

    const total = jobsTotal + partsTotal;
    document.getElementById('total-jobs').value = jobsTotal.toFixed(2);
    document.getElementById('total-parts').value = partsTotal.toFixed(2);
    document.getElementById('total-budget').value = total.toFixed(2);
  }

  async handleBudgetSubmit(e) {
    e.preventDefault();
    if (!this.currentClient) {
      showError('Seleccione un cliente válido', this.elements.budgetForm);
      return;
    }

    const computerId = document.getElementById('budget-computer').value;
    if (!computerId) {
      showError('Seleccione una computadora', this.elements.budgetForm);
      return;
    }

    const jobs = Array.from(document.querySelectorAll('.job-item')).map(item => ({
      description: item.querySelector('.job-description').value,
      hours: parseFloat(item.querySelector('.job-hours').value),
      hourPrice: parseFloat(item.querySelector('.job-rate').value)
    }));

    const parts = Array.from(document.querySelectorAll('.part-item')).map(item => ({
      description: item.querySelector('.part-description').value,
      quantity: parseInt(item.querySelector('.part-quantity').value),
      unitPrice: parseFloat(item.querySelector('.part-price').value)
    }));

    const validityDays = document.getElementById('budget-validity').value;
    const issueDate = new Date();
    const expiryDate = new Date();
    expiryDate.setDate(issueDate.getDate() + parseInt(validityDays));

    const budgetData = {
      client: this.currentClient,
      computer: await ComputerService.getById(computerId),
      emissionDate: issueDate.toISOString().split('T')[0],
      validityDate: expiryDate.toISOString().split('T')[0],
      status: 'PENDIENTE',
      comments: document.getElementById('budget-notes').value,
      jobItems: jobs,
      partItems: parts,
      totalAmount: parseFloat(document.getElementById('total-budget').value)
    };

    try {
      await BudgetService.create(budgetData);
      showSuccess('Presupuesto creado correctamente', this.elements.budgetForm);
      this.resetBudgetForm();
      this.closeModal(this.elements.addModal);
      await this.loadData();
    } catch (error) {
      showError('Error al crear presupuesto: ' + error.message, this.elements.budgetForm);
    }
  }

  async handleEditBudgetSubmit(e) {
    e.preventDefault();
    const budgetId = this.elements.editModal.getAttribute('data-budget-id');
    const status = document.getElementById('edit-status').value;
    const comments = document.getElementById('edit-notes').value;
    const expiryDate = document.getElementById('edit-expiry-date').value;

    try {
      await BudgetService.update(budgetId, { status, comments, validityDate: expiryDate });
      showSuccess('Presupuesto actualizado correctamente', this.elements.editBudgetForm);
      this.closeModal(this.elements.editModal);
      await this.loadData();
      location.reload();
    } catch (error) {
      showError('Error al actualizar presupuesto: ' + error.message, this.elements.editBudgetForm);
    }
  }

  resetBudgetForm() {
    this.elements.budgetForm.reset();
    this.currentClient = null;
    document.getElementById('budget-client-name').value = '';
    document.getElementById('budget-computer').innerHTML = '<option value="">Seleccione computadora</option>';
    document.getElementById('budget-computer').disabled = true;
    document.getElementById('jobs-container').innerHTML = '';
    document.getElementById('parts-container').innerHTML = '';
    this.addJobItem();
    this.addPartItem();
  }

  openModal(modal) {
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }

  closeModal(modal) {
    modal.style.display = 'none';
    document.body.style.overflow = '';
  }

  async openViewModal(budgetId) {
    try {
      const [budget, jobsResponse, partsResponse] = await Promise.all([
        BudgetService.getById(budgetId),
        JobService.getByBudget(budgetId),
        PartService.getByBudget(budgetId)
      ]);

      const client = this.clients.find(c => c.id === budget.clientId);
      const computer = this.computers.find(c => c.id === budget.computerId);
      const jobs = Array.isArray(budget.jobs) ? budget.jobs : jobsResponse;
      const parts = Array.isArray(budget.parts) ? budget.parts : partsResponse;

      const formatDateForInput = (date) => {
        const d = new Date(date);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      };

      document.getElementById('budget-number').textContent = budget.budgetNumber;
      document.getElementById('edit-client-name').value = client?.name || 'N/A';
      document.getElementById('edit-computer-info').value = computer ? `${computer.type} - ${computer.processor}` : 'N/A';
      document.getElementById('edit-issue-date').value = new Date(budget.emissionDate + 'T00:00:00').toLocaleDateString();
      document.getElementById('edit-expiry-date').value = formatDateForInput(budget.validityDate);
      document.getElementById('edit-status').value = budget.status;
      document.getElementById('edit-notes').value = budget.comments || '';

      this.renderItems('edit-jobs-container', jobs, 'job');
      this.renderItems('edit-parts-container', parts, 'part');

      const jobsTotal = jobs.reduce((sum, job) => sum + (job.hours * job.hourPrice), 0);
      const partsTotal = parts.reduce((sum, part) => sum + (part.quantity * part.unitPrice), 0);

      document.getElementById('edit-total-jobs').value = jobsTotal.toFixed(2);
      document.getElementById('edit-total-parts').value = partsTotal.toFixed(2);
      document.getElementById('edit-total-budget').value = (jobsTotal + partsTotal).toFixed(2);

      this.elements.editModal.setAttribute('data-budget-id', budgetId);
      this.openModal(this.elements.editModal);
    } catch (error) {
      showError('Error al cargar presupuesto: ' + error.message, this.elements.budgetsList);
    }
  }

  renderItems(containerId, items, type) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';

    if (!items.length) {
      container.innerHTML = `<p class="no-items">No hay ${type === 'job' ? 'trabajos' : 'partes'} registrados</p>`;
      return;
    }

    items.forEach(item => {
      const div = document.createElement('div');
      div.className = `${type}-item`;
      div.innerHTML = `
        <div class="form-row">
          <div class="form-group">
            <label>Descripción</label>
            <input type="text" value="${item.description}" readonly>
          </div>
          <div class="form-group small">
            <label>${type === 'job' ? 'Horas' : 'Cantidad'}</label>
            <input type="number" value="${type === 'job' ? item.hours : item.quantity}" readonly>
          </div>
          <div class="form-group small">
            <label>${type === 'job' ? 'Precio/Hora' : 'Precio Unitario'}</label>
            <input type="number" value="${type === 'job' ? item.hourPrice : item.unitPrice}" readonly>
          </div>
          <div class="form-group small">
            <label>Subtotal</label>
            <input type="number" value="${item.amount}" readonly>
          </div>
        </div>
      `;
      container.appendChild(div);
    });
  }

  async openEditModal(budgetId) {
    await this.openViewModal(budgetId);
    document.getElementById('edit-status').disabled = false;
    document.getElementById('edit-notes').readOnly = false;
  }

  async deleteBudget(budgetId) {
    if (!confirm('¿Está seguro que desea eliminar este presupuesto?')) return;
    try {
      await BudgetService.delete(budgetId);
      showSuccess('Presupuesto eliminado correctamente', this.elements.budgetsList);
      await this.loadData();
    } catch (error) {
      showError('Error al eliminar presupuesto: ' + error.message, this.elements.budgetsList);
    }
  }
}

document.addEventListener('DOMContentLoaded', () => new BudgetManager());