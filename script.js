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

// --- 2. SISTEM NAVIGASI (3 TAB) ---
var navHome = document.getElementById('nav-home');
var navLogs = document.getElementById('nav-logs');
var navHistory = document.getElementById('nav-history');
var viewHome = document.getElementById('view-home');
var viewLogs = document.getElementById('view-logs');
var viewHistory = document.getElementById('view-history');

function switchTab(tabName) {
    navHome.classList.remove('active'); 
    navLogs.classList.remove('active'); 
    navHistory.classList.remove('active');
    
    viewHome.style.display = 'none'; 
    viewLogs.style.display = 'none'; 
    viewHistory.style.display = 'none';
    
    if(tabName === 'home') { 
        navHome.classList.add('active'); 
        viewHome.style.display = 'block'; 
        energyChart.update(); 
    }
    if(tabName === 'logs') { 
        navLogs.classList.add('active'); 
        viewLogs.style.display = 'block'; 
    }
    if(tabName === 'history') { 
        navHistory.classList.add('active'); 
        viewHistory.style.display = 'block'; 
    }
}

navHome.addEventListener('click', function() { switchTab('home'); });
navLogs.addEventListener('click', function() { switchTab('logs'); });
navHistory.addEventListener('click', function() { switchTab('history'); });

// --- 3. CHART.JS ---
var ctx = document.getElementById('energyChart').getContext('2d');
var gradientBlue = ctx.createLinearGradient(0, 0, 0, 200);
gradientBlue.addColorStop(0, 'rgba(0, 168, 255, 0.4)'); 
gradientBlue.addColorStop(1, 'rgba(0, 168, 255, 0.0)'); 

