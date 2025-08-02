import { ComputerService, ClientService } from '../../api-service.js';
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

    function validateDNI(dni) {
        return /^\d{8}$/.test(dni);
    }


    // Selección de elementos principales
    const form = document.getElementById('computer-form');
    const editForm = document.getElementById('edit-modal-form');
    const computersList = document.getElementById('computers-list');
    const searchBtn = document.getElementById('search-btn');
    const searchDni = document.getElementById('search-dni');
    const addComputerBtn = document.getElementById('add-computer-btn');

    // Selección de elementos de modales
    const addModal = document.getElementById('add-modal');
    const editModal = document.getElementById('edit-modal');
    const closeAddModalBtn = document.getElementById('close-add-modal');
    const closeEditModalBtn = document.getElementById('close-modal-btn');

    let computers = [];
    let clients = [];

    // Cargar datos iniciales
    loadData();

    // Funciones para manejar modales
    function openModal(modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeModal(modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }

    // Cargar datos de computadoras y clientes
    async function loadData() {
        try {
            clients = await ClientService.getAll();
            computers = await ComputerService.getAll();
            renderComputers(computers);
        } catch (error) {
            showError('Error al cargar datos: ' + error.message, computersList);
        }
    }

    // Crear nueva computadora
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const dni = document.getElementById('comp-client-dni').value.trim();

        // Validar DNI
        if (!validateDNI(dni)) {
            showError('El DNI debe contener exactamente 8 números', form);
            return;
        }

        try {
            const client = await ClientService.getByDni(dni);
            if (!client) {
                showError('Cliente no encontrado por DNI', form);
                return;
            }

            const computerData = {
                processor: document.getElementById('comp-processor').value,
                graphics: document.getElementById('comp-graphics').value,
                motherboard: document.getElementById('comp-motherboard').value,
                powerSupply: document.getElementById('comp-power').value,
                ram: document.getElementById('comp-ram').value,
                storage: document.getElementById('comp-storage').value,
                type: document.getElementById('comp-type').value,
                client: client
            };

            const newComputer = await ComputerService.create(computerData);
            showSuccess('Computadora creada correctamente', form);
            form.reset();
            closeModal(addModal);

            setTimeout(() => {
                window.location.reload();
            }, 500);

        } catch (error) {
            showError('Error al crear computadora: ' + error.message, form);
        }
    });

    // Agregar control de input para el DNI (solo números y máximo 8 caracteres)
    document.getElementById('comp-client-dni').addEventListener('input', function (e) {
        this.value = this.value.replace(/[^0-9]/g, '');
        if (this.value.length > 8) {
            this.value = this.value.slice(0, 8);
        }
    });


    // Búsqueda por DNI
    searchBtn.addEventListener('click', async () => {
        const dni = searchDni.value.trim();

        if (!dni) {
            await loadData();
            return;
        }

        try {
            const client = await ClientService.getByDni(dni);
            if (client && client.id) {
                const filtered = await ComputerService.getByClient(client.id);
                renderComputers(filtered);
            } else {
                showError('Cliente no encontrado por DNI', computersList);
                renderComputers([]);
            }
        } catch (error) {
            showError('Error al buscar: ' + error.message, computersList);
        }
    });

    // Renderizar computadoras en tabla
    function renderComputers(list) {
        computersList.innerHTML = '';

        if (!list || list.length === 0) {
            computersList.innerHTML = '<tr><td colspan="9" class="error-message">No se encontraron computadoras</td></tr>';
            return;
        }


        list.forEach(pc => {
            // Buscar el cliente correspondiente a esta computadora
            const client = clients.find(c => c.computers && c.computers.some(comp => comp.id === pc.id));


            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${pc.processor}</td>
                <td>${pc.graphics}</td>
                <td>${pc.motherboard}</td>
                <td>${pc.powerSupply}</td>
                <td>${pc.ram}</td>
                <td>${pc.storage}</td>
                <td>${pc.type}</td>
                <td>${client.name}</td>
                <td class="actions-cell">
                    <button class="btn-edit" data-id="${pc.id}" title="Editar"><i class="fas fa-edit"></i></button>
                    <button class="btn-delete" data-id="${pc.id}" title="Eliminar"><i class="fas fa-trash"></i></button>
                </td>
            `;
            computersList.appendChild(tr);

            // Event listeners para botones de acción
            tr.querySelector('.btn-edit').addEventListener('click', () => openEditModal(pc));
            tr.querySelector('.btn-delete').addEventListener('click', () => deleteComputer(pc.id));
        });
    }

    // Abrir modal de edición
    function openEditModal(pc) {
        document.getElementById('edit-processor').value = pc.processor;
        document.getElementById('edit-graphics').value = pc.graphics;
        document.getElementById('edit-motherboard').value = pc.motherboard;
        document.getElementById('edit-power').value = pc.powerSupply;
        document.getElementById('edit-ram').value = pc.ram;
        document.getElementById('edit-storage').value = pc.storage;
        document.getElementById('edit-type').value = pc.type;
        editModal.setAttribute('data-edit-id', pc.id);
        openModal(editModal);
    }

    // Actualizar computadora
    editForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const editId = editModal.getAttribute('data-edit-id');

        if (!editId) return;

        const computerData = {
            processor: document.getElementById('edit-processor').value,
            graphics: document.getElementById('edit-graphics').value,
            motherboard: document.getElementById('edit-motherboard').value,
            powerSupply: document.getElementById('edit-power').value,
            ram: document.getElementById('edit-ram').value,
            storage: document.getElementById('edit-storage').value,
            type: document.getElementById('edit-type').value
        };

        try {
            await ComputerService.update(editId, computerData);
            showSuccess('Computadora actualizada correctamente', editModal);
            closeModal(editModal);

            // Actualizar la lista de computadoras
            computers = await ComputerService.getAll();
            renderComputers(computers);

        } catch (error) {
            showError('Error al actualizar computadora: ' + error.message, editModal);
        }
    });

    // Eliminar computadora
    async function deleteComputer(id) {
        if (!confirm('¿Está seguro que desea eliminar esta computadora?')) return;
        try {
            await ComputerService.delete(id);
            showSuccess('Computadora eliminada correctamente', computersList);
            await loadData();
            // Actualizar la lista de computadoras
            computers = await ComputerService.getAll();
            renderComputers(computers);
        } catch (error) {
            showError('Error al eliminar: ' + error.message, computersList);
        }
    }

    // Event listeners para botones de modales
    addComputerBtn.addEventListener('click', () => openModal(addModal));
    closeAddModalBtn.addEventListener('click', () => closeModal(addModal));
    closeEditModalBtn.addEventListener('click', () => closeModal(editModal));

    // Cerrar modal al hacer clic fuera del contenido
    window.addEventListener('click', (event) => {
        if (event.target === addModal) closeModal(addModal);
        if (event.target === editModal) closeModal(editModal);
    });

    // Búsqueda al presionar Enter
    searchDni.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') searchBtn.click();
    });

    // Logout
    document.querySelector('.logout-item a').addEventListener('click', (e) => {
        e.preventDefault();
        sessionStorage.removeItem('currentAdmin');
        window.location.href = '../../index.html';
    });
});