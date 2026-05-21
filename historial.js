// API_URL y funciones de utils.js disponibles globalmente
// Verificamos auth al inicio
if (!localStorage.getItem('usuario_nombre')) {
    window.location.href = "login.html";
}

// Función para cerrar sesión (puedes llamarla desde un botón)
function cerrarSesion() {
    localStorage.clear();
    window.location.href = "login.html";
}

async function cargarDatos(page = 1) {
    const icon = document.getElementById('sync-icon');
    const inicio = document.getElementById('fecha-inicio').value;
    const fin = document.getElementById('fecha-fin').value;
    const banco = document.getElementById('filtro-banco').value;
    const referencia = document.getElementById('filtro-referencia').value;

    if (icon) icon.classList.add('animate-spin');
    paginaActual = page;

    // Scroll suave hacia arriba
    window.scrollTo({ top: 0, behavior: 'smooth' });

    let params = new URLSearchParams({ page: page, per_page: 15 });
    if (inicio && fin) { params.append('fecha_inicio', inicio); params.append('fecha_fin', fin); }
    if (banco) params.append('banco', banco);
    if (referencia) params.append('referencia', referencia);

    try {
        const response = await fetch(`${API_URL}/api/pagos/listar?${params.toString()}`);
        const data = await response.json();

        totalPaginas = data.pages || 1;
        renderizar(data.pagos || []);
        actualizarControles();
    } catch (e) {
        console.error("Error:", e);
    } finally {
        if (icon) setTimeout(() => icon.classList.remove('animate-spin'), 500);
    }
}

function renderizar(pagos) {
    const tbody = document.getElementById('tabla-pagos-desktop');
    const mobileDiv = document.getElementById('lista-pagos-mobile');
    tbody.innerHTML = '';
    mobileDiv.innerHTML = '';

    pagos.forEach(p => {
        const esEgreso = p.tipo_transaccion === "EGRESO";
        const colorMonto = esEgreso ? "text-red-600" : "text-emerald-600";
        const signo = esEgreso ? "-" : "+";
        const fechaObj = new Date(p.fecha_hora);

        const usd = p.monto_usd ? `$ ${parseFloat(p.monto_usd).toFixed(2)}` : '--';
        const tasaInfo = p.tasa_bcv ? `@ ${p.tasa_bcv.toFixed(2)}` : '';

        tbody.innerHTML += `
            <tr class="hover:bg-blue-50 transition-colors border-b">
                <td class="p-6 font-bold text-gray-700">${p.banco_origen}</td>
                <td class="p-6 font-black ${colorMonto}">${signo} ${parseFloat(p.monto).toFixed(2)}</td>
                <td class="p-6 font-black text-teal-600">${usd} <span class="text-[10px] text-gray-400">${tasaInfo}</span></td>
                <td class="p-6 font-mono text-gray-500 font-bold">${p.referencia}</td>
                <td class="p-6 text-gray-500 text-sm">${fechaObj.toLocaleString()}</td>
            </tr>`;

        mobileDiv.innerHTML += `
            <div class="p-6 border-b border-gray-100">
                <div class="flex justify-between items-center">
                    <div class="flex flex-col">
                        <span class="text-xs font-black text-blue-500 uppercase">${p.banco_origen}</span>
                        <span class="text-xl font-black ${colorMonto}">${signo} ${parseFloat(p.monto).toFixed(2)} Bs.</span>
                        <span class="text-sm font-black text-teal-600">${usd}</span>
                        <span class="text-xs font-mono text-gray-400">Ref: ${p.referencia}</span>
                    </div>
                    <div class="text-[10px] text-gray-400 font-bold">${fechaObj.toLocaleDateString()}</div>
                </div>
            </div>`;
    });
    lucide.createIcons();
}

function actualizarControles() {
    document.getElementById('pagina-info').innerText = `Página ${paginaActual} de ${totalPaginas}`;
    document.getElementById('btn-prev').disabled = paginaActual <= 1;
    document.getElementById('btn-next').disabled = paginaActual >= totalPaginas;
}

function cambiarPagina(delta) {
    cargarDatos(paginaActual + delta);
}

function limpiarFiltros() {
    document.getElementById('fecha-inicio').value = '';
    document.getElementById('fecha-fin').value = '';
    document.getElementById('filtro-banco').value = '';
    document.getElementById('filtro-referencia').value = '';
    cargarDatos(1);
}

// Cargar datos al abrir la página
window.onload = () => cargarDatos(1);