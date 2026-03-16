// --- 1. KONFIGURASI FIREBASE ---
var firebaseConfig = {
    apiKey: "AIzaSyCJHWvBxtmTtKJsmpkdnHukF_yYAzqNdYc",
    authDomain: "energy-monitoring-pbs-itk.firebaseapp.com",
    databaseURL: "https://energy-monitoring-pbs-itk-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "energy-monitoring-pbs-itk",
    storageBucket: "energy-monitoring-pbs-itk.appspot.com",
    messagingSenderId: "30345474024",
    appId: "1:30345474024:web:1ea75cd1ccb8161e81be5d",
    measurementId: "G-FXDCSMHXX7"
};
firebase.initializeApp(firebaseConfig);
var database = firebase.database();

// --- 2. SISTEM NAVIGASI (4 TAB) ---
var navHome = document.getElementById('nav-home');
var navLogs = document.getElementById('nav-logs');
var navGraph = document.getElementById('nav-graph');
var navHistory = document.getElementById('nav-history');

var viewHome = document.getElementById('view-home');
var viewLogs = document.getElementById('view-logs');
var viewGraph = document.getElementById('view-graph');
var viewHistory = document.getElementById('view-history');

function switchTab(tabName) {
    navHome.classList.remove('active'); 
    navLogs.classList.remove('active'); 
    navGraph.classList.remove('active');
    navHistory.classList.remove('active');
    
    viewHome.style.display = 'none'; 
    viewLogs.style.display = 'none'; 
    viewGraph.style.display = 'none';
    viewHistory.style.display = 'none';
    
    if(tabName === 'home') { navHome.classList.add('active'); viewHome.style.display = 'block'; }
    if(tabName === 'logs') { navLogs.classList.add('active'); viewLogs.style.display = 'block'; }
    if(tabName === 'graph') { navGraph.classList.add('active'); viewGraph.style.display = 'block'; energyChart.update(); }
    if(tabName === 'history') { navHistory.classList.add('active'); viewHistory.style.display = 'block'; }
}

navHome.addEventListener('click', function() { switchTab('home'); });
navLogs.addEventListener('click', function() { switchTab('logs'); });
navGraph.addEventListener('click', function() { switchTab('graph'); });
navHistory.addEventListener('click', function() { switchTab('history'); });

// --- 3. LOGIKA CHART.JS (DENGAN RIWAYAT WAKTU) ---
var maxDataPoints = 100; // Menyimpan 100 titik waktu terakhir
var chartLabels = [];
var chartDataVolt = [];
var chartDataAmp = [];
var chartDataKw = [];
var chartDataKva = [];
var chartDataKvar = [];

var ctx = document.getElementById('energyChart').getContext('2d');
var gradientBlue = ctx.createLinearGradient(0, 0, 0, 400);
gradientBlue.addColorStop(0, 'rgba(0, 168, 255, 0.4)'); 
gradientBlue.addColorStop(1, 'rgba(0, 168, 255, 0.0)'); 

var energyChart = new Chart(ctx, {
    type: 'line',
    data: { 
        labels: chartLabels, 
        datasets: [{ 
            label: 'VOLTAGE', 
            data: chartDataVolt, 
            borderColor: '#4dd0e1', 
            backgroundColor: gradientBlue, 
            borderWidth: 2, 
            pointBackgroundColor: '#121215', 
            pointBorderColor: '#4dd0e1', 
            pointBorderWidth: 1, 
            pointRadius: 2, 
            fill: true, 
            tension: 0.3 
        }] 
    },
    options: { 
        responsive: true, 
        maintainAspectRatio: false, 
        animation: { duration: 300, easing: 'linear' }, 
        plugins: { 
            legend: { display: false },
            tooltip: {
                callbacks: {
                    title: function(context) { return 'Pukul: ' + context[0].label; }
                }
            }
        }, 
        scales: { 
            y: { beginAtZero: false, grid: { color: 'rgba(255, 255, 255, 0.03)' }, ticks: { color: '#888888', font: {size: 10} } }, 
            x: { grid: { display: false }, ticks: { color: '#888888', font: {size: 10}, maxTicksLimit: 6 } } 
        } 
    }
});

var currentChartCategory = 'VOLTAGE';

