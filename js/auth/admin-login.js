import { AdminService } from '../api-service.js';

document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('admin-login-form');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const submitBtn = loginForm.querySelector('.btn-login');
    const btnText = submitBtn.querySelector('.btn-text');
    const btnLoading = submitBtn.querySelector('.btn-loading');
    const loginError = document.getElementById('login-error');

    // Manejador del submit
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Resetear errores
        loginError.style.display = 'none';
        usernameInput.classList.remove('input-error');
        passwordInput.classList.remove('input-error');

        const username = usernameInput.value.trim();
        const password = passwordInput.value.trim();

        // Validación básica
        if (!username) {
            showError(usernameInput, 'Ingrese un usuario');
            return;
        }
        if (!password) {
            showError(passwordInput, 'Ingrese una contraseña');
            return;
        }

        try {
            // Mostrar estado de carga
            btnText.style.display = 'none';
            btnLoading.style.display = 'inline-block';
            submitBtn.disabled = true;

            // Verificar credenciales
            const adminData = await AdminService.getByUsername(username);
            
            if (!adminData) {
                throw new Error('USER_NOT_FOUND');
            }
            
            if (adminData.password !== password) {
                throw new Error('INVALID_PASSWORD');
            }
            
            // Login exitoso
            sessionStorage.setItem('currentAdmin', JSON.stringify(adminData));
            window.location.href = 'admin-dashboard.html';

        } catch (error) {
            console.error('Error en login:', error);
            
            if (error.message === 'USER_NOT_FOUND') {
                showError(usernameInput, 'Usuario no registrado');
            } 
            else if (error.message === 'INVALID_PASSWORD') {
                showError(passwordInput, 'Contraseña incorrecta');
            }
            else {
                loginError.textContent = 'Error al conectar con el servidor';
                loginError.style.display = 'block';
            }
        } finally {
            // Restaurar botón
            btnText.style.display = 'inline-block';
            btnLoading.style.display = 'none';
            submitBtn.disabled = false;
        }
    });

    function showError(input, message) {
        input.classList.add('input-error');
        loginError.textContent = message;
        loginError.style.display = 'block';
    }
});