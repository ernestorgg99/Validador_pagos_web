// API_URL cargado desde config.js

document.addEventListener('DOMContentLoaded', () => {
    cargarDatosReporte();
    lucide.createIcons();
});

// --- NUEVA FUNCIÓN PARA CERRAR EL MODAL ---
function cerrarModal() {
    document.getElementById('modalDetalle').classList.add('hidden');
}

async function cargarDatosReporte() {
    try {
        const response = await fetch(`${API_URL}/api/admin/historial_completo`);
        const pagos = await response.json();

        document.getElementById('total-general').innerText = pagos.length;

        const resumen = pagos.reduce((acc, pago) => {
            const user = pago.usuario_nombre || 'Sistema';
            if (!acc[user]) acc[user] = [];
            acc[user].push(pago);
            return acc;
        }, {});

        // --- NUEVA LÓGICA: Convertir a array y ordenar de mayor a menor ---
        const usuariosOrdenados = Object.keys(resumen).sort((a, b) => {
            return resumen[b].length - resumen[a].length;
        });

        const container = document.getElementById('fichasContainer');
        container.innerHTML = "";

        usuariosOrdenados.forEach(user => {
            const cant = resumen[user].length;
            const ficha = document.createElement('div');
            // Clases actualizadas para ser más compactas en móvil (p-4 en lugar de p-8)
            ficha.className = "bg-white p-4 md:p-6 rounded-[1.5rem] md:rounded-[2.5rem] shadow-md hover:shadow-xl transition-all cursor-pointer border-b-4 md:border-b-8 border-blue-600 group";
            ficha.onclick = () => mostrarDetalle(user, resumen[user]);

            ficha.innerHTML = `
                <div class="flex justify-between items-center mb-2">
                    <div class="bg-blue-50 text-blue-600 p-2 md:p-3 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition">
                        <i data-lucide="user" class="w-4 h-4 md:w-6 md:h-6"></i>
                    </div>
                    <span class="text-2xl md:text-4xl font-black text-gray-800">${cant}</span>
                </div>
                <div>
                    <p class="text-[8px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Usuario</p>
                    <h4 class="text-sm md:text-lg font-black text-gray-700 uppercase truncate">${user}</h4>
                </div>
            `;
            container.appendChild(ficha);
        });
        lucide.createIcons();
    } catch (error) {
        console.error("Error cargando reporte:", error);
    }
}
function mostrarDetalle(usuario, listaPagos) {
    const modal = document.getElementById('modalDetalle');
    document.getElementById('det-user-name').innerText = usuario;
    modal.classList.remove('hidden');

    const tabla = document.getElementById('listaDetalleBody');
    const filtroInput = document.getElementById('filtroFecha');

    // Resetear el filtro al abrir un usuario nuevo
    filtroInput.value = "";

    const opcionesFecha = {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit', hour12: true
    };
    const formateador = new Intl.DateTimeFormat('es-VE', opcionesFecha);

    const pintarTabla = (datos) => {
        if (datos.length === 0) {
            tabla.innerHTML = `<tr><td colspan="4" class="py-8 text-center text-gray-400 italic">No hay pagos para esta fecha</td></tr>`;
            return;
        }

        tabla.innerHTML = datos.map(p => {
            const fechaObj = new Date(p.fecha_validacion || p.fecha);
            const fechaFormateada = formateador.format(fechaObj);

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
                </tr>
            `;
        }).join('');
    };

    // --- LÓGICA DEL FILTRO DE FECHA RESTAURADA ---
    filtroInput.onchange = (e) => {
        const fechaSeleccionada = e.target.value; // Formato YYYY-MM-DD
        if (!fechaSeleccionada) {
            pintarTabla(listaPagos);
            return;
        }

        const filtrados = listaPagos.filter(p => {
            const f = p.fecha_validacion || p.fecha;
            return f.startsWith(fechaSeleccionada);
        });
        pintarTabla(filtrados);
    };

    pintarTabla(listaPagos);
}