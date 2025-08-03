import { ClientService, ComputerService } from '../../api-service.js';
import { showError } from '../../utils/utils.js';
import { MobileMenu } from '../../utils/mobile-menu.js';

class ClientDetailsManager {
  constructor() {
    this.clients = [];
    this.computers = [];
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
      clientsList: document.getElementById('clients-list'),
      searchBtn: document.getElementById('search-btn'),
      searchInput: document.getElementById('search-client')
    };
  }

  setupEventListeners() {
    this.elements.searchBtn.addEventListener('click', () => this.searchClients());
    this.elements.searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.searchClients();
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
      this.renderClients(this.clients);
    } catch (error) {
      showError('Error al cargar datos: ' + error.message, this.elements.clientsList);
    }
  }

  renderClients(list) {
    const { clientsList } = this.elements;
    clientsList.innerHTML = '';

    if (!list?.length) {
      clientsList.innerHTML = '<tr><td colspan="6" class="error-message">No se encontraron clientes</td></tr>';
      return;
    }

    list.forEach(client => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${client.dni}</td>
        <td>${client.name}</td>
        <td>${client.cellphone || 'N/A'}</td>
        <td>${client.email || 'N/A'}</td>
        <td>${client.address || 'N/A'}</td>
        <td>${client.computers?.length ? client.computers.length : 'Sin computadoras'} registradas</td>
      `;
      clientsList.appendChild(tr);
    });
  }

  searchClients() {
    const searchTerm = this.elements.searchInput.value.trim();
    if (!searchTerm) {
      this.renderClients(this.clients);
      return;
    }

    try {
      const results = this.clients.filter(client => client.dni.includes(searchTerm));
      this.renderClients(results.length ? results : []);
      if (!results.length) {
        showError('No se encontraron clientes con ese DNI', this.elements.clientsList);
      }
    } catch (error) {
      showError('Error al buscar: ' + error.message, this.elements.clientsList);
    }
  }
}

document.addEventListener('DOMContentLoaded', () => new ClientDetailsManager());