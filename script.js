// --- 1. KONFIGURASI FIREBASE ---
        const firebaseConfig = {
            apiKey: "AIzaSyCJHWvBxtmTtKJsmpkdnHukF_yYAzqNdYc", // Kunci yang 100% benar
            authDomain: "energy-monitoring-pbs-itk.firebaseapp.com",
            databaseURL: "https://energy-monitoring-pbs-itk-default-rtdb.asia-southeast1.firebasedatabase.app",
            projectId: "energy-monitoring-pbs-itk",
            storageBucket: "energy-monitoring-pbs-itk.firebasestorage.app", // Ini juga disesuaikan
            messagingSenderId: "30345474024",
            appId: "1:30345474024:web:1ea75cd1ccb8161e81be5d",
            measurementId: "G-FXDCSMHXX7"
        };

// Inisialisasi Firebase
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
    energyChart.update();
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
let gradientBlue = ctx.createLinearGradient(0, 0, 0, 200);
gradientBlue.addColorStop(0, 'rgba(0, 168, 255, 0.4)'); 
gradientBlue.addColorStop(1, 'rgba(0, 168, 255, 0.0)'); 

let energyChart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: ['-', '-', '-', '-', '-', '-', 'LIVE'],
        datasets: [{
            label: 'AMPERE',
            data: [0, 0, 0, 0, 0, 0, 0],
            borderColor: '#00a8ff', 
            backgroundColor: gradientBlue,
            borderWidth: 2,
            pointBackgroundColor: '#121215',
            pointBorderColor: '#00a8ff',
            pointBorderWidth: 2,
            pointRadius: 3,
            fill: true,
            tension: 0.4 
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 500, easing: 'linear' },
        plugins: { legend: { display: false } },
        scales: {
            y: { beginAtZero: true, grid: { color: 'rgba(255, 255, 255, 0.03)' }, ticks: { color: '#888888', font: {size: 10} } },
            x: { grid: { display: false }, ticks: { color: '#888888', font: {size: 10}, maxTicksLimit: 5 } }
        }
    }
});

let dbData = {}; // Kosongkan sejak awal agar aman
let currentChartCategory = 'AMPERE';

// ==========================================
// 4. FUNGSI UPDATE UI (KODE ANTI-CRASH DENGAN '?.' )
// ==========================================
function updateDashboard() {
    const lineAmpere = document.getElementById('line-ampere').value;
    const lineVolt = document.getElementById('line-volt').value;
    const lineKW = document.getElementById('line-kw').value;
    const lineKVA = document.getElementById('line-kva').value;

    // Gunakan '?.' (Optional Chaining) agar web tidak rusak jika data Firebase kosong
    const valAmp = dbData?.AMPERE?.[lineAmpere] || 0;
    const valVolt = dbData?.VOLTAGE?.[lineVolt] || 0;
    const valKw = dbData?.KW?.[lineKW] || 0;
    const valKva = dbData?.KVA?.[lineKVA] || 0;
    
    const kwhTot = dbData?.KWH?.TOTAL || 0;
    const kwTot = dbData?.KW?.TOTAL || 0;
    const kvarTot = dbData?.KVAR?.TOTAL || 0;

    document.getElementById('val-ampere').innerText = `${valAmp.toFixed(2)} A`;
    document.getElementById('val-volt').innerText = `${valVolt.toFixed(1)} V`;
    document.getElementById('val-kw').innerText = `${valKw.toFixed(2)} kW`;
    document.getElementById('val-kva').innerText = `${valKva.toFixed(2)} kVA`;

    document.getElementById('val-kwh').innerText = kwhTot.toLocaleString('en-US', {minimumFractionDigits: 1});
    document.getElementById('val-kw-tot').innerText = kwTot.toFixed(2);
    document.getElementById('val-kvar-tot').innerText = kvarTot.toFixed(2);
}

document.querySelectorAll('.line-select').forEach(select => select.addEventListener('change', updateDashboard));

function updateChart(category) {
    document.querySelectorAll('.chart-buttons-scroll button').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    currentChartCategory = category;

    if (category === 'AMPERE') { energyChart.data.datasets[0].borderColor = '#00a8ff'; } 
    else if (category === 'VOLTAGE') { energyChart.data.datasets[0].borderColor = '#4dd0e1'; } 
    else if (category === 'KW') { energyChart.data.datasets[0].borderColor = '#007bff'; } 
    else if (category === 'KVA') { energyChart.data.datasets[0].borderColor = '#005cbf'; }

    energyChart.data.datasets[0].label = category;
    
    let val = 0;
    if(category === 'AMPERE') val = dbData?.AMPERE?.R || 0;
    else if(category === 'VOLTAGE') val = dbData?.VOLTAGE?.RS || 0;
    else if(category === 'KW') val = dbData?.KW?.TOTAL || 0;
    else if(category === 'KVA') val = dbData?.KVA?.TOTAL || 0;
    
    let chartData = energyChart.data.datasets[0].data;
    for(let i=0; i<chartData.length; i++) { chartData[i] = val; }
    
    energyChart.update();
}

// ==========================================
// 5. LISTENER FIREBASE & LOGIKA ONLINE/OFFLINE
// ==========================================
const statusText = document.getElementById('status-text');
const logsTbody = document.getElementById('logs-tbody');

let isFirstLoad = true;
let offlineTimer; 

function resetOfflineTimer() {
    clearTimeout(offlineTimer);
    
    statusText.innerHTML = '<i class="fa-solid fa-circle"></i> ONLINE';
    statusText.style.color = 'var(--accent-blue)';

    offlineTimer = setTimeout(() => {
        statusText.innerHTML = '<i class="fa-solid fa-circle"></i> OFFLINE';
        statusText.style.color = '#ff3333'; 
    }, 10000); 
}

database.ref('monitoring').on('value', (snapshot) => {
    const data = snapshot.val();
    
    if (data) {
        dbData = data;
        updateDashboard();
        resetOfflineTimer();

        let liveValue = 0;
        if(currentChartCategory === 'AMPERE') liveValue = dbData?.AMPERE?.R || 0;
        else if(currentChartCategory === 'VOLTAGE') liveValue = dbData?.VOLTAGE?.RS || 0;
        else if(currentChartCategory === 'KW') liveValue = dbData?.KW?.TOTAL || 0;
        else if(currentChartCategory === 'KVA') liveValue = dbData?.KVA?.TOTAL || 0;

        let chartData = energyChart.data.datasets[0].data;
        
        if(isFirstLoad) {
            for(let i=0; i<chartData.length; i++) { chartData[i] = liveValue; }
            isFirstLoad = false;
        } else {
            chartData.shift(); 
            chartData.push(liveValue); 
        }
        energyChart.update();

        const waktuSekarang = new Date().toLocaleTimeString('id-ID', { hour12: false });
        const newRow = document.createElement('tr');
        // Kode anti-crash untuk tabel logs
        newRow.innerHTML = `
            <td>${data?.last_update ? data.last_update.split(' ')[1] : waktuSekarang}</td>
            <td>${(data?.VOLTAGE?.RS || 0).toFixed(1)}</td>
            <td>${(data?.AMPERE?.R || 0).toFixed(2)}</td>
            <td>${(data?.KW?.TOTAL || 0).toFixed(2)}</td>
        `;
        logsTbody.prepend(newRow);
        if (logsTbody.children.length > 100) { logsTbody.removeChild(logsTbody.lastChild); }
    }
});

