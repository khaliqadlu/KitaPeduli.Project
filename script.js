// Konfigurasi default Chart.js
Chart.defaults.font.family = "'Plus Jakarta Sans', sans-serif";
Chart.defaults.color = "#64748b";

// Variabel penampung dataset
let datasetEnergi = null;

// Instance grafik global
let kategoriChart = null;
let jurusanChart = null;
let butirChart = null;
let sebaranSkorChart = null;
let dimensiChart = null;

// Mode toggle grafik
let jurusanMode = "avg";     // "avg" | "stack"
let butirMode = "avg";       // "avg" | "persen"
let dimensiMode = "rayon";   // "rayon" | "belajar"

// Elemen DOM
const filterJurusan = document.getElementById("filterJurusan");
const resetFilterBtn = document.getElementById("resetFilterBtn");
const searchRombel = document.getElementById("searchRombel");
const exportCsvBtn = document.getElementById("exportCsvBtn");

// Fungsi Utama Inisialisasi Dashboard
async function initDashboard() {
  if (typeof DATA_ENERGI !== "undefined") {
    datasetEnergi = DATA_ENERGI;
  } else {
    try {
      const response = await fetch("data-perilaku-energi.json");
      datasetEnergi = await response.json();
    } catch (err) {
      console.error("Gagal memuat data dari data-perilaku-energi.js maupun data-perilaku-energi.json:", err);
      return;
    }
  }

  // Isi dropdown filter jurusan
  datasetEnergi.per_jurusan.forEach(j => {
    const opt = document.createElement("option");
    opt.value = j.kode;
    opt.textContent = `${j.kode} — ${j.nama}`;
    filterJurusan.appendChild(opt);
  });

  // Render semua komponen
  updateAll();
  renderSebaranSkorChart();
  renderDimensiChart();
}

// 1. Update KPI Cards & Banner Insight
function updateKPIs(selectedJurusan) {
  if (selectedJurusan === "ALL") {
    const { meta, ringkasan } = datasetEnergi;
    document.getElementById("kpiResponden").textContent = meta.jumlah_responden;
    document.getElementById("kpiTotalSiswa").textContent = `/ ${meta.jumlah_siswa_terdata} siswa`;
    document.getElementById("kpiPartisipasi").textContent = `Partisipasi ${meta.persen_partisipasi}%`;

    document.getElementById("kpiAvgSkor").textContent = ringkasan.rata_rata_skor.toFixed(2);
    document.getElementById("kpiAvgTotal").textContent = `Rata-rata skor total: ${ringkasan.rata_rata_total} / 40`;

    document.getElementById("kpiSangatBaikPct").textContent = `${ringkasan.kategori_persen["Sangat Baik"]}%`;
    document.getElementById("kpiSangatBaikCount").textContent = `(${ringkasan.kategori["Sangat Baik"]} siswa)`;
    document.getElementById("kpiBaikInfo").textContent = `Kategori Baik: ${ringkasan.kategori_persen["Baik"]}% (${ringkasan.kategori["Baik"]} siswa)`;

    document.getElementById("kpiPersenSering").textContent = `${ringkasan.persen_sering_rata_rata}%`;

    document.getElementById("insightText").textContent =
      `Dari ${meta.jumlah_responden} responden kelas XI, ${(ringkasan.kategori_persen["Sangat Baik"] + ringkasan.kategori_persen["Baik"]).toFixed(1)}% siswa berada pada kategori Sangat Baik dan Baik. Jurusan PMN mencatat rata-rata tertinggi (3.51), sementara indikator terkuat adalah praktik hemat energi sehari-hari (P01: 3.51) dan mencabut charger setelah dipakai (P06: 3.45).`;
  } else {
    const jur = datasetEnergi.per_jurusan.find(j => j.kode === selectedJurusan);
    const totalSemua = datasetEnergi.meta.jumlah_responden;
    const proporsi = ((jur.jumlah_responden / totalSemua) * 100).toFixed(1);

    document.getElementById("kpiResponden").textContent = jur.jumlah_responden;
    document.getElementById("kpiTotalSiswa").textContent = `responden (${jur.kode})`;
    document.getElementById("kpiPartisipasi").textContent = `${proporsi}% dari total responden XI`;

    document.getElementById("kpiAvgSkor").textContent = jur.rata_rata_skor.toFixed(2);
    document.getElementById("kpiAvgTotal").textContent = `Rata-rata skor total: ${jur.rata_rata_total} / 40`;

    document.getElementById("kpiSangatBaikPct").textContent = `${jur.kategori_persen["Sangat Baik"]}%`;
    document.getElementById("kpiSangatBaikCount").textContent = `(${jur.kategori["Sangat Baik"]} siswa)`;
    document.getElementById("kpiBaikInfo").textContent = `Kategori Baik: ${jur.kategori_persen["Baik"]}% (${jur.kategori["Baik"]} siswa)`;

    const maxButir = Math.max(...jur.rata_rata_per_butir);
    const minButir = Math.min(...jur.rata_rata_per_butir);
    const maxIdx = jur.rata_rata_per_butir.indexOf(maxButir);
    const minIdx = jur.rata_rata_per_butir.indexOf(minButir);

    document.getElementById("insightText").textContent =
      `Jurusan ${jur.nama} (${jur.kode}) memiliki ${jur.jumlah_responden} responden dengan rata-rata skor ${jur.rata_rata_skor} (total ${jur.rata_rata_total}/40). Indikator tertinggi pada jurusan ini adalah ${datasetEnergi.per_butir[maxIdx].kode} (${maxButir}) dan yang perlu ditingkatkan adalah ${datasetEnergi.per_butir[minIdx].kode} (${minButir}).`;
  }
}