var energyChart = new Chart(ctx, {
    type: 'line',
    data: { 
        labels: ['-', '-', '-', '-', '-', '-', 'LIVE'], 
        datasets: [{ 
            label: 'AMPERE', 
            data: [0,0,0,0,0,0,0], 
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

var dbData = {}; 
var currentChartCategory = 'AMPERE';

// --- 4. UPDATE DASHBOARD HOME ---
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

    document.getElementById('val-ampere').innerText = valAmp.toFixed(2) + ' A';
    document.getElementById('val-volt').innerText = valVolt.toFixed(1) + ' V';
    document.getElementById('val-kw').innerText = valKw.toFixed(2) + ' kW';
    document.getElementById('val-kva').innerText = valKva.toFixed(2) + ' kVA';

    document.getElementById('val-kwh').innerText = kwhTot.toLocaleString('en-US', {minimumFractionDigits: 1});
    document.getElementById('val-kw-tot').innerText = kwTot.toFixed(2);
    document.getElementById('val-kvar-tot').innerText = kvarTot.toFixed(2);
}

var selects = document.querySelectorAll('.line-select');
for (var i = 0; i < selects.length; i++) {
    selects[i].addEventListener('change', updateDashboard);
}

function updateChart(category) {
    var buttons = document.querySelectorAll('.chart-buttons-scroll button');
    for (var j = 0; j < buttons.length; j++) {
        buttons[j].classList.remove('active');
    }
    event.target.classList.add('active');
    currentChartCategory = category;

    if (category === 'AMPERE') { energyChart.data.datasets[0].borderColor = '#00a8ff'; } 
    else if (category === 'VOLTAGE') { energyChart.data.datasets[0].borderColor = '#4dd0e1'; } 
    else if (category === 'KW') { energyChart.data.datasets[0].borderColor = '#007bff'; } 
    else if (category === 'KVA') { energyChart.data.datasets[0].borderColor = '#005cbf'; }

    energyChart.data.datasets[0].label = category;
    
    var val = 0;
    if(category === 'AMPERE') { if(dbData && dbData.AMPERE && dbData.AMPERE.R) val = dbData.AMPERE.R; }
    else if(category === 'VOLTAGE') { if(dbData && dbData.VOLTAGE && dbData.VOLTAGE.RS) val = dbData.VOLTAGE.RS; }
    else if(category === 'KW') { if(dbData && dbData.KW && dbData.KW.TOTAL) val = dbData.KW.TOTAL; }
    else if(category === 'KVA') { if(dbData && dbData.KVA && dbData.KVA.TOTAL) val = dbData.KVA.TOTAL; }
    
    var chartData = energyChart.data.datasets[0].data;
    for(var k=0; k<chartData.length; k++) { chartData[k] = val; }
    energyChart.update();
}

// --- 5. LOGIKA FIREBASE (LIVE DATA & LOGS) ---
var statusText = document.getElementById('status-text');
var logsTbody = document.getElementById('logs-tbody');
var isFirstLoad = true;
var offlineTimer; 

function resetOfflineTimer() {
    clearTimeout(offlineTimer);
    statusText.innerHTML = '<i class="fa-solid fa-circle"></i> ONLINE';
    statusText.style.color = 'var(--accent-blue)';

    offlineTimer = setTimeout(function() {
        statusText.innerHTML = '<i class="fa-solid fa-circle"></i> OFFLINE';
        statusText.style.color = '#ff3333'; 
    }, 10000); 
}

database.ref('monitoring').on('value', function(snapshot) {
    var data = snapshot.val();
    if (data) {
        dbData = data;
        updateDashboard();
        resetOfflineTimer();

        var liveValue = 0;
        if(currentChartCategory === 'AMPERE') { if(dbData && dbData.AMPERE && dbData.AMPERE.R) liveValue = dbData.AMPERE.R; }
        else if(currentChartCategory === 'VOLTAGE') { if(dbData && dbData.VOLTAGE && dbData.VOLTAGE.RS) liveValue = dbData.VOLTAGE.RS; }
        else if(currentChartCategory === 'KW') { if(dbData && dbData.KW && dbData.KW.TOTAL) liveValue = dbData.KW.TOTAL; }
        else if(currentChartCategory === 'KVA') { if(dbData && dbData.KVA && dbData.KVA.TOTAL) liveValue = dbData.KVA.TOTAL; }

        var chartData = energyChart.data.datasets[0].data;
        if(isFirstLoad) {
            for(var m=0; m<chartData.length; m++) { chartData[m] = liveValue; }
            isFirstLoad = false;
        } else {
            chartData.shift(); chartData.push(liveValue); 
        }
        energyChart.update();

        var waktuSekarang = new Date().toLocaleTimeString('id-ID', { hour12: false });
        var lastUpdate = (data && data.last_update) ? data.last_update.split(' ')[1] : waktuSekarang;
        var vRS = (data && data.VOLTAGE && data.VOLTAGE.RS) ? data.VOLTAGE.RS : 0;
        var aR = (data && data.AMPERE && data.AMPERE.R) ? data.AMPERE.R : 0;
        var kwT = (data && data.KW && data.KW.TOTAL) ? data.KW.TOTAL : 0;

        var newRow = document.createElement('tr');
        newRow.innerHTML = '<td>' + lastUpdate + '</td>' +
                           '<td>' + vRS.toFixed(1) + '</td>' +
                           '<td>' + aR.toFixed(2) + '</td>' +
                           '<td>' + kwT.toFixed(2) + '</td>';
        logsTbody.insertBefore(newRow, logsTbody.firstChild);
        if (logsTbody.children.length > 100) { logsTbody.removeChild(logsTbody.lastChild); }
    }
});

// --- 6. LOGIKA FIREBASE (HISTORY HARIAN) ---
var historyTbody = document.getElementById('history-tbody');
database.ref('daily_logs').on('value', function(snapshot) {
    historyTbody.innerHTML = ''; 
    var dataHarian = snapshot.val();
    
    if (dataHarian) {
        var tanggalArray = Object.keys(dataHarian).sort().reverse();
        
        for (var n = 0; n < tanggalArray.length; n++) {
            var tanggal = tanggalArray[n];
            var info = dataHarian[tanggal];
            var tKwh = (info && info.Total_KWh) ? info.Total_KWh : 0;
            var bpKw = (info && info.Beban_Puncak_KW) ? info.Beban_Puncak_KW : 0;

            var row = document.createElement('tr');
            row.innerHTML = '<td>' + tanggal + '</td>' +
                            '<td style="color: var(--accent-cyan); font-weight: bold;">' + tKwh.toFixed(2) + '</td>' +
                            '<td style="color: var(--accent-blue);">' + bpKw.toFixed(2) + '</td>';
            historyTbody.appendChild(row);
        }
    } else {
        historyTbody.innerHTML = '<tr><td colspan="3" style="text-align: center;">Belum ada data harian terekam.</td></tr>';
    }
});