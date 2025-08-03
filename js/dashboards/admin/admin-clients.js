import { ClientService } from '../../api-service.js';
import { showError, showSuccess } from '../../utils/utils.js';
import { MobileMenu } from '../../utils/mobile-menu.js';

class ClientManager {
  constructor() {
    this.currentClient = null;
    this.init();
  }

  init() {
    if (!this.checkAdminAccess()) return;
    
    new MobileMenu();
    this.cacheElements();
    this.setupEventListeners();
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
      createForm: document.getElementById('client-create-form'),
      searchForm: document.getElementById('client-search-form'),
      searchResult: document.getElementById('client-search-result'),
      editForm: document.getElementById('client-edit-form'),
      cancelEditBtn: document.getElementById('cancel-edit-btn'),
      deleteBtn: document.getElementById('delete-client-btn'),
      newDniInput: document.getElementById('new-dni'),
      searchDniInput: document.getElementById('search-dni')
    };
  }

  setupEventListeners() {
    this.elements.createForm.addEventListener('submit', (e) => this.handleCreateSubmit(e));
    this.elements.searchForm.addEventListener('submit', (e) => this.handleSearchSubmit(e));
    this.elements.editForm.addEventListener('submit', (e) => this.handleEditSubmit(e));
    this.elements.cancelEditBtn.addEventListener('click', () => this.cancelEdit());
    this.elements.deleteBtn.addEventListener('click', () => this.deleteClient());

    this.setupDniInputValidation();
    this.setupLogout();
  }

  setupDniInputValidation() {
    [this.elements.newDniInput, this.elements.searchDniInput].forEach(input => {
      input.addEventListener('input', (e) => {
        e.target.value = e.target.value.replace(/[^0-9]/g, '');
        if (e.target.value.length > 8) {
          e.target.value = e.target.value.slice(0, 8);
        }
      });
    });
  }

  setupLogout() {
    document.querySelector('.logout-item a').addEventListener('click', (e) => {
      e.preventDefault();
      sessionStorage.removeItem('currentAdmin');
      window.location.href = '../../index.html';
    });
  }

  validateDNI(dni) {
    return /^\d{8}$/.test(dni);
  }

  validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(email);
  }

  async handleCreateSubmit(e) {
    e.preventDefault();
    const formData = this.getFormData(this.elements.createForm);
    
    if (!this.validateDNI(formData.dni)) {
      showError('El DNI debe contener exactamente 8 números', this.elements.createForm);
      return;
    }

    if (!this.validateEmail(formData.email)) {
      showError('Por favor ingrese un email válido (ejemplo: usuario@dominio.com)', this.elements.createForm);
      return;
    }

    try {
      await ClientService.create(formData);
      showSuccess('Cliente creado correctamente', this.elements.createForm);
      this.elements.createForm.reset();
    } catch (error) {
      showError('Error al crear cliente: ' + error.message, this.elements.createForm);
    }
  }

  async handleSearchSubmit(e) {
    e.preventDefault();
    const dni = this.elements.searchDniInput.value.trim();
    try {
      const client = await ClientService.getByDni(dni);
      if (!client) {
        this.showNotFound();
        return;
      }
      this.currentClient = client;
      this.showClientFound(client);
      this.showEditForm(client);
    } catch (error) {
      this.elements.searchResult.innerHTML = `<div class="error-message">${error.message}</div>`;
    }
  }

  showNotFound() {
    this.elements.searchResult.innerHTML = '<div class="error-message">Cliente no encontrado</div>';
    this.elements.editForm.style.display = 'none';
  }

  showClientFound(client) {
    this.elements.searchResult.innerHTML = `
      <div class="success-message">
        <i class="fas fa-user"></i>
        <span>${client.name} (${client.email})</span>
      </div>
    `;
  }

  showEditForm(client) {
    this.elements.editForm.style.display = 'block';
    document.getElementById('edit-name').value = client.name || '';
    document.getElementById('edit-email').value = client.email || '';
    document.getElementById('edit-cellphone').value = client.cellphone || '';
    document.getElementById('edit-address').value = client.address || '';
  }

  async handleEditSubmit(e) {
    e.preventDefault();
    if (!this.currentClient) return;

    const email = document.getElementById('edit-email').value.trim();
    if (!this.validateEmail(email)) {
      showError('Por favor ingrese un email válido (ejemplo: usuario@dominio.com)', this.elements.editForm);
      return;
    }

    try {
      await ClientService.update(this.currentClient.id, {
        name: document.getElementById('edit-name').value.trim(),
        email,
        cellphone: document.getElementById('edit-cellphone').value.trim(),
        address: document.getElementById('edit-address').value.trim(),
        dni: this.currentClient.dni
      });
      showSuccess('Cliente actualizado correctamente', this.elements.editForm);
    } catch (error) {
      showError('Error al actualizar cliente: ' + error.message, this.elements.editForm);
    }
  }

  cancelEdit() {
    this.elements.editForm.style.display = 'none';
  }

  async deleteClient() {
    if (!this.currentClient || !confirm('¿Está seguro que desea eliminar este cliente? Esta acción no se puede deshacer.')) return;
    try {
      await ClientService.delete(this.currentClient.id);
      showSuccess('Cliente eliminado correctamente', this.elements.editForm);
      this.elements.editForm.style.display = 'none';
      this.elements.searchResult.innerHTML = '';
      this.currentClient = null;
    } catch (error) {
      showError('Error al eliminar cliente: ' + error.message, this.elements.editForm);
    }
  }

  getFormData(form) {
    const inputs = form.querySelectorAll('input');
    const data = {};
    inputs.forEach(input => {
      data[input.id.replace('new-', '')] = input.value.trim();
    });
    return data;
  }
}

document.addEventListener('DOMContentLoaded', () => new ClientManager());