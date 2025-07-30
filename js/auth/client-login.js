import { ClientService } from '../api-service.js';
import { DocumentInputValidation, ValidDocumentFormat } from './login-utils.js';

document.addEventListener('DOMContentLoaded', function() {
    const docInput = document.getElementById('document');
    const clientForm = document.getElementById('client-login-form');
    const errorElement = document.querySelector('.error-message');
    
    // Configurar validación en tiempo real
    DocumentInputValidation(docInput);
    
    // Manejador del submit
    clientForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const documentNumber = docInput.value.trim();
        
        // Validación local
        if (!ValidDocumentFormat(documentNumber)) {
            docInput.classList.add('input-error');
            errorElement.textContent = 'Ingrese un número de documento válido (8 dígitos)';
            errorElement.style.display = 'block';
            return;
        }
        
        try {
            // Mostrar estado de carga
            const submitBtn = clientForm.querySelector('.btn-login');
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verificando...';
            submitBtn.disabled = true;
            
            // Llamada a la API
            const clientData = await ClientService.getByDni(documentNumber);
            
            // Verificar si el documento existe
            if (clientData === null || clientData === undefined) {
                throw new Error('Documento no encontrado');
            }
            
            // Guardar datos y redirigir
            sessionStorage.setItem('currentClient', JSON.stringify(clientData));
            window.location.href = 'pages/clients/client-dashboard.html';
            
        } catch (error) {
            console.error('Error en login:', error);
            errorElement.textContent = error.message === 'Documento no encontrado' 
                ? 'Documento no encontrado. Por favor verifique.' 
                : 'Error al conectar con el servidor';
            errorElement.style.display = 'block';
            docInput.focus();
        } finally {
            // Restaurar botón
            const submitBtn = clientForm.querySelector('.btn-login');
            if (submitBtn) {
                submitBtn.innerHTML = 'Continuar';
                submitBtn.disabled = false;
            }
        }
    });
});