/**
 * KitaPeduli · Interactive Features & Scroll Animations
 * Proyek Kampanye Hemat Energi Siswa Kelas XI
 */

document.addEventListener('DOMContentLoaded', () => {
  initSmoothScroll();
  initNavbarActiveWatcher();
  initScrollAnimations();
});

/* ==========================================================================
   Smooth Scroll dengan Offset Dinamis
   ========================================================================== */
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      const targetId = link.getAttribute('href');
      if (targetId === '#' || targetId === '') return;
      const target = document.querySelector(targetId);
      if (!target) return;
      
      e.preventDefault();
      const navbarHeight = document.querySelector('.navbar')?.offsetHeight || 70;
      const elementPosition = target.getBoundingClientRect().top + window.pageYOffset;
      const offsetPosition = elementPosition - navbarHeight;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    });
  });
}

/* ==========================================================================
   Navbar Active Link Watcher saat Scroll
   ========================================================================== */
function initNavbarActiveWatcher() {
  const sections = document.querySelectorAll('section[id], header[id]');
  const navLinks = document.querySelectorAll('.navbar-menu .navbar-link:not(.disabled)');

  window.addEventListener('scroll', () => {
    let currentId = '';
    const scrollY = window.pageYOffset;

    sections.forEach(section => {
      const sectionTop = section.offsetTop - 120;
      const sectionHeight = section.offsetHeight;
      if (scrollY >= sectionTop && scrollY < sectionTop + sectionHeight) {
        currentId = section.getAttribute('id');
      }
    });

    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${currentId}`) {
        link.classList.add('active');
      }
    });
  }, { passive: true });
}

/* ==========================================================================
   Scroll Reveal, Count-Up & Lazy Chart Animation (IntersectionObserver)
   ========================================================================== */
const initializedCharts = new Set();

function initScrollAnimations() {
  // Cek dukungan IntersectionObserver
  if (!('IntersectionObserver' in window)) {
    // Fallback untuk browser lawas: render semua langsung
    document.querySelectorAll('.fade-up').forEach(el => el.classList.add('is-visible'));
    document.querySelectorAll('.stat-value[data-target]').forEach(el => {
      el.textContent = el.getAttribute('data-target') + (el.getAttribute('data-suffix') || '');
    });
    renderAllCharts();
    return;
  }

  const observerOptions = {
    root: null,
    rootMargin: '0px 0px -50px 0px',
    threshold: 0.15
  };

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const target = entry.target;
        target.classList.add('is-visible');

        // 1. Animasi Angka Statistik (Count-Up)
        if (target.classList.contains('stat-card') || target.querySelector('.stat-value')) {
          const statValue = target.classList.contains('stat-value') 
            ? target 
            : target.querySelector('.stat-value');
          if (statValue && !statValue.dataset.counted) {
            statValue.dataset.counted = 'true';
            animateCountUp(statValue);
          }
        }

        // 2. Animasi Render Grafik Chart.js saat terlihat di viewport
        const chartCanvas = target.querySelector('canvas') || (target.tagName === 'CANVAS' ? target : null);
        if (chartCanvas && chartCanvas.dataset.chartId) {
          const chartId = chartCanvas.dataset.chartId;
          if (!initializedCharts.has(chartId)) {
            initializedCharts.add(chartId);
            renderChartById(chartId);
          }
        }

        // Unobserve setelah diaktifkan
        obs.unobserve(target);
      }
    });
  }, observerOptions);

  // Daftarkan elemen fade-up, stat-card, dan chart-card
  document.querySelectorAll('.fade-up, .stat-card, .chart-card').forEach(el => {
    observer.observe(el);
  });
}

/* ==========================================================================
   Animasi Counter Angka (Count-Up)
   ========================================================================== */
function animateCountUp(element) {
  const target = parseFloat(element.getAttribute('data-target'));
  const decimals = parseInt(element.getAttribute('data-decimals') || '0', 10);
  const suffix = element.getAttribute('data-suffix') || '';
  const duration = 1400; // ms
  const startTime = performance.now();

  function updateNumber(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    // Easing: easeOutExpo
    const easeOut = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
    const currentVal = (easeOut * target).toFixed(decimals);

    element.innerHTML = `${currentVal}${suffix ? `<small>${suffix}</small>` : ''}`;

    if (progress < 1) {
      requestAnimationFrame(updateNumber);
    } else {
      element.innerHTML = `${target.toFixed(decimals)}${suffix ? `<small>${suffix}</small>` : ''}`;
    }
  }

  requestAnimationFrame(updateNumber);
}

/* ==========================================================================
   Konfigurasi Tema & Render Grafik Chart.js
   ========================================================================== */

// Setup styling default Chart.js agar elegan dan tidak kaku
function setupChartDefaults() {
  if (typeof Chart === 'undefined') return;

  Chart.defaults.font.family = "'Inter', system-ui, -apple-system, sans-serif";
  Chart.defaults.color = '#4D6654';
  
  // Custom Tooltip Styling
  Chart.defaults.plugins.tooltip.backgroundColor = '#1E4A2B';
  Chart.defaults.plugins.tooltip.titleColor = '#FFFFFF';
  Chart.defaults.plugins.tooltip.titleFont = { weight: '700', size: 13 };
  Chart.defaults.plugins.tooltip.bodyColor = '#E8F2EA';
  Chart.defaults.plugins.tooltip.bodyFont = { size: 12 };
  Chart.defaults.plugins.tooltip.padding = 12;
  Chart.defaults.plugins.tooltip.cornerRadius = 8;
  Chart.defaults.plugins.tooltip.boxPadding = 6;
  Chart.defaults.plugins.tooltip.usePointStyle = true;
}

setupChartDefaults();

function renderAllCharts() {
  ['energiChart', 'jurusanChart', 'kategoriChart', 'rombelChart'].forEach(id => {
    if (!initializedCharts.has(id)) {
      initializedCharts.add(id);
      renderChartById(id);
    }
  });
}

function renderChartById(chartId) {
  if (typeof DATA_ENERGI === 'undefined') {
    console.warn("DATA_ENERGI belum dimuat.");
    return;
  }

  switch (chartId) {
    case 'energiChart':
      buildEnergiChart();
      break;
    case 'jurusanChart':
      buildJurusanChart();
      break;
    case 'kategoriChart':
      buildKategoriChart();
      break;
    case 'rombelChart':
      buildRombelChart();
      break;
  }
}

// --------------------------------------------------------------------------
// 1. GRAFIK SKOR PERILAKU (10 Butir Pernyataan)
// --------------------------------------------------------------------------
function buildEnergiChart() {
  const ctx = document.getElementById('energiChart');
  if (!ctx) return;

  const labels = DATA_ENERGI.per_butir.map(item => item.label);
  const skorRataRata = DATA_ENERGI.per_butir.map(item => item.rata_rata);

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Rata-rata Skor (1-4)',
        data: skorRataRata,
        backgroundColor: '#2F7A3E',
        hoverBackgroundColor: '#1E4A2B',
        borderRadius: 6,
        borderSkipped: false
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 1200,
        easing: 'easeOutQuart'
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 4,
          grid: {
            color: 'rgba(220, 231, 220, 0.65)'
          },
          ticks: {
            stepSize: 1,
            color: '#4D6654',
            font: { weight: '600' }
          }
        },
        x: {
          grid: { display: false },
          ticks: {
            autoSkip: false,
            maxRotation: 28,
            minRotation: 20,
            color: '#1A2E1F',
            font: { size: 11, weight: '500' },
            callback: function(val) {
              const label = this.getLabelForValue(val);
              return label.length > 24 ? label.substring(0, 24) + '...' : label;
            }
          }
        }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            title: function(context) {
              return DATA_ENERGI.per_butir[context[0].dataIndex].label;
            },
            label: function(context) {
              return ` Skor: ${context.parsed.y.toFixed(2)} dari 4.00`;
            }
          }
        }
      }
    }
  });
}

// --------------------------------------------------------------------------
// 2. GRAFIK SKOR PER JURUSAN (Diurutkan dari Terendah ke Tertinggi)
// --------------------------------------------------------------------------
function buildJurusanChart() {
  const ctx = document.getElementById('jurusanChart');
  if (!ctx) return;

  const jurusanSorted = [...DATA_ENERGI.per_jurusan].sort((a, b) => a.rata_rata_skor - b.rata_rata_skor);
  const jurusanLabels = jurusanSorted.map(item => item.kode);
  const jurusanSkor = jurusanSorted.map(item => item.rata_rata_skor);
  
  // Berikan highlight kuning aksen pada 2 jurusan skor terendah (PPLG & MPLB)
  const bgColors = jurusanSkor.map((_, i) => i < 2 ? '#F4B942' : '#2F7A3E');
  const hoverColors = jurusanSkor.map((_, i) => i < 2 ? '#E5A82E' : '#1E4A2B');

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: jurusanLabels,
      datasets: [{
        label: 'Skor Rata-rata',
        data: jurusanSkor,
        backgroundColor: bgColors,
        hoverBackgroundColor: hoverColors,
        borderRadius: 6,
        borderSkipped: false
      }]
    },
    options: {
      responsive: true,
      animation: {
        duration: 1100,
        easing: 'easeOutQuart'
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 4,
          grid: {
            color: 'rgba(220, 231, 220, 0.65)'
          },
          ticks: {
            stepSize: 1,
            color: '#4D6654'
          }
        },
        x: {
          grid: { display: false },
          ticks: {
            color: '#1A2E1F',
            font: { weight: '600', size: 12 }
          }
        }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            title: function(context) {
              return jurusanSorted[context[0].dataIndex].nama;
            },
            label: function(context) {
              return ` Rata-rata: ${context.parsed.y.toFixed(2)} / 4.00`;
            }
          }
        }
      }
    }
  });
}

// --------------------------------------------------------------------------
// 3. GRAFIK KATEGORI KESADARAN (Doughnut Chart)
// --------------------------------------------------------------------------
function buildKategoriChart() {
  const ctx = document.getElementById('kategoriChart');
  if (!ctx) return;

  const kategoriLabels = Object.keys(DATA_ENERGI.ringkasan.kategori); 
  const kategoriData = Object.values(DATA_ENERGI.ringkasan.kategori); 
  const persenMap = DATA_ENERGI.ringkasan.kategori_persen;

  new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: kategoriLabels,
      datasets: [{
        data: kategoriData,
        backgroundColor: ['#2F7A3E', '#F4B942', '#8DAA91', '#DCE7DC'],
        hoverBackgroundColor: ['#1E4A2B', '#E5A82E', '#739578', '#C3D4C3'],
        borderWidth: 3,
        borderColor: '#FFFFFF',
        hoverOffset: 6
      }]
    },
    options: {
      responsive: true,
      cutout: '70%',
      animation: {
        animateRotate: true,
        animateScale: true,
        duration: 1300,
        easing: 'easeOutQuart'
      },
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            boxWidth: 12,
            boxHeight: 12,
            usePointStyle: true,
            pointStyle: 'circle',
            padding: 16,
            color: '#1A2E1F',
            font: { size: 12, weight: '500' }
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const label = context.label || '';
              const count = context.parsed;
              const persen = persenMap[label] || (count / 636 * 100).toFixed(1);
              return ` ${count} Siswa (${persen}%)`;
            }
          }
        }
      }
    }
  });
}

// --------------------------------------------------------------------------
// 4. GRAFIK SKOR PER ROMBEL
// --------------------------------------------------------------------------
function buildRombelChart() {
  const ctx = document.getElementById('rombelChart');
  if (!ctx) return;

  const rombelSorted = [...DATA_ENERGI.per_rombel].sort((a, b) => b.rata_rata_skor - a.rata_rata_skor);
  const rombelLabels = rombelSorted.map(item => item.rombel);
  const rombelSkor = rombelSorted.map(item => item.rata_rata_skor);

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: rombelLabels,
      datasets: [{
        label: 'Rata-rata Skor per Rombel',
        data: rombelSkor,
        backgroundColor: '#2F7A3E',
        hoverBackgroundColor: '#1E4A2B',
        borderRadius: 5,
        borderSkipped: false
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 1300,
        easing: 'easeOutQuart'
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 4,
          grid: {
            color: 'rgba(220, 231, 220, 0.65)'
          },
          ticks: {
            stepSize: 1,
            color: '#4D6654'
          }
        },
        x: {
          grid: { display: false },
          ticks: {
            autoSkip: false,
            maxRotation: 45,
            minRotation: 35,
            color: '#1A2E1F',
            font: { size: 10, weight: '500' }
          }
        }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            title: function(context) {
              return `Rombel: ${context[0].label}`;
            },
            label: function(context) {
              return ` Rata-rata Skor: ${context.parsed.y.toFixed(2)} / 4.00`;
            }
          }
        }
      }
    }
  });
}
