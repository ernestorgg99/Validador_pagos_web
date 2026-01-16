// API_URL cargado desde config.js

const form = document.getElementById('paymentForm');
const loading = document.getElementById('layoutLoading');
const successView = document.getElementById('successView');
const resultadoDiv = document.getElementById('resultado');
const statusMessage = document.getElementById('status-message');

form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // 1. Limpiar estados previos y mostrar carga
    resultadoDiv.classList.add('hidden');
    loading.classList.remove('hidden');

    const montoBruto = document.getElementById('monto').value;
    const montoLimpio = montoBruto.replace(',', '.');
    const params = new URLSearchParams({
        referencia_fin: document.getElementById('referencia_fin').value,
        banco_origen: document.getElementById('banco_origen').value,
        monto: montoLimpio,
        usuario_nombre: localStorage.getItem('usuario_nombre') || 'desconocido'
    });

    try {
        const response = await fetch(`${API_URL}/api/pagos/validar_en_gmail?${params}`);
        const data = await response.json();

        // 2. Ocultar pantalla de carga
        loading.classList.add('hidden');

        if (response.ok) {
            // ÉXITO: Pantalla verde
            successView.classList.remove('hidden');
            if (window.lucide) lucide.createIcons();
        } else {
            // ERROR CONTROLADO: Pasamos todo el objeto 'data' para extraer usuario y fecha
            mostrarMensajeError(data);
        }

    } catch (error) {
        // ERROR DE RED O SERVIDOR CAÍDO
        loading.classList.add('hidden');
        console.error("Error de conexión:", error);
        mostrarMensajeError("No se pudo conectar con el servidor. Verifique su conexión.");
    }
});

function mostrarMensajeError(data) {
    resultadoDiv.classList.remove('hidden');
    const textoError = data.error || "Error al validar";

    // Si el error es por pago duplicado (usualmente el servidor envía usuario y fecha)
    if (textoError.includes("anteriormente") || textoError.includes("validado")) {
        resultadoDiv.className = "mt-10 p-8 rounded-[2rem] border-4 border-amber-200 bg-amber-50 text-amber-700 animate-bounceIn shadow-inner";

        // Construimos el HTML con la leyenda detallada
        statusMessage.innerHTML = `
            <div class="flex flex-col items-center gap-2">
                <i data-lucide="info" class="w-8 h-8 mb-2"></i>
                <strong class="text-2xl uppercase tracking-tighter">${textoError}</strong>
                <div class="h-px w-full bg-amber-200 my-2"></div>
                <div class="text-sm space-y-1">
                    <p class="font-bold uppercase opacity-80">Detalles del registro:</p>
                    <p><span class="font-black">VALIDADO POR:</span> ${data.usuario || 'N/A'}</p>
                    <p><span class="font-black">FECHA Y HORA:</span> ${data.fecha || 'N/A'}</p>
                    <p><span class="font-black">REFERENCIA:</span> ${data.referencia || 'N/A'}</p>
                    <p><span class="font-black">MONTO:</span> Bs ${data.monto || 'N/A'}</p>
                    <p><span class="font-black">BANCO ORIGEN:</span> ${data.banco_origen || 'N/A'}</p>
                    </div>
            </div>
        `;
    } else {
        // Errores generales (Monto incorrecto, referencia no encontrada, etc.)
        resultadoDiv.className = "mt-10 p-8 rounded-[2rem] border-4 border-red-200 bg-red-50 text-red-700 animate-bounceIn";
        statusMessage.innerHTML = `
            <div class="flex flex-col items-center gap-2">
                <i data-lucide="x-circle" class="w-8 h-8 mb-2"></i>
                <strong class="text-xl">${textoError}</strong>
            </div>
        `;
    }

    if (window.lucide) lucide.createIcons();
}

