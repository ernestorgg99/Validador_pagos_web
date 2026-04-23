// Lógica de redirección eliminada para evitar bucles.
// El login solo debe redirigir SI el usuario completa el login exitosamente.
localStorage.removeItem('token'); // Limpiamos token viejos al entrar al login para asegurar sesión limpia.
// API_URL cargado desde config.js

// --- INICIALIZACIÓN DE ICONOS ---
document.addEventListener('DOMContentLoaded', () => {
    if (window.lucide) lucide.createIcons();
});

// --- LOGIN TRADICIONAL (FORMULARIO) ---
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const msgDiv = document.getElementById('mensaje');

    const payload = {
        usuario: document.getElementById('usuario').value,
        password: document.getElementById('password').value
    };

    try {
        const response = await fetch(`${API_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        procesarRespuesta(response, data, msgDiv);

    } catch (error) {
        console.error("Error en login tradicional:", error);
        mostrarError(msgDiv, "No se pudo conectar con el servidor.");
    }
});

// --- LOGIN CON GOOGLE ---
async function handleCredentialResponse(googleResponse) { // Cambiado a googleResponse
    const msgDiv = document.getElementById('mensaje');

    // Decodificar el token para uso visual (aquí estaba el error de nombre)
    const responsePayload = decodeJwtResponse(googleResponse.credential);
    console.log("ID: " + responsePayload.sub);
    console.log('Full Name: ' + responsePayload.name);

    try {
        // Mostrar estado de carga usando el nombre decodificado
        msgDiv.className = "mt-6 p-4 rounded-2xl text-center font-bold text-sm bg-blue-50 text-blue-700 border-2 border-blue-100";
        msgDiv.innerText = `Verificando cuenta de ${responsePayload.name}...`;
        msgDiv.classList.remove('hidden');

        const res = await fetch(`${API_URL}/api/auth/google`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                token: googleResponse.credential // Enviamos el token crudo
            })
        });

        const data = await res.json();

        // 4. Usar tu función procesarRespuesta que ya tienes definida abajo
        procesarRespuesta(res, data, msgDiv);

    } catch (error) {
        console.error("Error en Google Auth:", error);
        mostrarError(msgDiv, "Error de comunicación: revisa la conexión (CORS).");
    }
}

// Función auxiliar para decodificar el token de Google (opcional, para uso visual)
function decodeJwtResponse(token) {
    let base64Url = token.split('.')[1];
    let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    let jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function (c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
}
// --- UTILIDADES ---
function procesarRespuesta(res, data, msgDiv) {
    if (res.ok) {
        localStorage.setItem('usuario_nombre', data.nombre);
        localStorage.setItem('usuario_rol', data.rol);
        localStorage.setItem('token', data.token); // Guardar token JWT

        msgDiv.className = "mt-6 p-4 rounded-2xl text-center font-bold text-sm bg-green-100 text-green-700 border-2 border-green-200";
        msgDiv.innerText = "Acceso concedido. Redirigiendo...";
        msgDiv.classList.remove('hidden');

        setTimeout(() => window.location.href = "index.html", 1000);
    } else {
        mostrarError(msgDiv, data.error);
    }
}

function mostrarError(elem, texto) {
    elem.className = "mt-6 p-4 rounded-2xl text-center font-bold text-sm bg-red-100 text-red-700 border-2 border-red-200";
    elem.innerText = texto;
    elem.classList.remove('hidden');
}

// Configuración de Google al cargar la ventana
window.onload = function () {
    google.accounts.id.initialize({
        client_id: "703445030280-u4ghgkh7rug3n5lc18ndf05ktmmurqoh.apps.googleusercontent.com",
        callback: handleCredentialResponse
    });
    google.accounts.id.renderButton(
        document.getElementById("buttonDiv"),
        { theme: "outline", size: "large", width: 350, shape: "pill" }
    );
}
