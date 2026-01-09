const API_URL = "https://relaxed-jorrie-ergg99-b3008c3b.koyeb.app";

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
