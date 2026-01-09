if (localStorage.getItem('usuario_nombre')) {
    window.location.href = "index.html";
}
const API_URL = "https://relaxed-jorrie-ergg99-b3008c3b.koyeb.app";

// --- INICIALIZACIÓN DE ICONOS ---
document.addEventListener('DOMContentLoaded', () => {
    if (window.lucide) lucide.createIcons();
});

// --- LÓGICA DE REGISTRO ---
document.getElementById('signupForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const msgDiv = document.getElementById('mensaje');
    
    // Captura de datos
    const payload = {
        nombre: document.getElementById('nombre').value,
        usuario: document.getElementById('usuario').value,
        email: document.getElementById('email').value,
        password: document.getElementById('password').value
    };

    try {
        const response = await fetch(`${API_URL}/api/auth/signup`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(payload)
        });
        
        const data = await response.json();

        msgDiv.classList.remove('hidden');

        if (response.ok) {
            // Caso de éxito: Registro recibido
            msgDiv.className = "mt-6 p-6 rounded-[2rem] bg-green-50 text-green-700 border-2 border-green-200 text-center font-bold";
            msgDiv.innerHTML = `
                <div class="flex flex-col items-center">
                    <i data-lucide="clock" class="mb-2 w-8 h-8"></i>
                    <p>${data.mensaje}</p>
                    <span class="text-xs mt-2 opacity-70">Serás redirigido al login en breve...</span>
                </div>
            `;
            document.getElementById('signupForm').reset();
            
            // Redirigir al login después de 3 segundos
            setTimeout(() => window.location.href = "login.html", 3500);
        } else {
            // Caso de error: Usuario duplicado, etc.
            msgDiv.className = "mt-6 p-6 rounded-[2rem] bg-red-50 text-red-700 border-2 border-red-200 text-center font-bold";
            msgDiv.innerText = data.error;
        }

        // Actualizar iconos de Lucide si se insertaron nuevos
        if (window.lucide) lucide.createIcons();

    } catch (error) {
        console.error("Error en el registro:", error);
        msgDiv.classList.remove('hidden');
        msgDiv.className = "mt-6 p-6 rounded-[2rem] bg-red-50 text-red-700 border-2 border-red-200 text-center font-bold";
        msgDiv.innerText = "Error de conexión con el servidor.";
    }
});