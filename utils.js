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
    // 401: Token inválido o no existe -> Logout
    if (error.message === "401" || error.status === 401) {
        alert("Sesión expirada. Por favor, inicia sesión nuevamente.");
        logout();
        return true;
    }
    // 403: Prohibido -> Alerta solamente (no desloguear)
    if (error.message === "403" || error.status === 403) {
        alert("⛔ Acceso Denegado: No tienes permiso para realizar esta acción.");
        return true;
    }
    return false;
}

/**
 * Verifica si el usuario tiene un permiso específico
 * @param {string} permission 
 * @returns {boolean}
 */
function checkPermission(permission) {
    const rol = localStorage.getItem('usuario_rol');
    if (rol === 'administrador') return true;

    try {
        const perms = JSON.parse(localStorage.getItem('usuario_permisos') || '[]');
        return perms.includes(permission) || perms.includes('all');
    } catch (e) { return false; }
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
/**
 * Aplica permisos a la barra lateral (oculta opciones no autorizadas)
 */
function applySidebarPermissions() {
    const linkHistorial = document.getElementById('link-historial');
    const linkReportes = document.getElementById('link-reportes');

    // Ocultar Historial si no tiene 'ver_historial'
    // Nota: 'administrador' pasa checkPermission automáticamente
    if (linkHistorial && !checkPermission('ver_historial')) {
        linkHistorial.style.display = 'none';
    }

    // Ocultar Reportes si no tiene 'ver_reportes'
    if (linkReportes && !checkPermission('ver_reportes')) {
        linkReportes.style.display = 'none';
    }
}

// Ejecutar al cargar cualquier página
document.addEventListener('DOMContentLoaded', () => {
    applySidebarPermissions();
});
