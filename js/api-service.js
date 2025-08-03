/**
 * api.service.js - Servicio optimizado para llamadas API
 */

const BASE_URL = 'https://servtec-backend.onrender.com/api';
const CACHE = new Map();
const CACHE_TTL = 30000; // 30 segundos de cache

async function makeRequest(endpoint, method = 'GET', data = null, params = {}, useCache = true) {
    // Construir URL con parámetros
    let url = `${BASE_URL}${endpoint}`;
    Object.keys(params).forEach(key => {
        url = url.replace(`{${key}}`, params[key]);
    });

    // Generar clave de caché
    const cacheKey = `${method}:${url}`;
    
    // Verificar caché para GET
    if (method === 'GET' && useCache && CACHE.has(cacheKey)) {
        const cached = CACHE.get(cacheKey);
        if (Date.now() - cached.timestamp < CACHE_TTL) {
            return cached.data;
        }
        CACHE.delete(cacheKey);
    }

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

    try {
        const response = await fetch(url, config);

        // Manejar respuestas vacías o errores
        if (response.status === 404) return null;

        if (!response.ok) {
            const errorText = await response.text();
            let errorMessage = 'Error en la solicitud';
            try {
                errorMessage = JSON.parse(errorText).message || errorText;
            } catch {
                errorMessage = errorText || 'Error desconocido';
            }
            throw new Error(errorMessage);
        }

        if (response.status === 204 || response.headers.get('Content-Length') === '0') {
            return null;
        }

        const result = await response.json();

        // Cachear respuestas GET
        if (method === 'GET' && useCache) {
            CACHE.set(cacheKey, {
                data: result,
                timestamp: Date.now()
            });
        }

        return result;
    } catch (error) {
        console.error(`Error en ${method} ${url}:`, error);
        throw error;
    }
}

// Servicios con métodos optimizados
const createService = (endpoint) => ({
    getAll: () => makeRequest(endpoint),
    getById: (id) => makeRequest(`${endpoint}/{id}`, 'GET', null, { id }),
    create: (data) => makeRequest(endpoint, 'POST', data),
    update: (id, data) => makeRequest(`${endpoint}/{id}`, 'PUT', data, { id }),
    delete: (id) => makeRequest(`${endpoint}/{id}`, 'DELETE', null, { id })
});

// Servicio de Clientes
export const ClientService = {
    ...createService('/clients'),
    getByDni: (dni) => makeRequest('/clients/dni/{dni}', 'GET', null, { dni }),
    getByName: (name) => makeRequest('/clients/name/{name}', 'GET', null, { name })
};

// Servicio de Computadoras
export const ComputerService = {
    ...createService('/computers'),
    getByType: (type) => makeRequest('/computers/type/{type}', 'GET', null, { type }),
    getByClient: (clientId) => makeRequest('/computers/client/{clientId}', 'GET', null, { clientId })
};

// Servicio de Presupuestos
export const BudgetService = {
    ...createService('/budgets'),
    getByStatus: (status) => makeRequest('/budgets/status/{status}', 'GET', null, { status }),
    getByComputerId: (computerId) => makeRequest('/budgets/computer/{computerId}', 'GET', null, { computerId }),
    getByClient: (clientId) => makeRequest('/budgets/client/{clientId}', 'GET', null, { clientId }),
    addPart: (budgetId, partData) => makeRequest('/budgets/{id}/add-part', 'POST', partData, { id: budgetId }),
    addJob: (budgetId, jobData) => makeRequest('/budgets/{id}/add-job', 'POST', jobData, { id: budgetId })
};

// Servicio de Partes
export const PartService = {
    ...createService('/parts'),
    getByBudget: (budgetId) => makeRequest('/parts/budget/{budgetId}', 'GET', null, { budgetId })
};

// Servicio de Trabajos
export const JobService = {
    ...createService('/jobs'),
    getByBudget: (budgetId) => makeRequest('/jobs/budget/{budgetId}', 'GET', null, { budgetId })
};

// Servicio de Administradores
export const AdminService = {
    getByUsername: (username) => makeRequest('/admins/{username}', 'GET', null, { username }),
    create: (data) => makeRequest('/admins', 'POST', data),
    update: (id, data) => makeRequest('/admins/{id}', 'PUT', data, { id }),
    delete: (id) => makeRequest('/admins/{id}', 'DELETE', null, { id })
};

// Exportación global
export default {
    ClientService,
    ComputerService,
    BudgetService,
    PartService,
    JobService,
    AdminService
};