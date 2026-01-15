// Helper para headers con token
function getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
}

async function cargarUsuarios() {
    try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error("No token");

        const response = await fetch(`${API_URL}/api/admin/usuarios`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error(response.status);

        const usuarios = await response.json();
        renderizarUsuarios(usuarios);
        actualizarContadores(usuarios);
    } catch (e) {
        console.error("Error al cargar usuarios", e);
        if (e.message === "401" || e.message === "403") {
            alert("Sesión expirada");
            localStorage.clear();
            window.location.href = "login.html";
        }
    }
}

async function cambiarPassword(userId) {
    const nuevaClave = prompt("Ingresa la nueva contraseña para este usuario:");
    if (!nuevaClave || nuevaClave.length < 4) {
        if (nuevaClave !== null) alert("Contraseña inválida o muy corta (mínimo 4 caracteres).");
        return;
    }

    try {
        const res = await fetch(`${API_URL}/api/admin/cambiar_password`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ id: userId, password: nuevaClave })
        });
        if (res.ok) {
            alert("Contraseña actualizada con éxito");
        } else {
            alert("Error al actualizar la contraseña en el servidor.");
        }
    } catch (e) {
        console.error("Error conectando al servidor:", e);
        alert("Error de conexión.");
    }
}

async function aprobarUsuario(userId) {
    try {
        const response = await fetch(`${API_URL}/api/admin/aprobar/${userId}`, {
            method: 'POST',
            headers: getAuthHeaders()
        });
        if (response.ok) cargarUsuarios();
    } catch (e) { alert("Error al aprobar"); }
}

async function suspenderUsuario(userId) {
    if (!confirm("¿Seguro que deseas suspender el acceso a este usuario?")) return;
    try {
        const response = await fetch(`${API_URL}/api/admin/suspender/${userId}`, {
            method: 'POST',
            headers: getAuthHeaders()
        });
        if (response.ok) cargarUsuarios();
    } catch (e) { alert("Error al suspender"); }
}

async function cambiarRol(userId, nuevoRol) {
    try {
        await fetch(`${API_URL}/api/admin/cambiar_rol`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ id: userId, rol: nuevoRol })
        });
    } catch (e) { console.error("Error al cambiar rol"); }
}

async function cambiarGrupo(userId, nuevoGrupo) {
    try {
        await fetch(`${API_URL}/api/admin/cambiar_grupo`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ id: userId, grupo: nuevoGrupo })
        });
    } catch (e) { console.error("Error al cambiar grupo"); }
}

// Inicializar la carga al entrar
cargarUsuarios();