// 2. Chart 1: Doughnut Distribusi Kategori
function renderKategoriChart(selectedJurusan) {
  const ctx = document.getElementById("kategoriChart").getContext("2d");
  const source = selectedJurusan === "ALL"
    ? datasetEnergi.ringkasan.kategori
    : datasetEnergi.per_jurusan.find(j => j.kode === selectedJurusan).kategori;

  document.getElementById("kategoriChartTitle").textContent =
    selectedJurusan === "ALL" ? "Distribusi Kategori Perilaku (Semua Jurusan)" : `Distribusi Kategori Perilaku (${selectedJurusan})`;

  if (kategoriChart) kategoriChart.destroy();

  kategoriChart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["Sangat Baik", "Baik", "Cukup", "Kurang"],
      datasets: [{
        data: [source["Sangat Baik"], source["Baik"], source["Cukup"], source["Kurang"]],
        backgroundColor: ["#10b981", "#3b82f6", "#f59e0b", "#ef4444"],
        borderColor: "#ffffff",
        borderWidth: 3,
        hoverOffset: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: "64%",
      plugins: {
        legend: {
          position: "bottom",
          labels: { usePointStyle: true, pointStyle: "circle", padding: 14, font: { size: 12, weight: "600" } }
        },
        tooltip: {
          callbacks: {
            label: ctx => {
              const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
              const pct = total ? ((ctx.raw / total) * 100).toFixed(1) : 0;
              return ` ${ctx.label}: ${ctx.raw} siswa (${pct}%)`;
            }
          }
        }
      }
    }
  });
}

