import { AdminService } from '../api-service.js';

const setupAdminLogin = () => {
    const loginForm = document.getElementById('admin-login-form');
    if (!loginForm) return;

    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const submitBtn = loginForm.querySelector('.btn-login');
    const [btnText, btnLoading] = ['btn-text', 'btn-loading']
        .map(cls => submitBtn.querySelector(`.${cls}`));
    const loginError = document.getElementById('login-error');

    const showError = (input, message) => {
        input?.classList.add('input-error');
        if (loginError) {
            loginError.textContent = message;
            loginError.style.display = 'block';
        }
    };

    const resetFormState = () => {
        [usernameInput, passwordInput].forEach(input => 
            input?.classList.remove('input-error'));
        if (loginError) loginError.style.display = 'none';
    };

    const setLoadingState = (isLoading) => {
        if (!submitBtn) return;
        submitBtn.disabled = isLoading;
        if (btnText) btnText.style.display = isLoading ? 'none' : 'inline-block';
        if (btnLoading) btnLoading.style.display = isLoading ? 'inline-block' : 'none';
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        resetFormState();

        const username = usernameInput?.value.trim();
        const password = passwordInput?.value.trim();

        if (!username) return showError(usernameInput, 'Ingrese un usuario');
        if (!password) return showError(passwordInput, 'Ingrese una contraseña');

        try {
            setLoadingState(true);
            const adminData = await AdminService.getByUsername(username);
            
            if (!adminData) throw new Error('USER_NOT_FOUND');
            if (adminData.password !== password) throw new Error('INVALID_PASSWORD');
            
            sessionStorage.setItem('currentAdmin', JSON.stringify(adminData));
            window.location.href = 'admin-dashboard.html';
        } catch (error) {
            console.error('Error en login:', error);
            if (error.message === 'USER_NOT_FOUND') {
                showError(usernameInput, 'Usuario no registrado');
            } else if (error.message === 'INVALID_PASSWORD') {
                showError(passwordInput, 'Contraseña incorrecta');
            } else {
                showError(null, 'Error al conectar con el servidor');
            }
        } finally {
            setLoadingState(false);
        }
    };

    loginForm.addEventListener('submit', handleSubmit);
};

document.addEventListener('DOMContentLoaded', setupAdminLogin);