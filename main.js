// main.js — untuk index.html

// === KONSTANTA ===
const DEFAULT_STANDARDS = {
  Water: { target: 0, lsl: 0, usl: 0 },
  Density: { target: 0, lsl: 0, usl: 0 },
  Viscosity: { target: 0, lsl: 0, usl: 0 },
  Luar: { target: 0, lsl: 0, usl: 0 },
  Tengah: { target: 0, lsl: 0, usl: 0 },
  Dalam: { target: 0, lsl: 0, usl: 0 },
  Total: { target: 0, lsl: 0, usl: 0 }
};
const PARAMETERS = ["Water", "Density", "Viscosity", "Luar", "Tengah", "Dalam", "Total"];
const tableBody = document.getElementById("table-body");

// === INISIALISASI TABEL ===
for (let i = 1; i <= 12; i++) {
  const row = document.createElement("tr");
  row.innerHTML = `
    <td class="jam-cell">Jam ${i}</td>
    <td><input type="number" id="water2A-${i}" min="0" step="0.01"></td>
    <td><input type="number" id="density2A-${i}" min="0" step="0.01"></td>
    <td><input type="number" id="viscosity2A-${i}" min="0" step="0.01"></td>
    <td><input type="number" id="luar2A-${i}" min="0" step="0.01" oninput="liveCalculate(${i}, '2A')"></td>
    <td><input type="number" id="tengah2A-${i}" min="0" step="0.01" oninput="liveCalculate(${i}, '2A')"></td>
    <td><input type="number" id="dalam2A-${i}" min="0" step="0.01" oninput="liveCalculate(${i}, '2A')"></td>
    <td id="avg2A-${i}">-</td>
    <td><input type="number" id="water2B-${i}" min="0" step="0.01"></td>
    <td><input type="number" id="density2B-${i}" min="0" step="0.01"></td>
    <td><input type="number" id="viscosity2B-${i}" min="0" step="0.01"></td>
    <td><input type="number" id="luar2B-${i}" min="0" step="0.01" oninput="liveCalculate(${i}, '2B')"></td>
    <td><input type="number" id="tengah2B-${i}" min="0" step="0.01" oninput="liveCalculate(${i}, '2B')"></td>
    <td><input type="number" id="dalam2B-${i}" min="0" step="0.01" oninput="liveCalculate(${i}, '2B')"></td>
    <td id="avg2B-${i}">-</td>
  `;
  tableBody.appendChild(row);
}

// === FUNGSI UTAMA ===
function liveCalculate(rowId, line) {
  const luar = parseFloat(document.getElementById(`luar${line}-${rowId}`).value) || 0;
  const tengah = parseFloat(document.getElementById(`tengah${line}-${rowId}`).value) || 0;
  const dalam = parseFloat(document.getElementById(`dalam${line}-${rowId}`).value) || 0;
  const avgCell = document.getElementById(`avg${line}-${rowId}`);
  if (luar || tengah || dalam) {
    const avg = (luar + tengah + dalam) / 3;
    avgCell.textContent = avg.toFixed(2);
  } else {
    avgCell.textContent = "-";
  }
}

function updateJam() {
  const shift = document.getElementById("shift").value;
  const startHour = shift === "1" ? 7 : 19;
  document.querySelectorAll("#table-body .jam-cell").forEach((cell, i) => {
    const hour = (startHour + i) % 24;
    cell.textContent = `${hour.toString().padStart(2, '0')}.00`;
  });
}

function loadStandards() {
  const stored = localStorage.getItem('glaze_standards');
  return stored ? JSON.parse(stored) : DEFAULT_STANDARDS;
}

function checkStatus(value, standards) {
  if (value === null || isNaN(value)) return '';
  const { lsl, usl } = standards;
  if (lsl === 0 && usl === 0) return '';
  return (value >= lsl && value <= usl) ? 'status-lulus' : 'status-gagal';
}

