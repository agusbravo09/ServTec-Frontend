import { ClientService } from '../api-service.js';
import { showError, showSuccess } from '../utils/utils.js';

export class ClientDataManager {
    constructor() {
        this.elements = {
            menuToggle: document.getElementById('menuToggle'),
            sidebar: document.getElementById('sidebar'),
            overlay: document.getElementById('sidebarOverlay'),
            logoutLink: document.querySelector('.logout-item a'),
            clientFullname: document.getElementById('client-fullname'),
            clientEmail: document.getElementById('client-email'),
            clientDni: document.getElementById('client-dni'),
            clientCellphone: document.getElementById('client-cellphone'),
            clientAddress: document.getElementById('client-address'),
            editClientBtn: document.getElementById('edit-client-btn'),
            cancelEditBtn: document.getElementById('cancel-edit-btn'),
            editForm: document.getElementById('client-edit-form'),
            editName: document.getElementById('edit-name'),
            editEmail: document.getElementById('edit-email'),
            editCellphone: document.getElementById('edit-cellphone'),
            editAddress: document.getElementById('edit-address')
        };

        // Asegurarnos de que clientData siempre sea un objeto
        this.clientData = JSON.parse(sessionStorage.getItem('currentClient')) || {};
        this.init();
    }

    async init() {
        if (!this.clientData.id) return this.redirectToLogin();

        this.setupMobileMenu();
        this.setupLogout();
        this.loadClientData();
        this.setupEventListeners();

        if (window.innerWidth > 768) {
            this.elements.sidebar.classList.add('active');
        }
    }

    redirectToLogin() {
        window.location.href = '../../index.html';
        alert("Error: Debe ingresar un documento primero.");
    }

    loadClientData() {
        try {
            const { clientData, elements } = this;
            
            // Usamos el operador de encadenamiento opcional y valores por defecto
            elements.clientFullname.textContent = clientData?.name || 'No especificado';
            elements.clientDni.textContent = clientData?.dni || 'No especificado';
            elements.clientCellphone.textContent = clientData?.cellphone || 'No especificado';
            elements.clientAddress.textContent = clientData?.address || 'No especificado';
            elements.clientEmail.textContent = clientData?.email || 'No especificado';
        } catch (error) {
            console.error('Error cargando datos:', error);
        }
    }

    toggleEditForm(show) {
        const { editForm, editClientBtn } = this.elements;
        
        if (show) {
            // Usamos valores por defecto para evitar undefined
            this.elements.editName.value = this.clientData?.name || '';
            this.elements.editEmail.value = this.clientData?.email || '';
            this.elements.editCellphone.value = this.clientData?.cellphone || '';
            this.elements.editAddress.value = this.clientData?.address || '';
            
            editForm.classList.add('active');
            if (editClientBtn) editClientBtn.style.display = 'none';
        } else {
            editForm.classList.remove('active');
            if (editClientBtn) editClientBtn.style.display = 'inline-flex';
        }
    }

    async handleEditSubmit(e) {
        e.preventDefault();
        const { editClientBtn, editName, editEmail, editCellphone, editAddress } = this.elements;

        if (!editClientBtn || !this.clientData?.id) return;

        try {
            // Mostrar estado de carga
            editClientBtn.disabled = true;
            editClientBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Actualizando...';

            const updatedData = {
                name: editName?.value || '',
                email: editEmail?.value || '',
                cellphone: editCellphone?.value || '',
                address: editAddress?.value || '',
                dni: this.clientData.dni || '',
                id: this.clientData.id
            };

            await ClientService.update(this.clientData.id, updatedData);
            const refreshedClient = await ClientService.getById(this.clientData.id);

            if (!refreshedClient) throw new Error('No se pudo obtener datos actualizados');

            this.clientData = { ...refreshedClient, computers: this.clientData.computers || [] };
            sessionStorage.setItem('currentClient', JSON.stringify(this.clientData));

            this.loadClientData();
            this.toggleEditForm(false);
            showSuccess('Datos actualizados correctamente');

        } catch (error) {
            console.error('Error en actualización:', error);
            showError(error.message || 'Error al actualizar los datos');
            await this.loadFallbackData();
        } finally {
            editClientBtn.disabled = false;
            editClientBtn.innerHTML = '<i class="fas fa-edit"></i> Editar datos';
        }
    }

    async loadFallbackData() {
        try {
            if (!this.clientData?.id) return;
            
            const fallbackData = await ClientService.getById(this.clientData.id);
            if (fallbackData) {
                sessionStorage.setItem('currentClient', JSON.stringify(fallbackData));
                this.clientData = fallbackData;
                this.loadClientData();
            }
        } catch (err) {
            console.error('Error al recuperar datos:', err);
        }
    }

    setupEventListeners() {
        const { editClientBtn, cancelEditBtn, editForm } = this.elements;
        
        editClientBtn?.addEventListener('click', () => this.toggleEditForm(true));
        cancelEditBtn?.addEventListener('click', () => this.toggleEditForm(false));
        editForm?.addEventListener('submit', (e) => this.handleEditSubmit(e));
    }

    setupMobileMenu() {
        const { menuToggle, sidebar, overlay } = this.elements;
        
        menuToggle?.addEventListener('click', () => {
            sidebar?.classList.toggle('active');
            overlay?.classList.toggle('active');
        });

        overlay?.addEventListener('click', () => {
            sidebar?.classList.remove('active');
            overlay?.classList.remove('active');
        });
    }

    setupLogout() {
        this.elements.logoutLink?.addEventListener('click', (e) => {
            e.preventDefault();
            sessionStorage.removeItem('currentClient');
            window.location.href = '../../index.html';
        });
    }
}

document.addEventListener('DOMContentLoaded', () => new ClientDataManager());