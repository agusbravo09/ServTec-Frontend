/**
 * utils.js - Utilidades y validaciones optimizadas
 */

export const OnlyNumbers = str => /^\d+$/.test(str);

export const ValidDocumentFormat = doc => OnlyNumbers(doc) && doc.length === 8;

export const DocumentInputValidation = inputElement => {
    if (!inputElement) return;

    const handleInput = e => {
        inputElement.value = inputElement.value.replace(/\D/g, '').slice(0, 8);
    };

    const handleBlur = e => {
        inputElement.classList.toggle('input-error', 
            inputElement.value && !ValidDocumentFormat(inputElement.value));
    };

    inputElement.addEventListener('input', handleInput);
    inputElement.addEventListener('blur', handleBlur);
};