function calculate() {
  const btn = document.getElementById('calculateBtn');
  btn.disabled = true;
  btn.textContent = 'Menghitung...';

  const standards = loadStandards();
  const lines = ["2A", "2B"];

  lines.forEach(line => {
    let totalWater = 0, totalDensity = 0, totalViscosity = 0;
    let totalLuar = 0, totalTengah = 0, totalDalam = 0, count = 0;

    for (let i = 1; i <= 12; i++) {
      const water = parseFloat(document.getElementById(`water${line}-${i}`).value) || 0;
      const density = parseFloat(document.getElementById(`density${line}-${i}`).value) || 0;
      const viscosity = parseFloat(document.getElementById(`viscosity${line}-${i}`).value) || 0;
      const luar = parseFloat(document.getElementById(`luar${line}-${i}`).value) || 0;
      const tengah = parseFloat(document.getElementById(`tengah${line}-${i}`).value) || 0;
      const dalam = parseFloat(document.getElementById(`dalam${line}-${i}`).value) || 0;

      const avg = (luar + tengah + dalam) / 3;
      document.getElementById(`avg${line}-${i}`).textContent = (luar || tengah || dalam) ? avg.toFixed(2) : "-";

      if (water || density || viscosity || luar || tengah || dalam) {
        totalWater += water;
        totalDensity += density;
        totalViscosity += viscosity;
        totalLuar += luar;
        totalTengah += tengah;
        totalDalam += dalam;
        count++;
      }
    }

    const setAvg = (id, value, param) => {
      const el = document.getElementById(id);
      el.textContent = count ? value.toFixed(2) : "-";
      el.className = count ? checkStatus(value, standards[param]) : "";
    };

    if (count) {
      setAvg(`avgWater${line}`, totalWater / count, "Water");
      setAvg(`avgDensity${line}`, totalDensity / count, "Density");
      setAvg(`avgViscosity${line}`, totalViscosity / count, "Viscosity");
      setAvg(`avgLuar${line}`, totalLuar / count, "Luar");
      setAvg(`avgTengah${line}`, totalTengah / count, "Tengah");
      setAvg(`avgDalam${line}`, totalDalam / count, "Dalam");
      setAvg(`avgTotal${line}`, (totalLuar + totalTengah + totalDalam) / (3 * count), "Total");
    } else {
      ["Water", "Density", "Viscosity", "Luar", "Tengah", "Dalam", "Total"].forEach(p =>
        document.getElementById(`avg${p}${line}`).textContent = "-"
      );
    }
  });

  btn.disabled = false;
  btn.textContent = 'CALCULATE AVERAGE';
}

// === PENYIMPANAN & PEMUATAN LAPORAN ===
function saveReport() {
  const tanggal = document.getElementById("tanggal").value;
  if (!tanggal) { alert("Tanggal harus diisi!"); return; }

  calculate();
  const report = {
    judul: document.getElementById("report-title-select").value,
    tanggal,
    grup: document.getElementById("grup").value,
    shift: document.getElementById("shift").value,
    tableData: Array.from(document.querySelectorAll('#table-body input')).map(el => ({ id: el.id, value: el.value })),
    resultsData: {}
  };

  document.querySelectorAll('#result-table td[id^="avg"]').forEach(el => {
    report.resultsData[el.id] = { value: el.textContent, className: el.className };
  });

  const key = `glaze_report_${Date.now()}_${tanggal}_${report.grup}_shift${report.shift}`;
  localStorage.setItem(key, JSON.stringify(report));
  alert("Laporan berhasil disimpan!");
  populateLoadDropdown();
}

function loadReport(key) {
  const data = JSON.parse(localStorage.getItem(key));
  if (!data) return alert("Laporan tidak ditemukan!");

  document.getElementById("report-title-select").value = data.judul;
  document.getElementById("tanggal").value = data.tanggal;
  document.getElementById("grup").value = data.grup;
  document.getElementById("shift").value = data.shift;
  updateJam();

  data.tableData.forEach(item => {
    const el = document.getElementById(item.id);
    if (el) el.value = item.value;
  });

  for (const id in data.resultsData) {
    const el = document.getElementById(id);
    if (el) {
      el.textContent = data.resultsData[id].value;
      el.className = data.resultsData[id].className;
    }
  }
  calculate();
  alert("Laporan berhasil dimuat!");
}

function deleteReport(key) {
  if (confirm("Hapus laporan ini?")) {
    localStorage.removeItem(key);
    alert("Laporan dihapus!");
    populateLoadDropdown();
  }
}

function populateLoadDropdown() {
  const dropdown = document.getElementById("loadOptions");
  dropdown.innerHTML = '';
  const keys = Object.keys(localStorage)
    .filter(k => k.startsWith('glaze_report_'))
    .sort((a, b) => b.localeCompare(a));

  if (keys.length === 0) {
    dropdown.innerHTML = '<a href="#" class="disabled">Tidak ada laporan tersimpan</a>';
    return;
  }

  keys.forEach(key => {
    const data = JSON.parse(localStorage.getItem(key));
    const text = `${data.tanggal} | ${data.grup} | Shift ${data.shift} | ${data.judul}`;
    const link = document.createElement("a");
    link.href = "#";
    link.textContent = text;
    link.onclick = e => { e.preventDefault(); loadReport(key); toggleLoadDropdown(); };

    const del = document.createElement("a");
    del.href = "#";
    del.textContent = " Hapus";
    del.className = "delete-link";
    del.onclick = e => { e.preventDefault(); e.stopPropagation(); deleteReport(key); };

    link.appendChild(del);
    dropdown.appendChild(link);
  });
}

