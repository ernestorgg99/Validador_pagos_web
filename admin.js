// API_URL cargado desde config.js

// 1. SEGURIDAD: Solo el rol 'administrador' entra aquí
if (localStorage.getItem('usuario_rol') !== 'administrador') {
    window.location.href = "index.html";
}

// 2. CARGA INICIAL
async function cargarUsuarios() {
    try {
        const response = await fetch(`${API_URL}/api/admin/usuarios`);
        const usuarios = await response.json();
        renderizarUsuarios(usuarios);
        actualizarContadores(usuarios);
    } catch (e) {
        console.error("Error al cargar usuarios", e);
    }
}

function actualizarContadores(usuarios) {
    document.getElementById('count-pendientes').innerText = usuarios.filter(u => !u.esta_aprobado).length;
    document.getElementById('count-activos').innerText = usuarios.filter(u => u.esta_aprobado).length;
    const grupos = [...new Set(usuarios.map(u => u.grupo))];
    document.getElementById('count-grupos').innerText = grupos.length;
}

// 3. RENDERIZADO DE TABLA
function renderizarUsuarios(lista) {
    const container = document.getElementById('lista-usuarios');
    container.innerHTML = "";

    lista.forEach(user => {
        const row = `
            <tr class="hover:bg-blue-50/50 transition border-b border-gray-100">
                <td class="p-6">
                    <div class="font-black text-gray-800">${user.nombre_completo}</div>
                    <select onchange="cambiarGrupo('${user.id}', this.value)" class="text-[10px] font-bold uppercase tracking-widest bg-blue-50 text-blue-600 border-none rounded-md px-2 py-1 mt-1 cursor-pointer">
                        <option value="General" ${user.grupo === 'General' ? 'selected' : ''}>General</option>
                        <option value="Ventas" ${user.grupo === 'Ventas' ? 'selected' : ''}>Ventas</option>
                        <option value="Caja" ${user.grupo === 'Caja' ? 'selected' : ''}>Caja</option>
                        <option value="Administración" ${user.grupo === 'Administración' ? 'selected' : ''}>Administración</option>
                    </select>
                </td>
                <td class="p-6">
                    <select onchange="cambiarRol('${user.id}', this.value)" class="bg-gray-100 border-none rounded-lg text-xs font-black uppercase p-2 focus:ring-2 focus:ring-blue-500">
                        <option value="operador" ${user.rol === 'operador' ? 'selected' : ''}>Operador</option>
                        <option value="supervisor" ${user.rol === 'supervisor' ? 'selected' : ''}>Supervisor</option>
                        <option value="administrador" ${user.rol === 'administrador' ? 'selected' : ''}>Administrador</option>
                    </select>
                </td>
                <td class="p-6">
                    <span class="px-3 py-1 rounded-full text-[10px] font-black uppercase ${user.esta_aprobado ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'}">
                        ${user.esta_aprobado ? 'Activo' : 'Pendiente'}
                    </span>
                </td>
                <td class="p-6 text-center">
                    <div class="flex items-center justify-center gap-3">
                        <button onclick="cambiarPassword('${user.id}')" class="text-blue-500 hover:text-blue-700 p-2 hover:bg-blue-50 rounded-lg transition" title="Cambiar Contraseña">
                            <i data-lucide="key" class="w-5 h-5"></i>
                        </button>

                        ${!user.esta_aprobado ?
                `<button onclick="aprobarUsuario('${user.id}')" class="bg-green-500 text-white px-4 py-2 rounded-xl hover:bg-green-600 font-bold text-xs transition shadow-sm">Aprobar</button>` :
                `<button onclick="suspenderUsuario('${user.id}')" class="text-red-400 hover:text-red-600 font-bold text-xs uppercase transition p-2 hover:bg-red-50 rounded-lg">Suspender</button>`
            }
                    </div>
                </td>
            </tr>
        `;
        container.innerHTML += row;
    });

    // IMPORTANTE: Reiniciar iconos de Lucide después de renderizar la tabla
    if (window.lucide) lucide.createIcons();
}

// 4. ACCIONES DEL ADMINISTRADOR

async function cambiarPassword(userId) {
    const nuevaClave = prompt("Ingresa la nueva contraseña para este usuario:");
    if (!nuevaClave || nuevaClave.length < 4) {
        if (nuevaClave !== null) alert("Contraseña inválida o muy corta (mínimo 4 caracteres).");
        return;
    }

    try {
        const res = await fetch(`${API_URL}/api/admin/cambiar_password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
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
        const response = await fetch(`${API_URL}/api/admin/aprobar/${userId}`, { method: 'POST' });
        if (response.ok) cargarUsuarios();
    } catch (e) { alert("Error al aprobar"); }
}

async function suspenderUsuario(userId) {
    if (!confirm("¿Seguro que deseas suspender el acceso a este usuario?")) return;
    try {
        const response = await fetch(`${API_URL}/api/admin/suspender/${userId}`, { method: 'POST' });
        if (response.ok) cargarUsuarios();
    } catch (e) { alert("Error al suspender"); }
}

async function cambiarRol(userId, nuevoRol) {
    try {
        await fetch(`${API_URL}/api/admin/cambiar_rol`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: userId, rol: nuevoRol })
        });
    } catch (e) { console.error("Error al cambiar rol"); }
}

async function cambiarGrupo(userId, nuevoGrupo) {
    try {
        await fetch(`${API_URL}/api/admin/cambiar_grupo`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: userId, grupo: nuevoGrupo })
        });
    } catch (e) { console.error("Error al cambiar grupo"); }
}

// Inicializar la carga al entrar
cargarUsuarios();