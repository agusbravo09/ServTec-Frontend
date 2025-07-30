import { ClientService } from '../api-service.js';

document.addEventListener('DOMContentLoaded', async function () {
    // Elementos del DOM
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    const logoutLink = document.querySelector('.logout-item a');

    // Elementos de visualización de datos
    const clientFullname = document.getElementById('client-fullname');
    const clientEmail = document.getElementById('client-email');
    const clientDni = document.getElementById('client-dni');
    const clientCellphone = document.getElementById('client-cellphone');
    const clientAddress = document.getElementById('client-address');
    const clientLocation = document.getElementById('client-location');

    // Elementos del formulario de edición
    const editClientBtn = document.getElementById('edit-client-btn');
    const cancelEditBtn = document.getElementById('cancel-edit-btn');
    const editForm = document.getElementById('client-edit-form');
    const editName = document.getElementById('edit-name');
    const editEmail = document.getElementById('edit-email');
    const editCellphone = document.getElementById('edit-cellphone');
    const editAddress = document.getElementById('edit-address');
    const editLocation = document.getElementById('edit-location');

    // Obtener datos del cliente desde sessionStorage
    let clientData = JSON.parse(sessionStorage.getItem('currentClient'));

    if (!clientData) {
        window.location.href = '../../index.html';
        alert("Error: Debe ingresar un documento primero.");
        return;
    }

    // Cargar datos del cliente en la vista
    function loadClientData() {
        try {
            clientFullname.textContent = clientData.name || 'No especificado';
            clientDni.textContent = clientData.dni || 'No especificado';
            clientCellphone.textContent = clientData.cellphone || 'No especificado';
            clientAddress.textContent = clientData.address || 'No especificado';
            clientEmail.textContent = clientData.email || 'No especificado'; // Movido aquí

        } catch (error) {
            console.error('Error cargando datos:', error);
        }
    }

    // Mostrar/ocultar formulario de edición
    function toggleEditForm(show) {
        if (show) {
            // Llenar formulario con datos actuales
            editName.value = clientData.name || '';
            editEmail.value = clientData.email || '';
            editCellphone.value = clientData.cellphone || '';
            editAddress.value = clientData.address || '';

            editForm.classList.add('active');
            editClientBtn.style.display = 'none';
        } else {
            editForm.classList.remove('active');
            editClientBtn.style.display = 'inline-flex';
        }
    }

    async function handleEditSubmit(e) {
        e.preventDefault();

        try {
            // Mostrar estado de carga
            editClientBtn.disabled = true;
            editClientBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Actualizando...';

            // 1. Preparar datos actualizados
            const updatedData = {
                name: editName.value,
                email: editEmail.value,
                cellphone: editCellphone.value,
                address: editAddress.value,
                dni: clientData.dni,
                id: clientData.id
            };

            // 2. Enviar actualización al servidor
            await ClientService.update(clientData.id, updatedData);

            // 3. Obtener los datos frescos del servidor
            const refreshedClient = await ClientService.getById(clientData.id);

            if (!refreshedClient) {
                throw new Error('No se pudo obtener los datos actualizados del servidor');
            }

            // 4. Actualizar sessionStorage con los datos completos
            const completeClientData = {
                ...refreshedClient,
                computers: clientData.computers // Mantenemos las computadoras existentes
            };

            sessionStorage.setItem('currentClient', JSON.stringify(completeClientData));

            // 5. Actualizar la vista
            clientData = completeClientData;
            loadClientData();
            toggleEditForm(false);

            // 6. Mostrar confirmación
            showSuccess('Datos actualizados correctamente');

        } catch (error) {
            console.error('Error en actualización:', error);
            showError(error.message || 'Error al actualizar los datos');

            // Opcional: Recargar los datos originales como fallback
            try {
                const fallbackData = await ClientService.getById(clientData.id);
                if (fallbackData) {
                    sessionStorage.setItem('currentClient', JSON.stringify(fallbackData));
                    clientData = fallbackData;
                    loadClientData();
                }
            } catch (err) {
                console.error('Error al recuperar datos:', err);
            }
        } finally {
            // Restaurar estado del botón
            editClientBtn.disabled = false;
            editClientBtn.innerHTML = '<i class="fas fa-edit"></i> Editar datos';
        }
    }

    // Configurar eventos
    function setupEventListeners() {
        // Botón de editar
        editClientBtn.addEventListener('click', () => toggleEditForm(true));

        // Botón de cancelar edición
        cancelEditBtn.addEventListener('click', () => toggleEditForm(false));

        // Formulario de edición
        editForm.addEventListener('submit', handleEditSubmit);
    }

    // Mostrar mensaje de error
    function showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        document.querySelector('.main-content').prepend(errorDiv);

        // Eliminar después de 5 segundos
        setTimeout(() => errorDiv.remove(), 5000);
    }

    // Mostrar mensaje de éxito
    function showSuccess(message) {
        const successDiv = document.createElement('div');
        successDiv.className = 'success-message';
        successDiv.textContent = message;
        document.querySelector('.main-content').prepend(successDiv);

        // Eliminar después de 5 segundos
        setTimeout(() => successDiv.remove(), 5000);
    }

    // Menú hamburguesa
    function setupMobileMenu() {
        menuToggle.addEventListener('click', function () {
            sidebar.classList.toggle('active');
            overlay.classList.toggle('active');
        });

        overlay.addEventListener('click', function () {
            sidebar.classList.remove('active');
            overlay.classList.remove('active');
        });
    }

    // Manejar cierre de sesión
    function setupLogout() {
        logoutLink.addEventListener('click', function (e) {
            e.preventDefault();
            sessionStorage.removeItem('currentClient');
            window.location.href = '../../index.html';
        });
    }

    // Inicialización
    function init() {
        setupMobileMenu();
        setupLogout();
        loadClientData();
        setupEventListeners();

        if (window.innerWidth > 768) {
            sidebar.classList.add('active');
        }
    }

    init();
});