// === STANDAR ===
function displayStandards() {
  const std = loadStandards();
  PARAMETERS.forEach(p => {
    const target = document.getElementById(`stdTarget${p}`);
    const lsl = document.getElementById(`stdLSL${p}`);
    const usl = document.getElementById(`stdUSL${p}`);
    if (target) target.value = std[p].target;
    if (lsl) lsl.value = std[p].lsl;
    if (usl) usl.value = std[p].usl;
  });
}

function saveStandards() {
  const newStd = {};
  let valid = true;
  PARAMETERS.forEach(p => {
    const lsl = parseFloat(document.getElementById(`stdLSL${p}`).value) || 0;
    const usl = parseFloat(document.getElementById(`stdUSL${p}`).value) || 0;
    const target = parseFloat(document.getElementById(`stdTarget${p}`).value) || 0;
    if (lsl > usl) {
      alert(`LSL tidak boleh > USL untuk ${p}`);
      valid = false;
    }
    newStd[p] = { target, lsl, usl };
  });
  if (valid) {
    localStorage.setItem('glaze_standards', JSON.stringify(newStd));
    alert('Standar berhasil disimpan!');
    toggleStandardsView();
    calculate();
  }
}

function toggleStandardsView() {
  const overlay = document.getElementById("standards-setting-overlay");
  const content = document.getElementById("desktop-content");
  if (overlay.style.display === "none" || overlay.style.display === "") {
    displayStandards();
    overlay.style.display = "flex";
    content.style.filter = "blur(3px)";
  } else {
    overlay.style.display = "none";
    content.style.filter = "none";
  }
}

// === RESET & NAVIGASI ===
function resetData() {
  document.querySelectorAll('#table-body input').forEach(el => el.value = '');
  document.querySelectorAll('#table-body td[id^="avg"]').forEach(el => el.textContent = '-');
  document.querySelectorAll('#result-table td[id^="avg"]').forEach(el => { el.textContent = '-'; el.className = ''; });
  document.getElementById('ucl-chart-container').style.display = 'none';
  document.getElementById('showChartsBtn').textContent = 'SHOW CONTROL CHARTS';
}

function goToAnalysis() {
  const hasData = ["2A", "2B"].some(line =>
    PARAMETERS.some(p => {
      const val = document.getElementById(`avg${p}${line}`)?.textContent;
      return val !== '-' && !isNaN(parseFloat(val));
    })
  );

  if (!hasData) {
    alert("Tidak ada data rata-rata untuk dianalisis. Silakan hitung terlebih dahulu.");
    return;
  }

  const reportDataForAnalysis = {
    tanggal: document.getElementById("tanggal").value || "Tidak ada tanggal",
    grup: document.getElementById("grup").value,
    shift: document.getElementById("shift").value,
    judul: document.getElementById("report-title-select").value,
    avg2A: Object.fromEntries(PARAMETERS.map(p => [p, document.getElementById(`avg${p}2A`).textContent])),
    avg2B: Object.fromEntries(PARAMETERS.map(p => [p, document.getElementById(`avg${p}2B`).textContent]))
  };

  localStorage.setItem('analysisData', JSON.stringify(reportDataForAnalysis));
  window.open('analysis.html', '_blank');
}

// === EKSPOR & CETAK ===
function downloadPNG() {
  const area = document.getElementById("printable-area");
  const excludes = document.querySelectorAll('.exclude-on-print');
  excludes.forEach(el => el.style.display = 'none');

  html2canvas(area, { scale: 2 }).then(canvas => {
    const link = document.createElement("a");
    link.download = `GlazingReport_${new Date().toISOString().slice(0,10)}.png`;
    link.href = canvas.toDataURL();
    link.click();
    excludes.forEach(el => el.style.display = '');
    document.getElementById("printOptions").classList.remove("show");
  });
}

function printReport() {
  window.print();
  document.getElementById("printOptions").classList.remove("show");
}

// === DROPDOWN ===
function toggleDropdown() {
  document.getElementById("printOptions").classList.toggle("show");
}
function toggleLoadDropdown() {
  document.getElementById("loadOptions").classList.toggle("show");
}

window.onclick = e => {
  if (!e.target.matches('.dropbtn') && !e.target.closest('.dropdown')) {
    document.querySelectorAll('.dropdown-content.show').forEach(el => el.classList.remove('show'));
  }
};

// === INISIALISASI ===
document.addEventListener('DOMContentLoaded', () => {
  updateJam();
  displayStandards();
  populateLoadDropdown();
  document.getElementById("shift").addEventListener("change", updateJam);
});