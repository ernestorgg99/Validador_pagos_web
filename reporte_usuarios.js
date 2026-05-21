document.addEventListener('DOMContentLoaded', () => {
    cargarDatosReporte();
    lucide.createIcons();
});

function cerrarModal() {
    document.getElementById('modalDetalle').classList.add('hidden');
}

async function cargarDatosReporte() {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = 'login.html';
            return;
        }

        const response = await fetch(`${API_URL}/api/reports/user-performance`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                localStorage.removeItem('token');
                alert("Sesión expirada. Por favor, inicia sesión nuevamente.");
                window.location.href = 'login.html';
                return;
            }
            throw new Error(`Error HTTP: ${response.status}`);
        }

        const data = await response.json();

        document.getElementById('total-general').innerText = data.total_validaciones || 0;

        const container = document.getElementById('fichasContainer');
        container.innerHTML = "";

        (data.users || []).forEach(user => {
            const ficha = document.createElement('div');
            ficha.className = "bg-white p-4 md:p-6 rounded-[1.5rem] md:rounded-[2.5rem] shadow-md hover:shadow-xl transition-all cursor-pointer border-b-4 md:border-b-8 border-blue-600 group";
            ficha.onclick = () => mostrarDetalle(user.usuario);
            ficha.innerHTML = `
                <div class="flex justify-between items-center mb-2">
                    <div class="bg-blue-50 text-blue-600 p-2 md:p-3 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition">
                        <i data-lucide="user" class="w-4 h-4 md:w-6 md:h-6"></i>
                    </div>
                    <span class="text-2xl md:text-4xl font-black text-gray-800">${user.total_validaciones}</span>
                </div>
                <div>
                    <p class="text-[8px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Usuario</p>
                    <h4 class="text-sm md:text-lg font-black text-gray-700 uppercase truncate">${user.usuario}</h4>
                </div>
                <div class="mt-2 flex justify-between text-[10px] font-bold">
                    <span class="text-blue-600">Bs ${user.total_monto_bs.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</span>
                    ${user.total_monto_usd != null ? `<span class="text-teal-600">$${user.total_monto_usd.toFixed(2)}</span>` : ''}
                </div>
            `;
            container.appendChild(ficha);
        });
        lucide.createIcons();
    } catch (error) {
        console.error("Error cargando reporte:", error);
    }
}

async function mostrarDetalle(usuario) {
    const modal = document.getElementById('modalDetalle');
    document.getElementById('det-user-name').innerText = usuario;
    modal.classList.remove('hidden');

    const tabla = document.getElementById('listaDetalleBody');
    const filtroInput = document.getElementById('filtroFecha');

    filtroInput.value = "";

    const opcionesFecha = {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit', hour12: true
    };
    const formateador = new Intl.DateTimeFormat('es-VE', opcionesFecha);

    let pagosCache = [];

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/api/admin/historial_completo?per_page=500&usuario=${encodeURIComponent(usuario)}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error("Error al cargar detalle");
        const data = await response.json();
        pagosCache = data.pagos || [];
    } catch (e) {
        console.error("Error cargando detalle de usuario:", e);
        tabla.innerHTML = `<tr><td colspan="5" class="py-8 text-center text-red-400 italic">Error al cargar datos</td></tr>`;
        return;
    }

    const pintarTabla = (datos) => {
        if (datos.length === 0) {
            tabla.innerHTML = `<tr><td colspan="5" class="py-8 text-center text-gray-400 italic">No hay pagos para esta fecha</td></tr>`;
            return;
        }

        tabla.innerHTML = datos.map(p => {
            const fechaObj = new Date(p.fecha_validacion || p.fecha);
            const fechaFormateada = formateador.format(fechaObj);
            const usd = p.monto_usd ? `$ ${parseFloat(p.monto_usd).toFixed(2)}` : '--';

            return `
                <tr class="border-b border-gray-50 hover:bg-gray-50 transition">
                    <td class="py-4 text-xs font-medium text-gray-600">${fechaFormateada}</td>
                    <td class="py-4 font-mono text-blue-700 bg-blue-50/50 px-2 rounded-lg">${p.referencia}</td>
                    <td class="py-4 uppercase text-[10px] font-bold text-gray-400">${p.banco_origen}</td>
                    <td class="py-4 text-right">
                        <span class="text-blue-600 font-black px-3 py-1 bg-blue-50 rounded-full">
                            Bs ${parseFloat(p.monto).toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                        </span>
                    </td>
                    <td class="py-4 text-right">
                        <span class="text-teal-600 font-black px-3 py-1 bg-teal-50 rounded-full">
                            ${usd}
                        </span>
                    </td>
                </tr>
            `;
        }).join('');
    };

    filtroInput.onchange = (e) => {
        const fechaSeleccionada = e.target.value;
        if (!fechaSeleccionada) {
            pintarTabla(pagosCache);
            return;
        }
        const filtrados = pagosCache.filter(p => {
            const f = p.fecha_validacion || p.fecha;
            return f.startsWith(fechaSeleccionada);
        });
        pintarTabla(filtrados);
    };

    pintarTabla(pagosCache);
}