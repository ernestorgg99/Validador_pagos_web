// Helper para headers con token
function getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
}

let usuariosCache = [];

async function cargarUsuarios() {
    try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error("No token");

        const response = await fetch(`${API_URL}/api/admin/usuarios`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error(response.status);

        usuariosCache = await response.json();
        renderizarUsuarios(usuariosCache);
        actualizarContadores(usuariosCache);
    } catch (e) {
        console.error("Error al cargar usuarios", e);
        if (e.message === "401" || e.message === "403") {
            alert("Sesión expirada");
            localStorage.clear();
            window.location.href = "login.html";
        }
    }
}

// --- LOGICA DEL MODAL DE EDICION ---

function abrirModalEdicion(userId) {
    const user = usuariosCache.find(u => u.id === userId);
    if (!user) return;

    document.getElementById('edit-id').value = user.id;
    document.getElementById('edit-nombre').value = user.nombre_completo;
    document.getElementById('edit-email').value = user.usuario || ""; // Usamos usuario como login/email
    document.getElementById('edit-rol').value = user.rol;
    document.getElementById('edit-grupo').value = user.grupo;
    document.getElementById('edit-password').value = ""; // Limpiar password

    document.getElementById('modalEditar').classList.remove('hidden');
    document.getElementById('modalEditar').classList.remove('hidden');

    // Cargar permisos del usuario
    cargarPermisosEnModal(user.permisos || []);
}

let catalogosCache = null;

async function cargarCatalogos() {
    if (catalogosCache) return catalogosCache;
    try {
        const res = await fetch(`${API_URL}/api/admin/catalogos`, { headers: getAuthHeaders() });
        if (res.ok) {
            catalogosCache = await res.json();
            return catalogosCache;
        }
    } catch (e) { console.error("Error cargando catálogos", e); }
    return null;
}

async function cargarPermisosEnModal(permisosUsuario) {
    const container = document.getElementById('permisos-container');
    container.innerHTML = '<div class="text-xs text-gray-400">Cargando...</div>';

    const catalogos = await cargarCatalogos();
    if (!catalogos) {
        container.innerHTML = '<div class="text-red-400 text-xs">Error cargando opciones</div>';
        return;
    }

    container.innerHTML = "";

    // Parsear permisos si vienen como string JSON (backup safety)
    let userPerms = permisosUsuario;
    if (typeof userPerms === 'string') {
        try { userPerms = JSON.parse(userPerms); } catch (e) { userPerms = []; }
    }

    catalogos.permisos_disponibles.forEach(permiso => {
        const isChecked = userPerms.includes(permiso.key) ? 'checked' : '';
        const item = `
            <label class="flex items-center space-x-2 p-2 hover:bg-white rounded-lg transition cursor-pointer">
                <input type="checkbox" value="${permiso.key}" class="permiso-check w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500" ${isChecked}>
                <span class="text-sm font-medium text-gray-700">${permiso.label}</span>
            </label>
        `;
        container.innerHTML += item;
    });
}

document.getElementById('formEditarUsuario').addEventListener('submit', async (e) => {
    e.preventDefault();

    const userId = document.getElementById('edit-id').value;
    const payload = {
        nombre_completo: document.getElementById('edit-nombre').value,
        usuario: document.getElementById('edit-email').value,
        rol: document.getElementById('edit-rol').value,
        grupo: document.getElementById('edit-grupo').value,
        password: document.getElementById('edit-password').value,
        permisos: Array.from(document.querySelectorAll('.permiso-check:checked')).map(cb => cb.value)
    };

    try {
        const res = await fetch(`${API_URL}/api/admin/usuario/${userId}/update`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            alert("Usuario actualizado correctamente");
            document.getElementById('modalEditar').classList.add('hidden');
            cargarUsuarios();
        } else {
            const err = await res.json();
            alert("Error: " + (err.error || "No se pudo actualizar"));
        }
    } catch (error) {
        alert("Error de conexión");
    }
});


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

// --- FUNCIONES DE INTERFAZ ---
function actualizarContadores(usuarios) {
    document.getElementById('count-pendientes').innerText = usuarios.filter(u => !u.esta_aprobado).length;
    document.getElementById('count-activos').innerText = usuarios.filter(u => u.esta_aprobado).length;
    const grupos = [...new Set(usuarios.map(u => u.grupo))];
    document.getElementById('count-grupos').innerText = grupos.length;
}

function renderizarUsuarios(lista) {
    const container = document.getElementById('lista-usuarios');
    container.innerHTML = "";

    lista.forEach(user => {
        // Mapeo de colores para roles
        const roleColors = {
            'administrador': 'bg-purple-100 text-purple-700',
            'supervisor': 'bg-blue-100 text-blue-700',
            'operador': 'bg-gray-100 text-gray-700'
        };
        const badgeColor = roleColors[user.rol] || 'bg-gray-100 text-gray-600';

        const row = `
            <tr class="hover:bg-blue-50/50 transition border-b border-gray-100 group">
                <td class="p-6">
                    <div class="font-black text-gray-800 text-sm">${user.nombre_completo}</div>
                    <div class="text-[10px] uppercase font-bold tracking-widest text-gray-400 mt-1">${user.grupo}</div>
                </td>
                <td class="p-6">
                    <span class="px-3 py-1 rounded-lg text-[10px] font-black uppercase ${badgeColor}">
                        ${user.rol}
                    </span>
                </td>
                <td class="p-6">
                    <span class="px-3 py-1 rounded-full text-[10px] font-black uppercase ${user.esta_aprobado ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'}">
                        ${user.esta_aprobado ? 'Activo' : 'Pendiente'}
                    </span>
                </td>
                <td class="p-6 text-center">
                    <div class="flex items-center justify-center gap-2">
                        <button onclick="abrirModalEdicion('${user.id}')" class="bg-white border border-gray-200 text-gray-600 p-2 rounded-xl hover:bg-blue-600 hover:text-white hover:border-blue-600 transition shadow-sm" title="Editar Usuario Completo">
                            <i data-lucide="edit-3" class="w-4 h-4"></i>
                        </button>

                        ${!user.esta_aprobado ?
                `<button onclick="aprobarUsuario('${user.id}')" class="bg-green-500 text-white p-2 rounded-xl hover:bg-green-600 transition shadow-sm" title="Aprobar"><i data-lucide="check" class="w-4 h-4"></i></button>` :
                `<button onclick="suspenderUsuario('${user.id}')" class="bg-white border border-red-100 text-red-400 p-2 rounded-xl hover:bg-red-50 transition" title="Suspender"><i data-lucide="pause" class="w-4 h-4"></i></button>`
            }
                    </div>
                </td>
            </tr>
        `;
        container.innerHTML += row;
    });

    if (window.lucide) lucide.createIcons();
}

// Inicializar
document.addEventListener('DOMContentLoaded', cargarUsuarios);