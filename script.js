// ==========================================
// 1. KONFIGURASI FIREBASE
// ==========================================
const firebaseConfig = {
    databaseURL: "https://energy-monitoring-pbs-itk-default-rtdb.asia-southeast1.firebasedatabase.app/"
};

// Inisialisasi Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// ==========================================
// 2. INISIALISASI GRAFIK CHART.JS
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

// ==========================================
// 3. VARIABEL PENAMPUNG DATA
// ==========================================
let dbData = {
    AMPERE: { R: 0, S: 0, T: 0 }, 
    VOLTAGE: { RN: 0, SN: 0, TN: 0, RS: 0, ST: 0, RT: 0 },
    KW: { R: 0, S: 0, T: 0, TOTAL: 0 }, 
    KVA: { R: 0, S: 0, T: 0, TOTAL: 0 },
    KVAR: { TOTAL: 0 },
    KWH: { TOTAL: 0 }
};

let currentChartCategory = 'AMPERE';

// ==========================================
// 4. FUNGSI UPDATE UI DASHBOARD
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

    document.getElementById('val-kwh').innerText = (dbData.KWH.TOTAL || 0).toLocaleString('en-US', {minimumFractionDigits: 1, maximumFractionDigits: 1});
    document.getElementById('val-kw-tot').innerText = (dbData.KW.TOTAL || 0).toFixed(2);
    document.getElementById('val-kvar-tot').innerText = (dbData.KVAR.TOTAL || 0).toFixed(2);
}

// Event Listener untuk Dropdown
document.querySelectorAll('.line-select').forEach(select => {
    select.addEventListener('change', updateDashboard);
});

// ==========================================
// 5. FUNGSI TOMBOL GRAFIK
// ==========================================
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
// 6. LISTENER FIREBASE (PUSH REAL-TIME)
// ==========================================
const statusText = document.getElementById('status-text');
console.log("Mencoba terhubung ke Firebase..."); 

database.ref('monitoring').on('value', (snapshot) => {
    const data = snapshot.val();
    console.log("Data Firebase:", data); 
    
    if (data) {
        // Timpa data lokal dengan data dari Firebase
        dbData = data;
        
        // Perbarui UI
        updateDashboard();

        // Update animasi ujung grafik
        let liveValue = 0;
        if(currentChartCategory === 'AMPERE') liveValue = dbData.AMPERE.R;
        else if(currentChartCategory === 'VOLTAGE') liveValue = dbData.VOLTAGE.RS;
        else if(currentChartCategory === 'KW') liveValue = dbData.KW.TOTAL;
        else if(currentChartCategory === 'KVA') liveValue = dbData.KVA.TOTAL;

        let chartData = energyChart.data.datasets[0].data;
        chartData.shift(); 
        chartData.push(liveValue); 
        energyChart.update();

        // Indikator Status
        statusText.innerHTML = '<i class="fa-solid fa-circle"></i> ONLINE';
        statusText.style.color = 'var(--accent-orange)';
    } else {
        console.warn("Terhubung ke Firebase, tetapi folder 'monitoring' kosong.");
    }
}, (error) => {
    console.error("Gagal terhubung ke Firebase:", error);
    statusText.innerHTML = '<i class="fa-solid fa-circle"></i> OFFLINE';
    statusText.style.color = 'red';
});