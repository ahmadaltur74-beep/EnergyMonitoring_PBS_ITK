// ==========================================
// 1. KONFIGURASI FIREBASE
// ==========================================
const firebaseConfig = {
    databaseURL: "https://energy-monitoring-pbs-itk-default-rtdb.asia-southeast1.firebasedatabase.app/"
};
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// ==========================================
// 2. SISTEM NAVIGASI TAB
// ==========================================
const navHome = document.getElementById('nav-home');
const navLogs = document.getElementById('nav-logs');
const viewHome = document.getElementById('view-home');
const viewLogs = document.getElementById('view-logs');

navHome.addEventListener('click', () => {
    navHome.classList.add('active');
    navLogs.classList.remove('active');
    viewHome.style.display = 'block';
    viewLogs.style.display = 'none';
    energyChart.update(); // Menggambar ulang grafik saat tab kembali dibuka
});

navLogs.addEventListener('click', () => {
    navLogs.classList.add('active');
    navHome.classList.remove('active');
    viewLogs.style.display = 'block';
    viewHome.style.display = 'none';
});

// ==========================================
// 3. INISIALISASI GRAFIK CHART.JS
// ==========================================
const ctx = document.getElementById('energyChart').getContext('2d');
let gradientOrange = ctx.createLinearGradient(0, 0, 0, 200);
gradientOrange.addColorStop(0, 'rgba(255, 152, 0, 0.4)');
gradientOrange.addColorStop(1, 'rgba(255, 152, 0, 0.0)');

let energyChart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: ['-', '-', '-', '-', '-', '-', 'LIVE'],
        datasets: [{
            label: 'AMPERE',
            data: [0, 0, 0, 0, 0, 0, 0],
            borderColor: '#ff9800',
            backgroundColor: gradientOrange,
            borderWidth: 2,
            pointBackgroundColor: '#121215',
            pointBorderColor: '#ff9800',
            pointBorderWidth: 2,
            pointRadius: 3,
            fill: true,
            tension: 0.4 
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
            y: { beginAtZero: true, grid: { color: 'rgba(255, 255, 255, 0.03)' }, ticks: { color: '#888888', font: {size: 10} } },
            x: { grid: { display: false }, ticks: { color: '#888888', font: {size: 10}, maxTicksLimit: 5 } }
        }
    }
});

let dbData = { AMPERE: { R: 0 }, VOLTAGE: { RS: 0 }, KW: { TOTAL: 0 }, KVA: { TOTAL: 0 }, KVAR: { TOTAL: 0 }, KWH: { TOTAL: 0 } };
let currentChartCategory = 'AMPERE';

// ==========================================
// 4. FUNGSI UPDATE UI (HOME)
// ==========================================
function updateDashboard() {
    const lineAmpere = document.getElementById('line-ampere').value;
    const lineVolt = document.getElementById('line-volt').value;
    const lineKW = document.getElementById('line-kw').value;
    const lineKVA = document.getElementById('line-kva').value;

    document.getElementById('val-ampere').innerText = `${(dbData.AMPERE[lineAmpere] || 0).toFixed(2)} A`;
    document.getElementById('val-volt').innerText = `${(dbData.VOLTAGE[lineVolt] || 0).toFixed(1)} V`;
    document.getElementById('val-kw').innerText = `${(dbData.KW[lineKW] || 0).toFixed(2)} kW`;
    document.getElementById('val-kva').innerText = `${(dbData.KVA[lineKVA] || 0).toFixed(2)} kVA`;

    document.getElementById('val-kwh').innerText = (dbData.KWH.TOTAL || 0).toLocaleString('en-US', {minimumFractionDigits: 1});
    document.getElementById('val-kw-tot').innerText = (dbData.KW.TOTAL || 0).toFixed(2);
    document.getElementById('val-kvar-tot').innerText = (dbData.KVAR.TOTAL || 0).toFixed(2);
}

document.querySelectorAll('.line-select').forEach(select => select.addEventListener('change', updateDashboard));

function updateChart(category) {
    document.querySelectorAll('.chart-buttons-scroll button').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    currentChartCategory = category;

    if (category === 'AMPERE') { energyChart.data.datasets[0].borderColor = '#ff9800'; } 
    else if (category === 'VOLTAGE') { energyChart.data.datasets[0].borderColor = '#ffb74d'; } 
    else if (category === 'KW') { energyChart.data.datasets[0].borderColor = '#e65100'; } 
    else if (category === 'KVA') { energyChart.data.datasets[0].borderColor = '#ffa726'; }

    energyChart.data.datasets[0].label = category;
    energyChart.update();
}

// ==========================================
// 5. LISTENER FIREBASE & LOG PENCATATAN
// ==========================================
const statusText = document.getElementById('status-text');
const logsTbody = document.getElementById('logs-tbody');

database.ref('monitoring').on('value', (snapshot) => {
    const data = snapshot.val();
    
    if (data) {
        dbData = data;
        updateDashboard();

        // 1. Update Garis Grafik Bergerak
        let liveValue = 0;
        if(currentChartCategory === 'AMPERE') liveValue = dbData.AMPERE.R;
        else if(currentChartCategory === 'VOLTAGE') liveValue = dbData.VOLTAGE.RS;
        else if(currentChartCategory === 'KW') liveValue = dbData.KW.TOTAL;
        else if(currentChartCategory === 'KVA') liveValue = dbData.KVA.TOTAL;

        let chartData = energyChart.data.datasets[0].data;
        chartData.shift(); 
        chartData.push(liveValue); 
        energyChart.update();

        // 2. Masukkan Data ke Tabel Logs (Secara Berkelanjutan)
        const waktuSekarang = new Date().toLocaleTimeString('id-ID', { hour12: false });
        
        const newRow = document.createElement('tr');
        newRow.innerHTML = `
            <td>${data.last_update ? data.last_update.split(' ')[1] : waktuSekarang}</td>
            <td>${(data.VOLTAGE.RS || 0).toFixed(1)}</td>
            <td>${(data.AMPERE.R || 0).toFixed(2)}</td>
            <td>${(data.KW.TOTAL || 0).toFixed(2)}</td>
        `;
        
        // Menyisipkan baris baru selalu di urutan paling atas
        logsTbody.prepend(newRow);

        // Membatasi tabel hanya menyimpan 100 baris terbaru agar browser tidak berat
        if (logsTbody.children.length > 100) {
            logsTbody.removeChild(logsTbody.lastChild);
        }

        statusText.innerHTML = '<i class="fa-solid fa-circle"></i> ONLINE';
        statusText.style.color = 'var(--accent-orange)';
    }
}, (error) => {
    statusText.innerHTML = '<i class="fa-solid fa-circle"></i> OFFLINE';
    statusText.style.color = 'red';
});