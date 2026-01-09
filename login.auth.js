if (localStorage.getItem('usuario_nombre')) {
    window.location.href = "index.html";
}
const API_URL = "https://relaxed-jorrie-ergg99-b3008c3b.koyeb.app";

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
            headers: {'Content-Type': 'application/json'},
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
async function handleCredentialResponse(response) {
    const msgDiv = document.getElementById('mensaje');
    try {
        const res = await fetch(`${API_URL}/api/auth/google`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ id_token: response.credential })
        });
        
        const data = await res.json();
        procesarRespuesta(res, data, msgDiv);

    } catch (error) {
        console.error("Error en Google Auth:", error);
        mostrarError(msgDiv, "Error de comunicación con host.");
    }
}

// --- UTILIDADES ---
function procesarRespuesta(res, data, msgDiv) {
    if (res.ok) {
        localStorage.setItem('usuario_nombre', data.nombre);
        localStorage.setItem('usuario_rol', data.rol);
        
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
        client_id: "703445030280-m4kghs6j8us6b3bfknb2pr4nq17ncm2d.apps.googleusercontent.com",
        callback: handleCredentialResponse
    });
    google.accounts.id.renderButton(
        document.getElementById("buttonDiv"),
        { theme: "outline", size: "large", width: 350, shape: "pill" } 
    );
}