// 3. Chart 2: Perbandingan Per Jurusan
function renderJurusanChart(selectedJurusan) {
  const ctx = document.getElementById("jurusanChart").getContext("2d");
  const list = datasetEnergi.per_jurusan;
  const labels = list.map(j => j.kode);

  if (jurusanChart) jurusanChart.destroy();

  if (jurusanMode === "avg") {
    const bgColors = list.map(j =>
      selectedJurusan === "ALL" || j.kode === selectedJurusan ? "#0d9488" : "#cbd5e1"
    );

    jurusanChart = new Chart(ctx, {
      type: "bar",
      data: {
        labels,
        datasets: [{
          label: "Rata-rata Skor (1.00 - 4.00)",
          data: list.map(j => j.rata_rata_skor),
          backgroundColor: bgColors,
          borderRadius: 8,
          barThickness: 34
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              title: items => {
                const j = list[items[0].dataIndex];
                return `${j.kode} — ${j.nama}`;
              },
              label: ctx => {
                const j = list[ctx.dataIndex];
                return [
                  ` Rata-rata Skor: ${j.rata_rata_skor} / 4.00`,
                  ` Skor Total: ${j.rata_rata_total} / 40`,
                  ` Responden: ${j.jumlah_responden} siswa`
                ];
              }
            }
          }
        },
        scales: {
          x: { grid: { display: false }, ticks: { font: { weight: "700" } } },
          y: { min: 2.8, max: 3.7, grid: { color: "#f1f5f9" } }
        }
      }
    });
  } else {
    jurusanChart = new Chart(ctx, {
      type: "bar",
      data: {
        labels,
        datasets: [
          { label: "Sangat Baik (%)", data: list.map(j => j.kategori_persen["Sangat Baik"]), backgroundColor: "#10b981", borderRadius: 4 },
          { label: "Baik (%)", data: list.map(j => j.kategori_persen["Baik"]), backgroundColor: "#3b82f6", borderRadius: 4 },
          { label: "Cukup (%)", data: list.map(j => j.kategori_persen["Cukup"]), backgroundColor: "#f59e0b", borderRadius: 4 },
          { label: "Kurang (%)", data: list.map(j => j.kategori_persen["Kurang"]), backgroundColor: "#ef4444", borderRadius: 4 }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: "top", labels: { usePointStyle: true, pointStyle: "circle", font: { size: 11, weight: "600" } } }
        },
        scales: {
          x: { stacked: true, grid: { display: false }, ticks: { font: { weight: "700" } } },
          y: { stacked: true, max: 100, grid: { color: "#f1f5f9" }, ticks: { callback: v => v + "%" } }
        }
      }
    });
  }
}

// 4. Chart 3: Analisis 10 Butir Pertanyaan (P01 - P10)
function renderButirChart(selectedJurusan) {
  const ctx = document.getElementById("butirChart").getContext("2d");
  const butirList = datasetEnergi.per_butir;
  const labels = butirList.map(b => `${b.kode}: ${b.label}`);

  if (butirChart) butirChart.destroy();

  if (butirMode === "avg" || selectedJurusan !== "ALL") {
    const scores = selectedJurusan === "ALL"
      ? butirList.map(b => b.rata_rata)
      : datasetEnergi.per_jurusan.find(j => j.kode === selectedJurusan).rata_rata_per_butir;

    document.getElementById("butirChartTitle").textContent =
      selectedJurusan === "ALL"
        ? "Analisis 10 Butir Pernyataan Kuesioner (P01 – P10)"
        : `Rata-rata Skor per Butir — Jurusan ${selectedJurusan}`;
    document.getElementById("butirChartSubtitle").textContent = "Rata-rata skor per indikator perilaku (Skala Likert 1–4)";

    butirChart = new Chart(ctx, {
      type: "bar",
      data: {
        labels,
        datasets: [{
          label: "Rata-rata Skor",
          data: scores,
          backgroundColor: scores.map(v => v >= 3.4 ? "#10b981" : v >= 3.3 ? "#0ea5e9" : "#f59e0b"),
          borderRadius: 6,
          barThickness: 20
        }]
      },
      options: {
        indexAxis: "y",
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              afterLabel: ctx => {
                const p = butirList[ctx.dataIndex].pertanyaan;
                return ` "${p.slice(0, 75)}..."`;
              }
            }
          }
        },
        scales: {
          x: { min: 2.7, max: 3.8, grid: { color: "#f1f5f9" } },
          y: { grid: { display: false }, ticks: { font: { size: 11, weight: "600" } } }
        }
      }
    });
  } else {
    document.getElementById("butirChartTitle").textContent = "Proporsi Perilaku Sering (Skor 3–4) vs Jarang (Skor 1–2)";
    document.getElementById("butirChartSubtitle").textContent = "Persentase jawaban responden di seluruh kelas XI";

    butirChart = new Chart(ctx, {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: "Sering / Selalu (Skor 3 & 4)",
            data: butirList.map(b => b.persen_sering),
            backgroundColor: "#10b981",
            borderRadius: 4
          },
          {
            label: "Tidak Pernah / Jarang (Skor 1 & 2)",
            data: butirList.map(b => b.persen_jarang),
            backgroundColor: "#f43f5e",
            borderRadius: 4
          }
        ]
      },
      options: {
        indexAxis: "y",
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: "top", labels: { usePointStyle: true, pointStyle: "circle", font: { size: 12, weight: "600" } } },
          tooltip: { callbacks: { label: ctx => ` ${ctx.dataset.label}: ${ctx.raw}%` } }
        },
        scales: {
          x: { stacked: true, max: 100, grid: { color: "#f1f5f9" }, ticks: { callback: v => v + "%" } },
          y: { stacked: true, grid: { display: false }, ticks: { font: { size: 11, weight: "600" } } }
        }
      }
    });
  }
}