function updateChart(category) {
    var buttons = document.querySelectorAll('.chart-buttons-scroll button');
    for (var j = 0; j < buttons.length; j++) { buttons[j].classList.remove('active'); }
    event.target.classList.add('active');
    
    currentChartCategory = category;
    var dataset = energyChart.data.datasets[0];
    dataset.label = category;

    if (category === 'VOLTAGE') { dataset.data = chartDataVolt; dataset.borderColor = '#4dd0e1'; dataset.pointBorderColor = '#4dd0e1'; }
    else if (category === 'AMPERE') { dataset.data = chartDataAmp; dataset.borderColor = '#00a8ff'; dataset.pointBorderColor = '#00a8ff'; } 
    else if (category === 'KW') { dataset.data = chartDataKw; dataset.borderColor = '#007bff'; dataset.pointBorderColor = '#007bff'; } 
    else if (category === 'KVA') { dataset.data = chartDataKva; dataset.borderColor = '#005cbf'; dataset.pointBorderColor = '#005cbf'; }
    else if (category === 'KVAR') { dataset.data = chartDataKvar; dataset.borderColor = '#6610f2'; dataset.pointBorderColor = '#6610f2'; }
    
    energyChart.update();
}

// --- 4. DATA HOME DASHBOARD ---
var dbData = {}; 

function updateDashboard() {
    var lineAmpere = document.getElementById('line-ampere').value;
    var lineVolt = document.getElementById('line-volt').value;
    var lineKW = document.getElementById('line-kw').value;
    var lineKVA = document.getElementById('line-kva').value;

    var valAmp = 0; if (dbData && dbData.AMPERE && dbData.AMPERE[lineAmpere]) valAmp = dbData.AMPERE[lineAmpere];
    var valVolt = 0; if (dbData && dbData.VOLTAGE && dbData.VOLTAGE[lineVolt]) valVolt = dbData.VOLTAGE[lineVolt];
    var valKw = 0; if (dbData && dbData.KW && dbData.KW[lineKW]) valKw = dbData.KW[lineKW];
    var valKva = 0; if (dbData && dbData.KVA && dbData.KVA[lineKVA]) valKva = dbData.KVA[lineKVA];
    
    var kwhTot = 0; if (dbData && dbData.KWH && dbData.KWH.TOTAL) kwhTot = dbData.KWH.TOTAL;
    var kwTot = 0; if (dbData && dbData.KW && dbData.KW.TOTAL) kwTot = dbData.KW.TOTAL;
    var kvarTot = 0; if (dbData && dbData.KVAR && dbData.KVAR.TOTAL) kvarTot = dbData.KVAR.TOTAL;
    
    // Penambahan penarik data KVA Total
    var kvaTot = 0; if (dbData && dbData.KVA && dbData.KVA.TOTAL) kvaTot = dbData.KVA.TOTAL;

    document.getElementById('val-ampere').innerText = valAmp.toFixed(2) + ' A';
    document.getElementById('val-volt').innerText = valVolt.toFixed(1) + ' V';
    document.getElementById('val-kw').innerText = valKw.toFixed(2) + ' kW';
    document.getElementById('val-kva').innerText = valKva.toFixed(2) + ' kVA';
    
    document.getElementById('val-kwh').innerText = kwhTot.toLocaleString('en-US', {minimumFractionDigits: 1});
    document.getElementById('val-kw-tot').innerText = kwTot.toFixed(2);
    document.getElementById('val-kvar-tot').innerText = kvarTot.toFixed(2);
    
    // Memasukkan angka KVA Total ke HTML
    document.getElementById('val-kva-tot').innerText = kvaTot.toFixed(2);
}

var selects = document.querySelectorAll('.line-select');
for (var i = 0; i < selects.length; i++) { selects[i].addEventListener('change', updateDashboard); }

// --- 5. LISTENER FIREBASE (LIVE DATA & PEREKAM GRAFIK) ---
var statusText = document.getElementById('status-text');
var logsTbody = document.getElementById('logs-tbody');
var offlineTimer; 

function resetOfflineTimer() {
    clearTimeout(offlineTimer);
    statusText.innerHTML = '<i class="fa-solid fa-circle"></i> ONLINE';
    statusText.style.color = 'var(--accent-blue)';
    offlineTimer = setTimeout(function() {
        statusText.innerHTML = '<i class="fa-solid fa-circle"></i> OFFLINE';
        statusText.style.color = '#ff3333'; 
    }, 15000); 
}

