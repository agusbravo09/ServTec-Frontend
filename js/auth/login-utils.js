/**
 * utils.js - Utilidades y validaciones
 */

 /* Valida que un string contenga solo números */
 export function OnlyNumbers(str){
    return /^[0-9]+$/.test(str);
 }

 /* Valida el formato de documento (8 dígitos numéricos) */
 export function ValidDocumentFormat(doc){
    return OnlyNumbers(doc) && doc.length === 8;
 }

 /* Configura la validación en tiempo real para un input de documento */
 export function DocumentInputValidation(inputElement){
    if (!inputElement) return;

    inputElement.addEventListener('input', function(e) {
        // Elimina cualquier caracter que no sea número
        this.value = this.value.replace(/[^0-9]/g, '');
        
        // Limita a 8 caracteres máximo
        if (this.value.length > 8) {
            this.value = this.value.slice(0, 8);
        }
    });

    inputElement.addEventListener('blur', function(e) {
        if (this.value && !ValidDocumentFormat(this.value)) {
            this.classList.add('input-error');
            // Puedes mostrar un mensaje más específico si lo deseas
        } else {
            this.classList.remove('input-error');
        }
    });
 }
 