import { ComputerService, ClientService } from '../../api-service.js';
import { showError, showSuccess } from '../../utils/utils.js';
import { MobileMenu } from '../../utils/mobile-menu.js';

class ComputerManager {
  constructor() {
    this.computers = [];
    this.clients = [];
    this.init();
  }

  init() {
    if (!this.checkAdminAccess()) return;
    
    new MobileMenu();
    this.cacheElements();
    this.setupEventListeners();
    this.loadData();
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
      form: document.getElementById('computer-form'),
      editForm: document.getElementById('edit-modal-form'),
      computersList: document.getElementById('computers-list'),
      searchBtn: document.getElementById('search-btn'),
      searchDni: document.getElementById('search-dni'),
      addComputerBtn: document.getElementById('add-computer-btn'),
      addModal: document.getElementById('add-modal'),
      editModal: document.getElementById('edit-modal'),
      closeAddModalBtn: document.getElementById('close-add-modal'),
      closeEditModalBtn: document.getElementById('close-modal-btn'),
      dniInput: document.getElementById('comp-client-dni')
    };
  }

  setupEventListeners() {
    this.elements.form.addEventListener('submit', (e) => this.handleFormSubmit(e));
    this.elements.editForm.addEventListener('submit', (e) => this.handleEditSubmit(e));
    this.elements.searchBtn.addEventListener('click', () => this.searchComputers());
    this.elements.searchDni.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.searchComputers();
    });

    this.elements.addComputerBtn.addEventListener('click', () => this.openModal(this.elements.addModal));
    this.elements.closeAddModalBtn.addEventListener('click', () => this.closeModal(this.elements.addModal));
    this.elements.closeEditModalBtn.addEventListener('click', () => this.closeModal(this.elements.editModal));

    this.elements.dniInput.addEventListener('input', (e) => {
      e.target.value = e.target.value.replace(/[^0-9]/g, '');
      if (e.target.value.length > 8) {
        e.target.value = e.target.value.slice(0, 8);
      }
    });

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
      [this.clients, this.computers] = await Promise.all([
        ClientService.getAll(),
        ComputerService.getAll()
      ]);
      this.renderComputers(this.computers);
    } catch (error) {
      showError('Error al cargar datos: ' + error.message, this.elements.computersList);
    }
  }

  validateDNI(dni) {
    return /^\d{8}$/.test(dni);
  }

  async handleFormSubmit(e) {
    e.preventDefault();
    const dni = this.elements.dniInput.value.trim();

    if (!this.validateDNI(dni)) {
      showError('El DNI debe contener exactamente 8 números', this.elements.form);
      return;
    }

    try {
      const client = await ClientService.getByDni(dni);
      if (!client) {
        showError('Cliente no encontrado por DNI', this.elements.form);
        return;
      }

      const computerData = this.getComputerFormData();
      computerData.client = client;

      await ComputerService.create(computerData);
      showSuccess('Computadora creada correctamente', this.elements.form);
      this.elements.form.reset();
      this.closeModal(this.elements.addModal);
      setTimeout(() => window.location.reload(), 500);
    } catch (error) {
      showError('Error al crear computadora: ' + error.message, this.elements.form);
    }
  }

  getComputerFormData() {
    return {
      processor: document.getElementById('comp-processor').value,
      graphics: document.getElementById('comp-graphics').value,
      motherboard: document.getElementById('comp-motherboard').value,
      powerSupply: document.getElementById('comp-power').value,
      ram: document.getElementById('comp-ram').value,
      storage: document.getElementById('comp-storage').value,
      type: document.getElementById('comp-type').value
    };
  }

  async searchComputers() {
    const dni = this.elements.searchDni.value.trim();
    if (!dni) {
      await this.loadData();
      return;
    }

    try {
      const client = await ClientService.getByDni(dni);
      if (client?.id) {
        const filtered = await ComputerService.getByClient(client.id);
        this.renderComputers(filtered);
      } else {
        showError('Cliente no encontrado por DNI', this.elements.computersList);
        this.renderComputers([]);
      }
    } catch (error) {
      showError('Error al buscar: ' + error.message, this.elements.computersList);
    }
  }

  renderComputers(list) {
    const { computersList } = this.elements;
    computersList.innerHTML = '';

    if (!list?.length) {
      computersList.innerHTML = '<tr><td colspan="9" class="error-message">No se encontraron computadoras</td></tr>';
      return;
    }

    list.forEach(pc => {
      const client = this.clients.find(c => c.computers?.some(comp => comp.id === pc.id));
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${pc.processor}</td>
        <td>${pc.graphics}</td>
        <td>${pc.motherboard}</td>
        <td>${pc.powerSupply}</td>
        <td>${pc.ram}</td>
        <td>${pc.storage}</td>
        <td>${pc.type}</td>
        <td>${client?.name || 'N/A'}</td>
        <td class="actions-cell">
          <button class="btn-edit" data-id="${pc.id}" title="Editar"><i class="fas fa-edit"></i></button>
          <button class="btn-delete" data-id="${pc.id}" title="Eliminar"><i class="fas fa-trash"></i></button>
        </td>
      `;
      computersList.appendChild(tr);

      tr.querySelector('.btn-edit').addEventListener('click', () => this.openEditModal(pc));
      tr.querySelector('.btn-delete').addEventListener('click', () => this.deleteComputer(pc.id));
    });
  }

  openEditModal(pc) {
    const fields = ['processor', 'graphics', 'motherboard', 'power', 'ram', 'storage', 'type'];
    fields.forEach(field => {
      document.getElementById(`edit-${field}`).value = pc[field === 'power' ? 'powerSupply' : field];
    });
    this.elements.editModal.setAttribute('data-edit-id', pc.id);
    this.openModal(this.elements.editModal);
  }

  async handleEditSubmit(e) {
    e.preventDefault();
    const editId = this.elements.editModal.getAttribute('data-edit-id');
    if (!editId) return;

    const computerData = this.getEditFormData();
    try {
      await ComputerService.update(editId, computerData);
      showSuccess('Computadora actualizada correctamente', this.elements.editModal);
      this.closeModal(this.elements.editModal);
      await this.loadData();
      location.reload();
    } catch (error) {
      showError('Error al actualizar computadora: ' + error.message, this.elements.editModal);
    }
  }

  getEditFormData() {
    return {
      processor: document.getElementById('edit-processor').value,
      graphics: document.getElementById('edit-graphics').value,
      motherboard: document.getElementById('edit-motherboard').value,
      powerSupply: document.getElementById('edit-power').value,
      ram: document.getElementById('edit-ram').value,
      storage: document.getElementById('edit-storage').value,
      type: document.getElementById('edit-type').value
    };
  }

  async deleteComputer(id) {
    if (!confirm('¿Está seguro que desea eliminar esta computadora?')) return;
    try {
      await ComputerService.delete(id);
      showSuccess('Computadora eliminada correctamente', this.elements.computersList);
      await this.loadData();
    } catch (error) {
      showError('Error al eliminar: ' + error.message, this.elements.computersList);
    }
  }

  openModal(modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  closeModal(modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
}

document.addEventListener('DOMContentLoaded', () => new ComputerManager());