database.ref('monitoring').on('value', function(snapshot) {
    var data = snapshot.val();
    if (data) {
        dbData = data;
        updateDashboard();
        resetOfflineTimer();

        // Variabel untuk Grafik & Tabel
        var waktuSekarang = new Date().toLocaleTimeString('id-ID', { hour12: false });
        var lastUpdate = (data && data.last_update) ? data.last_update.split(' ')[1] : waktuSekarang;
        
        var vRS = (data && data.VOLTAGE && data.VOLTAGE.RS) ? data.VOLTAGE.RS : 0;
        var vST = (data && data.VOLTAGE && data.VOLTAGE.ST) ? data.VOLTAGE.ST : 0;
        var vRT = (data && data.VOLTAGE && data.VOLTAGE.RT) ? data.VOLTAGE.RT : 0;
        var aR = (data && data.AMPERE && data.AMPERE.R) ? data.AMPERE.R : 0;
        var aS = (data && data.AMPERE && data.AMPERE.S) ? data.AMPERE.S : 0;
        var aT = (data && data.AMPERE && data.AMPERE.T) ? data.AMPERE.T : 0;
        var kwT = (data && data.KW && data.KW.TOTAL) ? data.KW.TOTAL : 0;
        var kvaT = (data && data.KVA && data.KVA.TOTAL) ? data.KVA.TOTAL : 0;
        var kvarT = (data && data.KVAR && data.KVAR.TOTAL) ? data.KVAR.TOTAL : 0;

        // -- MEREKAM KE DALAM ARRAY GRAFIK --
        chartLabels.push(lastUpdate);
        chartDataVolt.push(vRS);
        chartDataAmp.push(aR);
        chartDataKw.push(kwT);
        chartDataKva.push(kvaT);
        chartDataKvar.push(kvarT);

        // Buang data lama jika melebihi batas agar HP tidak lag
        if(chartLabels.length > maxDataPoints) {
            chartLabels.shift(); chartDataVolt.shift(); chartDataAmp.shift();
            chartDataKw.shift(); chartDataKva.shift(); chartDataKvar.shift();
        }
        energyChart.update();

        // -- MENCETAK KE TABEL LIVE --
        var newRow = document.createElement('tr');
        newRow.innerHTML = '<td style="text-align: left;">' + lastUpdate + '</td>' +
                           '<td>' + vRS.toFixed(1) + '</td>' +
                           '<td>' + vST.toFixed(1) + '</td>' +
                           '<td>' + vRT.toFixed(1) + '</td>' +
                           '<td>' + aR.toFixed(2) + '</td>' +
                           '<td>' + aS.toFixed(2) + '</td>' +
                           '<td>' + aT.toFixed(2) + '</td>' +
                           '<td style="color:var(--accent-cyan); font-weight:bold;">' + kwT.toFixed(2) + '</td>' +
                           '<td>' + kvaT.toFixed(2) + '</td>' +
                           '<td>' + kvarT.toFixed(2) + '</td>';
        
        logsTbody.insertBefore(newRow, logsTbody.firstChild);
        if (logsTbody.children.length > 50) { logsTbody.removeChild(logsTbody.lastChild); }
    }
});

// --- 6. LOGIKA HISTORY HARIAN ---
var historyTbody = document.getElementById('history-tbody');
database.ref('daily_logs').on('value', function(snapshot) {
    historyTbody.innerHTML = ''; 
    var dataHarian = snapshot.val();
    
    if (dataHarian) {
        var tanggalArray = Object.keys(dataHarian).sort();
        var historyList = [];
        var lastKwh = 0;

        for (var n = 0; n < tanggalArray.length; n++) {
            var tgl = tanggalArray[n];
            var info = dataHarian[tgl];
            var rawKwh = (info && info.Total_KWh) ? info.Total_KWh : 0;
            var fixedKwh = rawKwh;
            if (rawKwh < lastKwh) { fixedKwh = lastKwh + rawKwh; }
            lastKwh = fixedKwh;
            historyList.push({ tanggal: tgl, totalMeter: fixedKwh });
        }

        historyList.reverse(); 
        for (var m = 0; m < historyList.length; m++) {
            var item = historyList[m];
            var row = document.createElement('tr');
            row.innerHTML = '<td style="text-align: left;">' + item.tanggal + '</td>' +
                            '<td style="color: var(--accent-cyan); font-weight: bold; text-align: right;">' + item.totalMeter.toFixed(2) + '</td>';
            historyTbody.appendChild(row);
        }
    } else {
        historyTbody.innerHTML = '<tr><td colspan="2" style="text-align: center;">Belum ada data harian terekam.</td></tr>';
    }
});
