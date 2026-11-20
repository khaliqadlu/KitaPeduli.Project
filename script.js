/**
 * KitaPeduli · Interactive Features & Recurring Scroll Animations
 * Proyek Kampanye Hemat Energi Siswa Kelas XI
 */

document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initScrollAnimations();
});

/* ==========================================================================
   1. Navigasi: Smooth Scroll & Active Indicator saat Menggulir
   ========================================================================== */
function initNavigation() {
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', e => {
      const target = document.querySelector(link.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      const navH = document.querySelector('.navbar')?.offsetHeight || 70;
      window.scrollTo({ top: target.offsetTop - navH, behavior: 'smooth' });
    });
  });

  const sections = document.querySelectorAll('section[id], header[id]');
  const links = document.querySelectorAll('.navbar-menu .navbar-link:not(.disabled)');

  window.addEventListener('scroll', () => {
    let currentId = '';
    const scrollPos = window.pageYOffset + 120;
    sections.forEach(s => {
      if (scrollPos >= s.offsetTop && scrollPos < s.offsetTop + s.offsetHeight) {
        currentId = s.id;
      }
    });
    links.forEach(l => l.classList.toggle('active', l.getAttribute('href') === `#${currentId}`));
  }, { passive: true });
}

/* ==========================================================================
   2. Animasi Berulang saat Scroll (Scroll In & Out)
   ========================================================================== */
const chartInstances = {};

function initScrollAnimations() {
  if (!('IntersectionObserver' in window)) {
    document.querySelectorAll('.fade-up').forEach(el => el.classList.add('is-visible'));
    renderAllCharts();
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const target = entry.target;

      if (entry.isIntersecting) {
        if (!target._active) {
          target._active = true;
          target.classList.add('is-visible');

          // Animasi counter angka statistik
          const statVal = target.classList.contains('stat-value')
            ? target
            : target.querySelector('.stat-value');
          if (statVal) animateCountUp(statVal);

          // Animasi grafik saat masuk layar
          const canvas = target.querySelector('canvas') || (target.tagName === 'CANVAS' ? target : null);
          if (canvas && canvas.dataset.chartId) {
            buildOrReplayChart(canvas.dataset.chartId);
          }
        }
      } else {
        // Ketika keluar layar: reset status agar saat di-scroll lagi, animasi berputar ulang
        target._active = false;
        target.classList.remove('is-visible');
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.fade-up, .stat-card, .chart-card').forEach(el => observer.observe(el));
}

/* ==========================================================================
   3. Counter Angka (Count-Up)
   ========================================================================== */
function animateCountUp(el) {
  const target = parseFloat(el.getAttribute('data-target'));
  const decimals = parseInt(el.getAttribute('data-decimals') || '0', 10);
  const suffix = el.getAttribute('data-suffix') || '';
  const duration = 1100;
  const start = performance.now();

  function step(now) {
    const p = Math.min((now - start) / duration, 1);
    const ease = 1 - Math.pow(1 - p, 3); // easeOutCubic
    el.innerHTML = `${(ease * target).toFixed(decimals)}${suffix ? `<small>${suffix}</small>` : ''}`;
    if (p < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

/* ==========================================================================
   4. Chart.js Defaults & Pembuat Grafik Ringkas
   ========================================================================== */
if (typeof Chart !== 'undefined') {
  Chart.defaults.font.family = "'Inter', system-ui, -apple-system, sans-serif";
  Chart.defaults.color = '#4D6654';
  Chart.defaults.plugins.tooltip.backgroundColor = '#1E4A2B';
  Chart.defaults.plugins.tooltip.titleColor = '#FFFFFF';
  Chart.defaults.plugins.tooltip.bodyColor = '#E8F2EA';
  Chart.defaults.plugins.tooltip.padding = 10;
  Chart.defaults.plugins.tooltip.cornerRadius = 8;
  Chart.defaults.plugins.tooltip.boxPadding = 5;
}

// Helper pembuat bar chart agar kode ringkas dan tidak berulang
function makeBarChart(id, { labels, data, colors, hoverColors, xTicks = {}, tooltipTitle, tooltipLabel }) {
  const ctx = document.getElementById(id);
  if (!ctx || typeof DATA_ENERGI === 'undefined') return null;

  return new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: colors,
        hoverBackgroundColor: hoverColors,
        borderRadius: 6,
        borderSkipped: false
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 950, easing: 'easeOutQuart' },
      scales: {
        y: {
          beginAtZero: true,
          max: 4,
          grid: { color: 'rgba(220, 231, 220, 0.65)' },
          ticks: { stepSize: 1, color: '#4D6654' }
        },
        x: {
          grid: { display: false },
          ticks: { ...xTicks, color: '#1A2E1F' }
        }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            title: tooltipTitle,
            label: tooltipLabel
          }
        }
      }
    }
  });
}

