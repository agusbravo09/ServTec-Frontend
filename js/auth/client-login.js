import { ClientService } from '../api-service.js';
import { DocumentInputValidation, ValidDocumentFormat } from './login-utils.js';

const setupClientLogin = () => {
    const docInput = document.getElementById('document');
    const clientForm = document.getElementById('client-login-form');
    const errorElement = document.querySelector('.error-message');
    
    if (!docInput || !clientForm || !errorElement) return;

    DocumentInputValidation(docInput);

    const setFormState = (isLoading) => {
        const submitBtn = clientForm.querySelector('.btn-login');
        if (!submitBtn) return;
        
        submitBtn.disabled = isLoading;
        submitBtn.innerHTML = isLoading 
            ? '<i class="fas fa-spinner fa-spin"></i> Verificando...' 
            : 'Continuar';
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const documentNumber = docInput.value.trim();
        
        if (!ValidDocumentFormat(documentNumber)) {
            docInput.classList.add('input-error');
            errorElement.textContent = 'Ingrese un número de documento válido (8 dígitos)';
            errorElement.style.display = 'block';
            return;
        }
        
        try {
            setFormState(true);
            const clientData = await ClientService.getByDni(documentNumber);
            
            if (clientData == null) {
                throw new Error('Documento no encontrado');
            }
            
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
            setFormState(false);
        }
    };

    clientForm.addEventListener('submit', handleSubmit);
};

document.addEventListener('DOMContentLoaded', setupClientLogin);