// --- LÓGICA DE IMPRESIÓN (TICKERA 80MM) ---
async function imprimirReporteDiario() {
    const btn = document.getElementById('btn-imprimir');
    // Guardar estado original si el botón existe (por seguridad)
    let originalText = "";
    if (btn) {
        originalText = btn.innerHTML;
        btn.innerHTML = `<i data-lucide="loader" class="animate-spin"></i> Generando...`;
        btn.disabled = true;
        if (window.lucide) lucide.createIcons();
    }

    try {
        // 1. Obtener datos del usuario y fecha
        const usuario = localStorage.getItem('usuario_nombre');
        if (!usuario) { alert("Usuario no identificado"); return; }

        const hoy = new Date();
        const yyyy = hoy.getFullYear();
        const mm = String(hoy.getMonth() + 1).padStart(2, '0');
        const dd = String(hoy.getDate()).padStart(2, '0');
        const fechaStr = `${yyyy}-${mm}-${dd}`;

        // 2. Fetch al endpoint específico de CIERRE
        const params = new URLSearchParams({
            usuario: usuario,
            fecha: fechaStr
        });

        const response = await fetch(`${API_URL}/api/pagos/reporte_cierre?${params.toString()}`, {
            headers: getAuthHeaders() // Asegurar Auth
        });

        if (!response.ok) throw new Error("Error al obtener datos del cierre");

        const data = await response.json();
        const pagos = data.pagos || [];
        const totalMonto = data.total_monto || 0;
        const totalOps = data.total_operaciones || 0;

        // 3. Generar HTML del Ticket
        const ticketHtml = `
            <div style="font-family: 'Courier New', monospace; width: 80mm; padding: 10px; color: black;">
                <h2 style="text-align: center; margin: 0; font-size: 16px; font-weight: bold;">REPORTE DE CIERRE</h2>
                <h3 style="text-align: center; margin: 0; font-size: 14px;">VALIDADOR DE PAGOS</h3>
                <br>
                <div style="font-size: 12px;">
                    <p style="margin: 2px 0;"><strong>Fecha:</strong> ${fechaStr}</p>
                    <p style="margin: 2px 0;"><strong>Hora:</strong> ${hoy.toLocaleTimeString()}</p>
                    <p style="margin: 2px 0;"><strong>Usuario:</strong> ${usuario}</p>
                </div>
                <hr style="border-top: 1px dashed black;">
                <table style="width: 100%; font-size: 14px;">
                    <thead>
                        <tr style="text-align: left;">
                            <th>BCO</th>
                            <th>REF</th>
                            <th style="text-align: right;">MONTO</th>
                        </tr>
                    </thead>
                    <tbody>  
                        ${pagos.map(p => `
                            <tr>
                                <strong><td>${p.banco_origen.substring(0, 20)}</td></strong>
                                <strong><td>${p.referencia}</td></strong>
                                <strong><td style="text-align: right;">${parseFloat(p.monto).toFixed(2)}</td></strong>
                            </tr>
                        `).join('')}
                    </tbody>   
                </table>
                <hr style="border-top: 1px dashed black;">
                <div style="text-align: right; font-size: 14px;">
                    <p style="margin: 5px 0;"><strong>CANTIDAD:</strong> ${totalOps}</p>
                    <p style="margin: 5px 0;"><strong>TOTAL:</strong> ${parseFloat(totalMonto).toLocaleString('es-VE', { minimumFractionDigits: 2 })} Bs.</p>
                </div>
                <br>
                <p style="text-align: center; font-size: 10px;">--- FIN DEL REPORTE ---</p>
                <br><br>
            </div>
        `;

        // 4. Imprimir
        imprimirHTML(ticketHtml);

    } catch (e) {
        console.error(e);
        alert("Error generando el reporte: " + e.message);
    } finally {
        if (btn) {
            btn.innerHTML = originalText;
            btn.disabled = false;
            if (window.lucide) lucide.createIcons();
        }
    }
}

function imprimirHTML(htmlContent) {
    // Crear iframe oculto para imprimir
    let iframe = document.getElementById('print-frame');
    if (!iframe) {
        iframe = document.createElement('iframe');
        iframe.id = 'print-frame';
        iframe.style.display = 'none';
        document.body.appendChild(iframe);
    }

    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(`
        <html>
        <head>
            <title>Imprimir</title>
            <style>
                @page { size: 80mm auto; margin: 0; }
                body { margin: 0; }
            </style>
        </head>
        <body>${htmlContent}</body>
        </html>
    `);
    doc.close();

    // Esperar a que cargue y llamar a print
    setTimeout(() => {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
    }, 500);
}


