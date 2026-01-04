const API_URL = "https://relaxed-jorrie-ergg99-b3008c3b.koyeb.app";

document.getElementById('paymentForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const loading = document.getElementById('layoutLoading');
    const successView = document.getElementById('successView');
    const resDiv = document.getElementById('resultado');
    const msg = document.getElementById('status-message');

    // Iniciar carga
    loading.classList.remove('hidden');
    resDiv.classList.add('hidden');

    const params = new URLSearchParams({
        referencia_fin: document.getElementById('referencia_fin').value,
        banco_origen: document.getElementById('banco_origen').value,
        monto: document.getElementById('monto').value,
        usuario_nombre: "WebUser"
    });

    try {
        const response = await fetch(`${API_URL}/api/pagos/validar_en_gmail?${params}`);
        const data = await response.json();
        
        loading.classList.add('hidden');

        if (response.status === 200) {
            // ÉXITO: PANTALLA COMPLETA
            successView.classList.remove('hidden');
            successView.classList.add('flex');
            lucide.createIcons();
        } else {
            // ERRORES O DUPLICADOS
            resDiv.classList.remove('hidden');
            if (response.status === 409) {
                resDiv.className = "mt-10 p-8 rounded-[2rem] border-4 bg-amber-50 border-amber-400 text-amber-900";
                msg.innerText = `ATENCIÓN: Pago ya registrado por ${data.usuario || 'otro operador'}.`;
            } else {
                resDiv.className = "mt-10 p-8 rounded-[2rem] border-4 bg-red-50 border-red-400 text-red-900";
                msg.innerText = data.error || "PAGO NO ENCONTRADO";
            }
        }
    } catch (e) {
        loading.classList.add('hidden');
        alert("ERROR: No se pudo establecer conexión con el servidor Flask.");
    }
});

lucide.createIcons();