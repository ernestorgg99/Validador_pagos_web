// Utilidades compartidas para Validador de Pagos
// Dependencias: API_URL (config.js)

/**
 * Genera headers de autenticación con JWT
 * @returns {Object} Headers con Authorization: Bearer <token>
 */
function getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
}

/**
 * Maneja errores de autenticación comunes (401/403)
 * @param {Error} error - Objeto error o respuesta con error
 * @returns {boolean} True si manejó el error (redirigió), False si no.
 */
function handleAuthError(error) {
    if (error.message === "401" || error.message === "403" || error.status === 401 || error.status === 403) {
        console.warn("Sesión expirada o inválida.", error);
        alert("Sesión expirada. Por favor, inicia sesión nuevamente.");
        localStorage.removeItem('token'); // Limpiar token corrupto
        window.location.href = "login.html";
        return true;
    }
    return false;
}

/**
 * Formatea un número como moneda local (Bs.)
 * @param {string|number} amount 
 * @returns {string} Texto formateado
 */
function formatCurrency(amount) {
    return parseFloat(amount).toLocaleString('es-VE', { minimumFractionDigits: 2 });
}

/**
 * Cierra la sesión del usuario actual
 */
function logout() {
    localStorage.clear();
    window.location.href = "login.html";
}