// 5. Chart 4: Sebaran Skor Total (10 - 40)
function renderSebaranSkorChart() {
  const ctx = document.getElementById("sebaranSkorChart").getContext("2d");
  const list = datasetEnergi.sebaran_skor_total;

  if (sebaranSkorChart) sebaranSkorChart.destroy();

  sebaranSkorChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: list.map(d => d.skor_total),
      datasets: [{
        label: "Jumlah Siswa",
        data: list.map(d => d.jumlah),
        backgroundColor: list.map(d => d.skor_total >= 33 ? "#10b981" : d.skor_total >= 26 ? "#3b82f6" : "#f59e0b"),
        borderRadius: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            title: items => `Skor Total: ${items[0].label} / 40`,
            label: ctx => ` Jumlah Responden: ${ctx.raw} siswa`
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          title: { display: true, text: "Skor Total (10 Butir)", font: { size: 11, weight: "600" } }
        },
        y: {
          beginAtZero: true,
          grid: { color: "#f1f5f9" },
          title: { display: true, text: "Jumlah Siswa", font: { size: 11, weight: "600" } }
        }
      }
    }
  });
}

// 6. Chart 5: Perbandingan Per Rayon / Gaya Belajar
function renderDimensiChart() {
  const ctx = document.getElementById("dimensiChart").getContext("2d");
  if (dimensiChart) dimensiChart.destroy();

  if (dimensiMode === "rayon") {
    document.getElementById("dimensiChartTitle").textContent = "Perbandingan Skor per Rayon";
    document.getElementById("dimensiChartSubtitle").textContent = "Rata-rata skor perilaku hemat energi di 7 wilayah rayon";

    const list = datasetEnergi.per_rayon;
    dimensiChart = new Chart(ctx, {
      type: "bar",
      data: {
        labels: list.map(r => r.rayon),
        datasets: [{
          label: "Rata-rata Skor",
          data: list.map(r => r.rata_rata_skor),
          backgroundColor: "#6366f1",
          borderRadius: 7,
          barThickness: 28
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: ctx => {
                const r = list[ctx.dataIndex];
                return [` Rata-rata Skor: ${r.rata_rata_skor}`, ` Responden: ${r.jumlah_responden} siswa`];
              }
            }
          }
        },
        scales: {
          x: { grid: { display: false }, ticks: { font: { weight: "600" } } },
          y: { min: 3.1, max: 3.55, grid: { color: "#f1f5f9" } }
        }
      }
    });
  } else {
    document.getElementById("dimensiChartTitle").textContent = "Perbandingan Skor per Gaya Belajar";
    document.getElementById("dimensiChartSubtitle").textContent = "Visual (289), Kinestetik (201), dan Auditori (145)";

    const list = datasetEnergi.per_gaya_belajar;
    dimensiChart = new Chart(ctx, {
      type: "bar",
      data: {
        labels: list.map(g => `${g.gaya_belajar} (${g.jumlah_responden})`),
        datasets: [{
          label: "Rata-rata Skor",
          data: list.map(g => g.rata_rata_skor),
          backgroundColor: ["#8b5cf6", "#06b6d4", "#10b981"],
          borderRadius: 8,
          barThickness: 42
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: ctx => {
                const g = list[ctx.dataIndex];
                return [` Rata-rata Skor: ${g.rata_rata_skor}`, ` Sangat Baik: ${g.kategori_persen["Sangat Baik"]}%`];
              }
            }
          }
        },
        scales: {
          x: { grid: { display: false }, ticks: { font: { weight: "600" } } },
          y: { min: 3.1, max: 3.55, grid: { color: "#f1f5f9" } }
        }
      }
    });
  }
}

