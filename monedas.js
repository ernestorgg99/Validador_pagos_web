let paginaActual = 1;
let editando = false;

// --- Helper ---
function getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
}

// --- Inicialización ---
document.addEventListener('DOMContentLoaded', () => {
    cargarTasaHoy();
    cargarHistorial(1);
    lucide.createIcons();

    document.getElementById('formTasa').addEventListener('submit', (e) => {
        e.preventDefault();
        guardarTasa();
    });
});

// --- Tasa del Día ---
async function cargarTasaHoy() {
    const elValor = document.getElementById('tasa-hoy-valor');
    const elDetalle = document.getElementById('tasa-hoy-detalle');
    elValor.innerText = '...';
    elDetalle.innerText = 'Cargando...';

    try {
        const res = await fetch(`${API_URL}/api/bcv/tasa-hoy`, {
            headers: getAuthHeaders()
        });
        if (!res.ok) throw new Error(res.status);

        const data = await res.json();
        elValor.innerText = data.tasa ? data.tasa.toFixed(2) : '--';
        elDetalle.innerText = `Fecha: ${data.fecha || '--'} | Fuente: ${data.fuente || 'BCV'}`;
    } catch (e) {
        elValor.innerText = '--';
        elDetalle.innerText = 'No disponible';
        console.error("Error tasa hoy", e);
    }
}

// --- Historial (paginated) ---
async function cargarHistorial(page = 1) {
    paginaActual = page;
    const tbody = document.getElementById('tabla-tasas');
    tbody.innerHTML = '<tr><td colspan="3" class="p-12 text-center text-gray-400 italic">Cargando...</td></tr>';

    try {
        const res = await fetch(`${API_URL}/api/bcv/historial?page=${page}&per_page=50`, {
            headers: getAuthHeaders()
        });
        if (!res.ok) throw new Error(res.status);

        const data = await res.json();
        renderizarTabla(data.tasas || []);
    } catch (e) {
        tbody.innerHTML = '<tr><td colspan="3" class="p-12 text-center text-red-400 italic">Error al cargar historial</td></tr>';
        console.error("Error historial", e);
    }
}

function renderizarTabla(tasas) {
    const tbody = document.getElementById('tabla-tasas');

    if (!tasas.length) {
        tbody.innerHTML = '<tr><td colspan="3" class="p-12 text-center text-gray-400 italic">No hay tasas registradas</td></tr>';
        return;
    }

    tbody.innerHTML = tasas.map(t => `
        <tr class="hover:bg-teal-50/50 transition border-b border-gray-100 group">
            <td class="p-6">
                <div class="font-black text-gray-800 text-sm">${t.fecha}</div>
                <div class="text-[10px] uppercase font-bold tracking-widest text-gray-400 mt-1">${t.creado_en ? 'Reg: ' + t.creado_en : ''}</div>
            </td>
            <td class="p-6">
                <span class="text-lg font-black text-gray-800">${t.tasa.toFixed(4)}</span>
                <span class="text-xs text-gray-400 ml-1">Bs/USD</span>
            </td>
            <td class="p-6 text-center">
                <div class="flex items-center justify-center gap-2">
                    <button onclick="abrirModalEditar('${t.fecha}', ${t.tasa})"
                        class="bg-white border border-gray-200 text-gray-600 p-2 rounded-xl hover:bg-teal-600 hover:text-white hover:border-teal-600 transition shadow-sm"
                        title="Editar tasa">
                        <i data-lucide="edit-3" class="w-4 h-4"></i>
                    </button>
                    <button onclick="eliminarTasa('${t.fecha}')"
                        class="bg-white border border-red-100 text-red-400 p-2 rounded-xl hover:bg-red-500 hover:text-white transition"
                        title="Eliminar tasa">
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');

    if (window.lucide) lucide.createIcons();
}

// --- Modal: Crear ---
function abrirModalCrear() {
    editando = false;
    document.getElementById('modal-tasa-titulo').innerText = 'Nueva Tasa';
    document.getElementById('tasa-edit-fecha-original').value = '';
    document.getElementById('tasa-fecha').value = '';
    document.getElementById('tasa-fecha').disabled = false;
    document.getElementById('tasa-valor').value = '';
    document.getElementById('modalTasa').classList.remove('hidden');
}

// --- Modal: Editar ---
function abrirModalEditar(fecha, tasa) {
    editando = true;
    document.getElementById('modal-tasa-titulo').innerText = 'Editar Tasa';
    document.getElementById('tasa-edit-fecha-original').value = fecha;
    document.getElementById('tasa-fecha').value = fecha;
    document.getElementById('tasa-fecha').disabled = true;
    document.getElementById('tasa-valor').value = tasa;
    document.getElementById('modalTasa').classList.remove('hidden');
}

function cerrarModalTasa() {
    document.getElementById('modalTasa').classList.add('hidden');
}

// --- Guardar (Crear o Editar) ---
async function guardarTasa() {
    const fecha = document.getElementById('tasa-fecha').value;
    const valor = document.getElementById('tasa-valor').value;

    if (!fecha || !valor) {
        alert("Completa todos los campos");
        return;
    }

    try {
        let res;
        if (editando) {
            res = await fetch(`${API_URL}/api/bcv/tasa/${fecha}`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify({ tasa: parseFloat(valor) })
            });
        } else {
            res = await fetch(`${API_URL}/api/bcv/tasa`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ fecha, tasa: parseFloat(valor) })
            });
        }

        if (res.ok) {
            cerrarModalTasa();
            cargarHistorial(paginaActual);
            cargarTasaHoy();
        } else {
            const err = await res.json();
            alert("Error: " + (err.error || "No se pudo guardar"));
        }
    } catch (e) {
        alert("Error de conexión");
    }
}

// --- Eliminar ---
async function eliminarTasa(fecha) {
    if (!confirm(`¿Seguro que deseas eliminar la tasa del ${fecha}?`)) return;

    try {
        const res = await fetch(`${API_URL}/api/bcv/tasa/${fecha}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });

        if (res.ok) {
            cargarHistorial(paginaActual);
            cargarTasaHoy();
        } else {
            const err = await res.json();
            alert("Error: " + (err.error || "No se pudo eliminar"));
        }
    } catch (e) {
        alert("Error de conexión");
    }
}

// --- Forzar actualización desde BCV ---
async function forzarActualizacion() {
    const btn = document.querySelector('button[onclick="forzarActualizacion()"]');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i data-lucide="loader" class="w-5 h-5 animate-spin"></i> Actualizando...';
    btn.disabled = true;

    try {
        const res = await fetch(`${API_URL}/api/bcv/actualizar`, {
            method: 'POST',
            headers: getAuthHeaders()
        });

        if (res.ok) {
            cargarTasaHoy();
            cargarHistorial(1);
        } else {
            const err = await res.json();
            alert("Error: " + (err.error || "No se pudo actualizar"));
        }
    } catch (e) {
        alert("Error de conexión");
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
        if (window.lucide) lucide.createIcons();
    }
}
