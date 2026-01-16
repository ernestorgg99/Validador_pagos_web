document.addEventListener('DOMContentLoaded', () => {
    cargarDashboard();
    lucide.createIcons();

    // Listener para el filtro
    document.getElementById('daysFilter').addEventListener('change', cargarDashboard);
});

let trendChartInstance = null;
let bankChartInstance = null;
let operatorChartInstance = null;

async function cargarDashboard() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    const days = document.getElementById('daysFilter').value;

    try {
        // 1. Cargar Estadísticas Generales
        const response = await fetch(`${API_URL}/api/reports/dashboard-stats?days=${days}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error("Error cargando estadísticas");

        const data = await response.json();

        actualizarKPIs(data.kpi);
        renderTrendChart(data.daily_trend);
        renderBankChart(data.bank_distribution);
        renderOperatorChart(data.operator_performance);

        // 2. Cargar Conciliación del Día (Independiente del filtro de días, siempre es HOY)
        cargarConciliacion(token);

    } catch (error) {
        console.error("Dashboard error:", error);
    }
}

async function cargarConciliacion(token) {
    try {
        const response = await fetch(`${API_URL}/api/reports/conciliacion`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();

        document.getElementById('fecha-conciliacion').innerText = data.fecha;
        const tbody = document.getElementById('tabla-conciliacion');

        if (data.conciliacion.length === 0) {
            tbody.innerHTML = `<tr><td colspan="3" class="px-4 py-8 text-center text-gray-400 italic">No hay movimientos hoy</td></tr>`;
            return;
        }

        tbody.innerHTML = data.conciliacion.map(row => `
            <tr class="hover:bg-gray-50 transition">
                <td class="px-4 py-3 font-medium text-gray-700">${row.banco}</td>
                <td class="px-4 py-3 text-right font-mono text-gray-600">${row.transacciones}</td>
                <td class="px-4 py-3 text-right font-black text-blue-600">Bs ${formatMoney(row.total_monto)}</td>
            </tr>
        `).join('');

    } catch (error) {
        console.error("Error conciliacion:", error);
    }
}

function actualizarKPIs(kpi) {
    document.getElementById('kpi-monto').innerText = formatMoney(kpi.total_hoy);
    document.getElementById('kpi-cantidad').innerText = kpi.cantidad_hoy;
}

// --- Chart Rendering Functions ---

function renderTrendChart(data) {
    const ctx = document.getElementById('trendChart').getContext('2d');
    const labels = data.map(d => d.fecha);
    const values = data.map(d => d.total_monto);

    if (trendChartInstance) trendChartInstance.destroy();

    trendChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Monto Validado (Bs)',
                data: values,
                borderColor: '#10b981', // Emerald 500
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                tension: 0.4,
                fill: true,
                pointRadius: 4,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: { beginAtZero: true, grid: { borderDash: [2, 2] } },
                x: { grid: { display: false } }
            }
        }
    });
}

function renderBankChart(data) {
    const ctx = document.getElementById('bankChart').getContext('2d');
    const labels = data.map(d => d.banco);
    const values = data.map(d => d.total_monto);

    if (bankChartInstance) bankChartInstance.destroy();

    bankChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: values,
                backgroundColor: [
                    '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#10b981', '#6366f1'
                ],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 8 } }
            },
            cutout: '70%'
        }
    });
}

function renderOperatorChart(data) {
    const ctx = document.getElementById('operatorChart').getContext('2d');
    const labels = data.map(d => d.usuario);
    const values = data.map(d => d.cantidad);

    if (operatorChartInstance) operatorChartInstance.destroy();

    operatorChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Validaciones',
                data: values,
                backgroundColor: '#f97316', // Orange 500
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: { beginAtZero: true, grid: { display: false } },
                x: { grid: { display: false } }
            }
        }
    });
}

function formatMoney(amount) {
    return amount.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
