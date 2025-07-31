import { ClientService, ComputerService } from '../../api-service.js';
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

    // Elementos principales
    const clientsList = document.getElementById('clients-list');
    const searchBtn = document.getElementById('search-btn');
    const searchInput = document.getElementById('search-client');

    // Variables de estado
    let clients = [];
    let computers = [];

    // Inicializar
    loadData();

    // Cargar datos iniciales
    async function loadData() {
        try {
            clients = await ClientService.getAll();
            computers = await ComputerService.getAll();
            renderClients(clients);
        } catch (error) {
            showError('Error al cargar datos: ' + error.message, clientsList);
        }
    }

    // Renderizar clientes en tabla
    function renderClients(list) {
        clientsList.innerHTML = '';
        console.log(computers);
        if (!list || list.length === 0) {
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
                <td>${client.computers.length >= 1 ? client.computers.length : 'Sin computadoras'} registradas</td>
            `;
            clientsList.appendChild(tr);
        });
    }

    // Buscar clientes por DNI
    searchBtn.addEventListener('click', () => {
        const searchTerm = searchInput.value.trim();

        if (!searchTerm) {
            renderClients(clients);
            return;
        }

        try {
            const results = clients.filter(client =>
                client.dni.includes(searchTerm)
            );

            renderClients(results.length > 0 ? results : []);

            if (results.length === 0) {
                showError('No se encontraron clientes con ese DNI', clientsList);
            }
        } catch (error) {
            showError('Error al buscar: ' + error.message, clientsList);
        }
    });

    // Permitir búsqueda con Enter
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') searchBtn.click();
    });

    // Logout
    document.querySelector('.logout-item a').addEventListener('click', (e) => {
        e.preventDefault();
        sessionStorage.removeItem('currentAdmin');
        window.location.href = '../../index.html';
    });
});