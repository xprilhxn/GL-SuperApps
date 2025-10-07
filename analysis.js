// analysis.js — untuk analysis.html

let comparisonChart, controlChart;

const PARAMETERS = ["Water", "Density", "Viscosity", "Luar", "Tengah", "Dalam", "Total"];
const PARAM_LABELS = {
  Water: "Water (g)",
  Density: "Density (g)",
  Viscosity: "Viscosity (s)",
  Luar: "Weight Luar (g)",
  Tengah: "Weight Tengah (g)",
  Dalam: "Weight Dalam (g)",
  Total: "Total Weight (g)"
};

// --- UTILS ---
function loadAnalysisData() {
  const data = localStorage.getItem('analysisData');
  return data ? JSON.parse(data) : null;
}

function generateComparisonDescription(avg2A, avg2B) {
  let desc = "<strong>Insight Perbandingan:</strong><ul>";
  let hasSignificantDiff = false;

  PARAMETERS.forEach(param => {
    const a = parseFloat(avg2A[param]);
    const b = parseFloat(avg2B[param]);
    if (!isNaN(a) && !isNaN(b) && (a !== 0 || b !== 0)) {
      const diffPercent = a !== 0 ? ((b - a) / a) * 100 : (b > 0 ? 100 : 0);
      if (Math.abs(diffPercent) > 5) {
        hasSignificantDiff = true;
        const direction = diffPercent > 0 ? "lebih tinggi" : "lebih rendah";
        desc += `<li>Line 2B ${direction} <strong>${Math.abs(diffPercent).toFixed(1)}%</strong> dalam <em>${PARAM_LABELS[param]}</em> dibanding Line 2A.</li>`;
      }
    }
  });

  if (!hasSignificantDiff) {
    desc = "Tidak ditemukan perbedaan signifikan (>5%) antara Line 2A dan Line 2B pada parameter yang tersedia.";
  } else {
    desc += "</ul>";
  }
  return desc;
}

function generateControlDescription(param, historicalData, stats) {
  if (!stats || !historicalData || historicalData.length < 2) {
    return "Tidak cukup data historis (minimal 2 laporan) untuk analisis statistik kendali proses.";
  }

  const latest = historicalData[historicalData.length - 1];
  const UCL = parseFloat(stats.UCL);
  const LCL = parseFloat(stats.LCL);
  const outOfControl = latest > UCL || latest < LCL;

  let desc = `<strong>Analisis ${PARAM_LABELS[param]}:</strong> `;
  if (outOfControl) {
    const reason = latest > UCL ? "melebihi batas atas (UCL)" : "di bawah batas bawah (LCL)";
    desc += `Nilai terbaru (<strong>${latest}</strong>) <span style="color:#dc3545;">${reason}</span> (UCL: ${UCL}, LCL: ${LCL}). <strong>Perlu investigasi segera!</strong>`;
  } else {
    desc += `Proses dalam kendali statistik. Rata-rata historis: <strong>${stats.CL}</strong> (UCL: ${UCL}, LCL: ${LCL}).`;
  }
  return desc;
}

// --- CHARTS ---
function renderComparisonChart(avg2A, avg2B) {
  const ctx = document.getElementById('comparisonChart').getContext('2d');
  if (comparisonChart) comparisonChart.destroy();

  const labels = PARAMETERS.map(p => PARAM_LABELS[p]);
  const dataA = PARAMETERS.map(p => parseFloat(avg2A[p]) || 0);
  const dataB = PARAMETERS.map(p => parseFloat(avg2B[p]) || 0);

  comparisonChart = new Chart(ctx, {
    type: 'bar',
     {
      labels,
      datasets: [
        { 
          label: 'Line 2A', 
           dataA, 
          backgroundColor: 'rgba(54, 162, 235, 0.7)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1
        },
        { 
          label: 'Line 2B', 
          data: dataB, 
          backgroundColor: 'rgba(255, 99, 132, 0.7)',
          borderColor: 'rgba(255, 99, 132, 1)',
          borderWidth: 1
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          title: { display: true, text: 'Nilai Rata-Rata' }
        }
      },
      plugins: {
        legend: { position: 'top' },
        tooltip: { mode: 'index', intersect: false }
      }
    }
  });

  document.getElementById('comparisonDesc').innerHTML = generateComparisonDescription(avg2A, avg2B);
}