function buildOrReplayChart(chartId) {
  if (typeof DATA_ENERGI === 'undefined') return;

  if (chartInstances[chartId]) {
    // Reset dan re-update agar animasi bermain ulang tiap kali scroll ke bawah
    chartInstances[chartId].reset();
    chartInstances[chartId].update();
    return;
  }

  // Bangun grafik pertama kali
  if (chartId === 'energiChart') {
    chartInstances.energiChart = makeBarChart('energiChart', {
      labels: DATA_ENERGI.per_butir.map(d => d.label),
      data: DATA_ENERGI.per_butir.map(d => d.rata_rata),
      colors: '#2F7A3E',
      hoverColors: '#1E4A2B',
      xTicks: {
        autoSkip: false, maxRotation: 28, minRotation: 20, font: { size: 11 },
        callback: function(val) {
          const l = this.getLabelForValue(val);
          return l.length > 24 ? l.slice(0, 24) + '...' : l;
        }
      },
      tooltipTitle: ctx => DATA_ENERGI.per_butir[ctx[0].dataIndex]?.label,
      tooltipLabel: ctx => ` Skor: ${ctx.parsed.y.toFixed(2)} dari 4.00`
    });
  } else if (chartId === 'jurusanChart') {
    const sorted = [...DATA_ENERGI.per_jurusan].sort((a, b) => a.rata_rata_skor - b.rata_rata_skor);
    chartInstances.jurusanChart = makeBarChart('jurusanChart', {
      labels: sorted.map(d => d.kode),
      data: sorted.map(d => d.rata_rata_skor),
      colors: sorted.map((_, i) => i < 2 ? '#F4B942' : '#2F7A3E'),
      hoverColors: sorted.map((_, i) => i < 2 ? '#E5A82E' : '#1E4A2B'),
      xTicks: { font: { weight: '600' } },
      tooltipTitle: ctx => sorted[ctx[0].dataIndex]?.nama,
      tooltipLabel: ctx => ` Rata-rata: ${ctx.parsed.y.toFixed(2)} / 4.00`
    });
  } else if (chartId === 'kategoriChart') {
    const ctx = document.getElementById('kategoriChart');
    if (!ctx) return;
    const labels = Object.keys(DATA_ENERGI.ringkasan.kategori);
    const data = Object.values(DATA_ENERGI.ringkasan.kategori);
    const persen = DATA_ENERGI.ringkasan.kategori_persen;

    chartInstances.kategoriChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data,
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
        animation: { animateRotate: true, animateScale: true, duration: 1100, easing: 'easeOutQuart' },
        plugins: {
          legend: {
            position: 'bottom',
            labels: { boxWidth: 12, usePointStyle: true, pointStyle: 'circle', padding: 14, color: '#1A2E1F', font: { size: 12 } }
          },
          tooltip: {
            callbacks: {
              label: ctx => ` ${ctx.parsed} Siswa (${persen[ctx.label] || ''}%)`
            }
          }
        }
      }
    });
  } else if (chartId === 'rombelChart') {
    const rombelSorted = [...DATA_ENERGI.per_rombel].sort((a, b) => b.rata_rata_skor - a.rata_rata_skor);
    chartInstances.rombelChart = makeBarChart('rombelChart', {
      labels: rombelSorted.map(d => d.rombel),
      data: rombelSorted.map(d => d.rata_rata_skor),
      colors: '#2F7A3E',
      hoverColors: '#1E4A2B',
      xTicks: { autoSkip: false, maxRotation: 45, minRotation: 35, font: { size: 10 } },
      tooltipTitle: ctx => `Rombel: ${ctx[0].label}`,
      tooltipLabel: ctx => ` Rata-rata Skor: ${ctx.parsed.y.toFixed(2)} / 4.00`
    });
  }
}

function renderAllCharts() {
  ['energiChart', 'jurusanChart', 'kategoriChart', 'rombelChart'].forEach(buildOrReplayChart);
}

