document.addEventListener('DOMContentLoaded', () => {
  initSmoothScroll();
  initChart(); 
});

function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      const target = document.querySelector(link.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
}

function initChart() {
  try {
    // ==========================================
    // 1. GRAFIK SKOR PERILAKU (Sekarang Full Lebar)
    // ==========================================
    const ctx1 = document.getElementById('energiChart');
    if (ctx1) {
      const labels = DATA_ENERGI.per_butir.map(item => item.label);
      const skorRataRata = DATA_ENERGI.per_butir.map(item => item.rata_rata);

      new Chart(ctx1, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [{
            label: 'Rata-rata Skor (1-4)',
            data: skorRataRata,
            backgroundColor: '#F4B942',
            borderColor: '#1E4A2B',
            borderWidth: 1,
            borderRadius: 4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: { beginAtZero: true, max: 4 },
            x: {
              ticks: {
                autoSkip: false,
                maxRotation: 30, // Dimiringin sedikit aja karena sekarang tempatnya luas
                minRotation: 30,
                callback: function(val) {
                  let label = this.getLabelForValue(val);
                  return label.length > 25 ? label.substring(0, 25) + '...' : label;
                }
              }
            }
          },
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                title: function(context) { return DATA_ENERGI.per_butir[context[0].dataIndex].label; }
              }
            }
          }
        }
      });
    }

    // ==========================================
    // 2. GRAFIK SKOR PER JURUSAN (Diurutkan dari Terendah)
    // ==========================================
    const ctx4 = document.getElementById('jurusanChart');
    if (ctx4) {
      // Sortir ascending: terkecil (paling gak peka) ke terbesar
      const jurusanSorted = [...DATA_ENERGI.per_jurusan].sort((a, b) => a.rata_rata_skor - b.rata_rata_skor);
      const jurusanLabels = jurusanSorted.map(item => item.kode);
      const jurusanSkor = jurusanSorted.map(item => item.rata_rata_skor);
      
      // Kasih warna aksen kuning buat 2 jurusan paling bawah (PPLG & MPLB)
      const bgColors = jurusanSkor.map((skor, i) => i < 2 ? '#F4B942' : '#8DAA91');

      new Chart(ctx4, {
        type: 'bar',
        data: {
          labels: jurusanLabels,
          datasets: [{
            label: 'Skor Rata-rata',
            data: jurusanSkor,
            backgroundColor: bgColors,
            borderColor: '#1E4A2B',
            borderWidth: 1,
            borderRadius: 4
          }]
        },
        options: {
          responsive: true,
          scales: {
            y: { beginAtZero: true, max: 4 }
          },
          plugins: {
            legend: { display: false },
            tooltip: {
               callbacks: {
                 title: function(context) { return jurusanSorted[context[0].dataIndex].nama; } // Nampilin nama jurusan lengkap pas dihover
               }
            }
          }
        }
      });
    }

    // ==========================================
    // 3. GRAFIK KATEGORI KESADARAN (Doughnut)
    // ==========================================
    const ctx2 = document.getElementById('kategoriChart');
    if (ctx2) {
      const kategoriLabels = Object.keys(DATA_ENERGI.ringkasan.kategori); 
      const kategoriData = Object.values(DATA_ENERGI.ringkasan.kategori); 

      new Chart(ctx2, {
        type: 'doughnut',
        data: {
          labels: kategoriLabels,
          datasets: [{
            data: kategoriData,
            backgroundColor: ['#2F7A3E', '#F4B942', '#8DAA91', '#DCE7DC'],
            borderWidth: 2,
            borderColor: '#FFFFFF'
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: { position: 'bottom', labels: { font: { family: "'Inter', sans-serif" }, color: '#1A2E1F' } }
          }
        }
      });
    }

    // ==========================================
    // 4. GRAFIK SKOR PER ROMBEL
    // ==========================================
    const ctx3 = document.getElementById('rombelChart');
    if (ctx3) {
      const rombelSorted = [...DATA_ENERGI.per_rombel].sort((a, b) => b.rata_rata_skor - a.rata_rata_skor);
      const rombelLabels = rombelSorted.map(item => item.rombel);
      const rombelSkor = rombelSorted.map(item => item.rata_rata_skor);

      new Chart(ctx3, {
        type: 'bar',
        data: {
          labels: rombelLabels,
          datasets: [{
            label: 'Rata-rata Skor per Rombel',
            data: rombelSkor,
            backgroundColor: '#2F7A3E', 
            borderColor: '#1E4A2B',
            borderWidth: 1,
            borderRadius: 4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false, 
          scales: {
            y: { beginAtZero: true, max: 4 },
            x: {
              ticks: { autoSkip: false, maxRotation: 45, minRotation: 45 }
            }
          },
          plugins: {
            legend: { display: false }
          }
        }
      });
    }

  } catch (error) {
    console.error("Gagal memuat data grafik:", error);
  }
}