function getHistoricalData(parameterId) {
  const reportKeys = Object.keys(localStorage)
    .filter(key => key.startsWith('glaze_report_'))
    .sort()
    .slice(-20); // Ambil 20 laporan terakhir

  const data = [];
  reportKeys.forEach(key => {
    const stored = localStorage.getItem(key);
    if (stored) {
      const report = JSON.parse(stored);
      // Coba ambil dari Line 2A atau 2B
      let val = report.resultsData?.[`avg${parameterId}2A`]?.value;
      if (val === '-' || val == null) {
        val = report.resultsData?.[`avg${parameterId}2B`]?.value;
      }
      if (val && val !== '-' && !isNaN(parseFloat(val))) {
        data.push(parseFloat(val));
      }
    }
  });
  return data;
}

function calculateUCL_LCL(data) {
  if (data.length < 2) return null;
  const mean = data.reduce((a, b) => a + b, 0) / data.length;
  const variance = data.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (data.length - 1);
  const stdDev = Math.sqrt(variance);
  const UCL = mean + 3 * stdDev;
  const LCL = Math.max(0, mean - 3 * stdDev); // LCL tidak boleh negatif
  return {
    CL: mean.toFixed(2),
    UCL: UCL.toFixed(2),
    LCL: LCL.toFixed(2)
  };
}

function renderControlChart(param) {
  if (controlChart) controlChart.destroy();

  const historicalData = getHistoricalData(param);
  const stats = calculateUCL_LCL(historicalData);

  const ctx = document.getElementById('controlChart').getContext('2d');
  const datasets = [];

  if (historicalData.length >= 2 && stats) {
    const UCL = parseFloat(stats.UCL);
    const LCL = parseFloat(stats.LCL);
    const CL = parseFloat(stats.CL);

    datasets.push(
      {
        label: 'Data Historis',
         historicalData,
        borderColor: '#007bff',
        backgroundColor: 'rgba(0,123,255,0.1)',
        pointBackgroundColor: '#007bff',
        pointRadius: 5,
        fill: false,
        tension: 0.1
      },
      {
        label: `UCL (${stats.UCL})`,
         Array(historicalData.length).fill(UCL),
        borderColor: '#dc3545',
        borderDash: [6, 4],
        pointRadius: 0,
        fill: false
      },
      {
        label: `LCL (${stats.LCL})`,
         Array(historicalData.length).fill(LCL),
        borderColor: '#dc3545',
        borderDash: [6, 4],
        pointRadius: 0,
        fill: false
      },
      {
        label: `CL (${stats.CL})`,
         Array(historicalData.length).fill(CL),
        borderColor: '#28a745',
        pointRadius: 0,
        fill: false
      }
    );
  }

  controlChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: Array.from({ length: historicalData.length }, (_, i) => `#${i + 1}`),
      datasets
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: false,
          title: { display: true, text: PARAM_LABELS[param] }
        },
        x: {
          title: { display: true, text: 'Laporan Historis (Terbaru di Kanan)' }
        }
      },
      plugins: {
        legend: { position: 'top' },
        tooltip: { mode: 'index', intersect: false }
      }
    }
  });

  document.getElementById('controlDesc').innerHTML = generateControlDescription(param, historicalData, stats);
}

// --- INISIALISASI HALAMAN ---
document.addEventListener('DOMContentLoaded', () => {
  const data = loadAnalysisData();
  const metaEl = document.getElementById('report-meta');

  if (!data) {
    metaEl.innerHTML = '❌ <strong>Data tidak ditemukan.</strong> Silakan kembali ke halaman utama, hitung laporan, lalu klik "ANALYSIS REPORT".';
    document.querySelector('.chart-section').style.display = 'none';
    return;
  }

  // Tampilkan metadata laporan
  metaEl.innerHTML = `
    Tanggal: <strong>${data.tanggal}</strong> | 
    Grup: <strong>${data.grup}</strong> | 
    Shift: <strong>${data.shift}</strong> | 
    Jenis: <strong>${data.judul}</strong>
  `;

  // Render grafik perbandingan
  renderComparisonChart(data.avg2A, data.avg2B);

  // Render control chart default (Total)
  renderControlChart('Total');

  // Event listener untuk ganti parameter control chart
  document.getElementById('ucl-param-select').addEventListener('change', (e) => {
    renderControlChart(e.target.value);
  });
});