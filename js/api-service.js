/**
 * api.service.js - Servicio para manejar todas las llamadas API
 */

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL; 

// Función base para todas las peticiones HTTP
async function makeRequest(endpoint, method = 'GET', data = null, params = {}) {
    let url = `${BASE_URL}${endpoint}`;
    Object.keys(params).forEach(key => {
        url = url.replace(`{${key}}`, params[key]);
    });

    const config = {
        method,
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
    };

    if (data) {
        config.body = JSON.stringify(data);
    }

    const response = await fetch(url, config);

    // Manejar respuestas vacías o errores
    if (response.status === 404) {
        return null; // Usuario no encontrado
    }

    if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = 'Error en la solicitud';
        try {
            const errorData = JSON.parse(errorText);
            errorMessage = errorData.message || errorText;
        } catch {
            errorMessage = errorText || 'Error desconocido';
        }
        throw new Error(errorMessage);
    }

    // Manejar respuestas vacías para DELETE/PUT
    if (response.status === 204 || response.headers.get('Content-Length') === '0') {
        return null;
    }

    return await response.json();
}

// Servicio de Clientes
export const ClientService = {
  getAll: () => makeRequest('/clients'),
  getById: (id) => makeRequest('/clients/{id}', 'GET', null, { id }),
  getByDni: (dni) => makeRequest('/clients/dni/{dni}', 'GET', null, { dni }),
  getByName: (name) => makeRequest('/clients/name/{name}', 'GET', null, { name }),
  create: (clientData) => makeRequest('/clients', 'POST', clientData),
  update: (id, clientData) => makeRequest('/clients/{id}', 'PUT', clientData, { id }),
  delete: (id) => makeRequest('/clients/{id}', 'DELETE', null, { id })
};

// Servicio de Computadoras
export const ComputerService = {
  getAll: () => makeRequest('/computers'),
  getById: (id) => makeRequest('/computers/{id}', 'GET', null, { id }),
  getByType: (type) => makeRequest('/computers/type/{type}', 'GET', null, { type }),
  getByClient: (clientId) => makeRequest('/computers/client/{clientId}', 'GET', null, { clientId }),
  create: (computerData) => makeRequest('/computers', 'POST', computerData),
  update: (id, computerData) => makeRequest('/computers/{id}', 'PUT', computerData, { id }),
  delete: (id) => makeRequest('/computers/{id}', 'DELETE', null, { id })
};

// Servicio de Presupuestos
export const BudgetService = {
  getAll: () => makeRequest('/budgets'),
  getById: (id) => makeRequest('/budgets/{id}', 'GET', null, { id }),
  getByStatus: (status) => makeRequest('/budgets/status/{status}', 'GET', null, { status }),
  getByComputerId: (computerId) => makeRequest('/budgets/computer/{computerId}', 'GET', null, { computerId }),
  getByClient: (clientId) => makeRequest('/budgets/client/{clientId}', 'GET', null, { clientId }),
  create: (budgetData) => makeRequest('/budgets', 'POST', budgetData),
  update: (id, budgetData) => makeRequest('/budgets/{id}', 'PUT', budgetData, { id }),
  delete: (id) => makeRequest('/budgets/{id}', 'DELETE', null, { id }),
  addPart: (budgetId, partData) => makeRequest('/budgets/{id}/add-part', 'POST', partData, { id: budgetId }),
  addJob: (budgetId, jobData) => makeRequest('/budgets/{id}/add-job', 'POST', jobData, { id: budgetId })
};

// Servicio de Partes
export const PartService = {
  create: (partData) => makeRequest('/parts', 'POST', partData),
  update: (id, partData) => makeRequest('/parts/{id}', 'PUT', partData, { id }),
  delete: (id) => makeRequest('/parts/{id}', 'DELETE', null, { id }),
  getByBudget: (budgetId) => makeRequest('/parts/budget/{budgetId}', 'GET', null, { budgetId })
};

// Servicio de Trabajos
export const JobService = {
  create: (jobData) => makeRequest('/jobs', 'POST', jobData),
  update: (id, jobData) => makeRequest('/jobs/{id}', 'PUT', jobData, { id }),
  delete: (id) => makeRequest('/jobs/{id}', 'DELETE', null, { id }),
  getByBudget: (budgetId) => makeRequest('/jobs/budget/{budgetId}', 'GET', null, { budgetId })
};

// Servicio de Administradores
export const AdminService = {
 getByUsername: (username) => makeRequest('/admins/{username}', 'GET', null, { username }),
 update: (id, adminData) => makeRequest('/admins/{id}', 'PUT', adminData, { id }),
 delete: (id) => makeRequest('/admins/{id}', 'DELETE', null, { id }),
 create: (adminData) => makeRequest('/admins', 'POST', adminData)
};

// Exportación global (opcional)
export default {
  ClientService,
  ComputerService,
  BudgetService,
  PartService,
  JobService,
  AdminService
};
