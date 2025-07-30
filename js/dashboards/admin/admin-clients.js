import { ClientService } from '../../api-service.js';
import { showError, showSuccess } from '../../utils/utils.js';
import { MobileMenu } from '../../utils/mobile-menu.js';

document.addEventListener('DOMContentLoaded', () => {
    // Control de acceso: solo administradores
    const currentUser = sessionStorage.getItem('currentAdmin');
    if (!currentUser) {
        alert("Error: Debe iniciar sesión como administrador.");
        window.location.href = 'admin.html';
        return;
    }

    new MobileMenu();

    // Carga de cliente
    const createForm = document.getElementById('client-create-form');
    createForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('new-name').value.trim();
        const dni = document.getElementById('new-dni').value.trim();
        const email = document.getElementById('new-email').value.trim();
        const cellphone = document.getElementById('new-cellphone').value.trim();
        const address = document.getElementById('new-address').value.trim();

        try {
            await ClientService.create({ name, dni, email, cellphone, address });
            showSuccess('Cliente creado correctamente', createForm);
            createForm.reset();
        } catch (error) {
            showError('Error al crear cliente: ' + error.message, createForm);
        }
    });

    // Consulta por DNI
    const searchForm = document.getElementById('client-search-form');
    const searchResult = document.getElementById('client-search-result');
    let currentClient = null;

    searchForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const dni = document.getElementById('search-dni').value.trim();
        try {
            const client = await ClientService.getByDni(dni);
            if (!client) {
                searchResult.innerHTML = '<div class="error-message">Cliente no encontrado</div>';
                document.getElementById('client-edit-form').style.display = 'none';
                return;
            }
            currentClient = client;
            searchResult.innerHTML = `
                <div class="success-message">
                    <i class="fas fa-user"></i>
                    <span>${client.name} (${client.email})</span>
                </div>
            `;
            // Mostrar formulario de edición
            showEditForm(client);
        } catch (error) {
            searchResult.innerHTML = `<div class="error-message">${error.message}</div>`;
        }
    });

    // Edición y baja
    const editForm = document.getElementById('client-edit-form');
    const cancelEditBtn = document.getElementById('cancel-edit-btn');
    const deleteBtn = document.getElementById('delete-client-btn');

    function showEditForm(client) {
        editForm.style.display = 'block';
        document.getElementById('edit-name').value = client.name || '';
        document.getElementById('edit-email').value = client.email || '';
        document.getElementById('edit-cellphone').value = client.cellphone || '';
        document.getElementById('edit-address').value = client.address || '';
    }

    editForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!currentClient) return;
        try {
            await ClientService.update(currentClient.id, {
                name: document.getElementById('edit-name').value.trim(),
                email: document.getElementById('edit-email').value.trim(),
                cellphone: document.getElementById('edit-cellphone').value.trim(),
                address: document.getElementById('edit-address').value.trim(),
                dni: currentClient.dni
            });
            showSuccess('Cliente actualizado correctamente', editForm);
        } catch (error) {
            showError('Error al actualizar cliente: ' + error.message, editForm);
        }
    });

    cancelEditBtn.addEventListener('click', () => {
        editForm.style.display = 'none';
    });

    deleteBtn.addEventListener('click', async () => {
        if (!currentClient) return;
        if (!confirm('¿Está seguro que desea eliminar este cliente? Esta acción no se puede deshacer.')) return;
        try {
            await ClientService.delete(currentClient.id);
            showSuccess('Cliente eliminado correctamente', editForm);
            editForm.style.display = 'none';
            searchResult.innerHTML = '';
            currentClient = null; // <-- Asegura que el cliente actual se borre
        } catch (error) {
            showError('Error al eliminar cliente: ' + error.message, editForm);
        }
    });

    // Logout
    document.querySelector('.logout-item a').addEventListener('click', (e) => {
        e.preventDefault();
        sessionStorage.removeItem('currentAdmin');
        window.location.href = '../../index.html';
    });
});