// 7. Render Tabel Per Rombel
function renderRombelTable(selectedJurusan) {
  const tbody = document.getElementById("rombelTableBody");
  const query = searchRombel.value.trim().toLowerCase();
  tbody.innerHTML = "";

  const filtered = datasetEnergi.per_rombel.filter(r => {
    const matchJur = selectedJurusan === "ALL" || r.jurusan === selectedJurusan;
    const matchQuery = !query || r.rombel.toLowerCase().includes(query) || r.jurusan.toLowerCase().includes(query);
    return matchJur && matchQuery;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9" class="py-8 text-center text-slate-400">Tidak ada rombel yang cocok dengan pencarian.</td></tr>`;
    return;
  }

  filtered.forEach(r => {
    const rank = datasetEnergi.per_rombel.findIndex(item => item.rombel === r.rombel) + 1;
    const kurangCukup = r.kategori["Cukup"] + r.kategori["Kurang"];
    const skorBadge = r.rata_rata_skor >= 3.45
      ? "bg-emerald-100 text-emerald-700"
      : r.rata_rata_skor >= 3.26
      ? "bg-blue-100 text-blue-700"
      : "bg-amber-100 text-amber-700";

    const tr = document.createElement("tr");
    tr.className = "hover:bg-slate-50 transition";
    tr.innerHTML = `
      <td class="py-3 px-4 font-bold text-slate-400">#${rank}</td>
      <td class="py-3 px-4 font-bold text-slate-800">${r.rombel}</td>
      <td class="py-3 px-4"><span class="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold text-[11px]">${r.jurusan}</span></td>
      <td class="py-3 px-4 text-center font-medium">${r.jumlah_responden}</td>
      <td class="py-3 px-4 text-center"><span class="px-2.5 py-0.5 rounded-full font-extrabold text-[11px] ${skorBadge}">${r.rata_rata_skor.toFixed(2)}</span></td>
      <td class="py-3 px-4 text-center font-semibold text-slate-700">${r.rata_rata_total} / 40</td>
      <td class="py-3 px-4 text-center text-emerald-600 font-semibold">${r.kategori["Sangat Baik"]} (${r.kategori_persen["Sangat Baik"]}%)</td>
      <td class="py-3 px-4 text-center text-blue-600 font-semibold">${r.kategori["Baik"]} (${r.kategori_persen["Baik"]}%)</td>
      <td class="py-3 px-4 text-center text-slate-500">${kurangCukup} siswa</td>
    `;
    tbody.appendChild(tr);
  });
}

// Update Seluruh Dashboard
function updateAll() {
  const jur = filterJurusan.value;
  updateKPIs(jur);
  renderKategoriChart(jur);
  renderJurusanChart(jur);
  renderButirChart(jur);
  renderRombelTable(jur);
}

// Event Listeners
filterJurusan.addEventListener("change", updateAll);
searchRombel.addEventListener("input", () => renderRombelTable(filterJurusan.value));

resetFilterBtn.addEventListener("click", () => {
  filterJurusan.value = "ALL";
  searchRombel.value = "";
  updateAll();
});

// Toggle Jurusan Chart
document.getElementById("btnJurusanAvg").addEventListener("click", function () {
  jurusanMode = "avg";
  this.className = "px-2.5 py-1 text-xs font-bold rounded-md bg-white text-emerald-700 shadow-sm transition cursor-pointer";
  document.getElementById("btnJurusanStack").className = "px-2.5 py-1 text-xs font-semibold rounded-md text-slate-600 hover:text-slate-900 transition cursor-pointer";
  renderJurusanChart(filterJurusan.value);
});

document.getElementById("btnJurusanStack").addEventListener("click", function () {
  jurusanMode = "stack";
  this.className = "px-2.5 py-1 text-xs font-bold rounded-md bg-white text-emerald-700 shadow-sm transition cursor-pointer";
  document.getElementById("btnJurusanAvg").className = "px-2.5 py-1 text-xs font-semibold rounded-md text-slate-600 hover:text-slate-900 transition cursor-pointer";
  renderJurusanChart(filterJurusan.value);
});

// Toggle Butir Chart
document.getElementById("btnButirAvg").addEventListener("click", function () {
  butirMode = "avg";
  this.className = "px-3 py-1 text-xs font-bold rounded-md bg-white text-emerald-700 shadow-sm transition cursor-pointer";
  document.getElementById("btnButirPersen").className = "px-3 py-1 text-xs font-semibold rounded-md text-slate-600 hover:text-slate-900 transition cursor-pointer";
  renderButirChart(filterJurusan.value);
});

document.getElementById("btnButirPersen").addEventListener("click", function () {
  butirMode = "persen";
  filterJurusan.value = "ALL";
  updateKPIs("ALL");
  renderKategoriChart("ALL");
  renderJurusanChart("ALL");
  renderRombelTable("ALL");
  this.className = "px-3 py-1 text-xs font-bold rounded-md bg-white text-emerald-700 shadow-sm transition cursor-pointer";
  document.getElementById("btnButirAvg").className = "px-3 py-1 text-xs font-semibold rounded-md text-slate-600 hover:text-slate-900 transition cursor-pointer";
  renderButirChart("ALL");
});

// Toggle Dimensi Chart (Rayon / Gaya Belajar)
document.getElementById("btnDimensiRayon").addEventListener("click", function () {
  dimensiMode = "rayon";
  this.className = "px-2.5 py-1 text-xs font-bold rounded-md bg-white text-emerald-700 shadow-sm transition cursor-pointer";
  document.getElementById("btnDimensiBelajar").className = "px-2.5 py-1 text-xs font-semibold rounded-md text-slate-600 hover:text-slate-900 transition cursor-pointer";
  renderDimensiChart();
});

document.getElementById("btnDimensiBelajar").addEventListener("click", function () {
  dimensiMode = "belajar";
  this.className = "px-2.5 py-1 text-xs font-bold rounded-md bg-white text-emerald-700 shadow-sm transition cursor-pointer";
  document.getElementById("btnDimensiRayon").className = "px-2.5 py-1 text-xs font-semibold rounded-md text-slate-600 hover:text-slate-900 transition cursor-pointer";
  renderDimensiChart();
});

// Ekspor CSV Data Rombel
exportCsvBtn.addEventListener("click", () => {
  const headers = ["Rombel", "Jurusan", "Responden", "Rata-rata Skor", "Rata-rata Total", "Sangat Baik", "Baik", "Cukup", "Kurang"];
  const rows = datasetEnergi.per_rombel.map(r => [
    r.rombel, r.jurusan, r.jumlah_responden, r.rata_rata_skor, r.rata_rata_total,
    r.kategori["Sangat Baik"], r.kategori["Baik"], r.kategori["Cukup"], r.kategori["Kurang"]
  ]);
  const csv = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
  const link = document.createElement("a");
  link.setAttribute("href", encodeURI(csv));
  link.setAttribute("download", "rekap_perilaku_energi_rombel.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
});

// Jalankan aplikasi
initDashboard();