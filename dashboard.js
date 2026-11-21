"use strict";

/**
 * dashboard.js: Historical Monthly Runs Dashboard
 * Embedded into index.html using the mockup.css styles and dashboard.html structure.
 */

let _catalog = [];
const MABBR = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function sparkSeries(seed) {
  const vals = [];
  let v = 40 + (seed % 17);
  for (let i = 0; i < 12; i++) {
    v += Math.sin(seed * 3.7 + i * 1.9) * 9;
    v = Math.max(12, Math.min(78, v));
    vals.push(v);
  }
  return vals;
}

function sparkSVG(seed, available) {
  const vals = sparkSeries(seed);
  const w = 120, h = 26, step = w / (vals.length - 1);
  const pts = vals.map((v, i) => (i * step).toFixed(1) + "," + (h - 2 - (v / 100) * (h - 6)).toFixed(1)).join(" ");
  const stroke = available ? "#167c80" : "#aeb8bd";
  return '<svg viewBox="0 0 ' + w + ' ' + h + '" preserveAspectRatio="none">' +
    '<polyline points="' + pts + '" fill="none" stroke="' + stroke + '" stroke-width="1.6" ' +
    'stroke-linejoin="round" stroke-linecap="round"/></svg>';
}

function tileHTML(m) {
  const parts = m.month.split("-");
  const yr = parseInt(parts[0], 10);
  const mo = parseInt(parts[1], 10);
  const abbr = MABBR[mo - 1] + " " + yr;
  const seed = parseInt(m.month.replace("-", ""), 10);

  if (!m.available) {
    return '<div class="month-tile empty" title="No run data for this month">' +
      '<span class="mt-month">' + abbr + '</span>' +
      '<span class="mt-meta">no data</span>' + sparkSVG(seed, false) +
      '</div>';
  }

  return '<a class="month-tile" href="javascript:void(0)" onclick="loadMonthRun(\'' + m.month + '\', \'' + m.file + '\')" ' +
    'title="Model run ' + abbr + ' — ' + (m.traces || 32) + ' ensemble traces. Click to open.">' +
    '<span class="mt-month">' + abbr + '</span>' +
    '<span class="mt-meta">' + (m.traces || 32) + ' traces &middot; ESP CRMMS</span>' +
    sparkSVG(seed, true) +
    '<span class="mt-open">Open &rarr;</span>' +
    '</a>';
}

function timelineHTML(list) {
  const max = 200;
  let out = "";
  list.forEach(m => {
    const parts = m.month.split("-");
    const yr = parseInt(parts[0], 10);
    const mo = parseInt(parts[1], 10);
    const abbr = MABBR[mo - 1] + " " + yr;
    if (!m.available) {
      out += '<div class="tl-row"><span class="tl-month">' + abbr + '</span>' +
        '<span class="tl-bar"></span><span class="tl-note">no data</span></div>';
    } else {
      const seed = parseInt(m.month.replace("-", ""), 10);
      const pct = 40 + (seed % 160);
      out += '<a class="tl-row" style="text-decoration:none;color:inherit" href="javascript:void(0)" onclick="loadMonthRun(\'' + m.month + '\', \'' + m.file + '\')">' +
        '<span class="tl-month">' + abbr + '</span>' +
        '<span class="tl-bar"><span style="width:' + (pct / max * 100).toFixed(0) + '%"></span></span>' +
        '<span class="tl-note">' + (m.traces || 32) + ' traces</span></a>';
    }
  });
  return out;
}

function renderDashboard() {
  const container = document.getElementById("dashboardSection");
  if (!container) return;

  const yf = document.getElementById("histYearFilter") ? document.getElementById("histYearFilter").value : "all";
  const vm = document.getElementById("histViewMode") ? document.getElementById("histViewMode").value : "grid";
  const body = document.getElementById("histBody");
  if (!body) return;

  // Extract unique years
  const allYears = Array.from(new Set(_catalog.map(m => parseInt(m.month.split("-")[0], 10)))).sort((a, b) => b - a);
  const years = yf === "all" ? allYears : [parseInt(yf, 10)];

  let html = "";
  years.forEach(y => {
    const list = _catalog.filter(m => parseInt(m.month.split("-")[0], 10) === y);
    if (vm === "grid") {
      html += '<div class="hist-year"><div class="hist-year-label">' + y + ' &mdash; ' + list.filter(m => m.available).length + ' runs</div>' +
        '<div class="month-grid">' + list.map(tileHTML).join("") + '</div></div>';
    } else {
      html += '<div class="hist-year"><div class="hist-year-label">' + y + ' &mdash; ' + list.filter(m => m.available).length + ' runs</div>' +
        '<div class="timeline">' + timelineHTML(list) + '</div></div>';
    }
  });

  body.innerHTML = html;
}

async function initDashboardCatalog() {
  try {
    const res = await fetch("data/runs/catalog.json");
    if (res.ok) {
      _catalog = await res.json();
    }
  } catch (err) {
    console.warn("Could not load catalog.json", err);
  }

  if (!_catalog || !_catalog.length) {
    // Default fallback if catalog.json is missing
    _catalog = [
      { month: "2026-07", file: "data/runs/2026-07.parquet", available: true, traces: 32 }
    ];
  }

  // Populate year filter
  const yearSelect = document.getElementById("histYearFilter");
  if (yearSelect) {
    const years = Array.from(new Set(_catalog.map(m => m.month.split("-")[0]))).sort((a, b) => b - a);
    yearSelect.innerHTML = '<option value="all">All years</option>' +
      years.map(y => '<option value="' + y + '">' + y + '</option>').join("");
    yearSelect.addEventListener("change", renderDashboard);
  }
  const viewSelect = document.getElementById("histViewMode");
  if (viewSelect) {
    viewSelect.addEventListener("change", renderDashboard);
  }

  renderDashboard();
}

function showDashboardView() {
  document.getElementById("dashboardSection").style.display = "block";
  document.getElementById("plotGrid").style.display = "none";
  if (typeof hideResCardsPanel === "function") hideResCardsPanel();
  const dt = document.getElementById("dataTableSection");
  if (dt) dt.style.display = "none";
  const tb = document.getElementById("chartToolbar");
  if (tb) tb.style.display = "none";

  // Update button active states in presetBar
  const btns = document.querySelectorAll("#presetBar button");
  btns.forEach(b => b.classList.remove("active"));
  const histBtn = document.getElementById("histDashboardBtn");
  if (histBtn) histBtn.classList.add("active");
}

function hideDashboardView() {
  document.getElementById("dashboardSection").style.display = "none";
  document.getElementById("plotGrid").style.display = "grid";
  const tb = document.getElementById("chartToolbar");
  if (tb) tb.style.display = "flex";

  const histBtn = document.getElementById("histDashboardBtn");
  if (histBtn) histBtn.classList.remove("active");
}

async function loadMonthRun(monthStr, filePath) {
  hideDashboardView();
  setStatus("Loading model run " + monthStr + " from Parquet...", "loading");
  try {
    const parquetModel = await loadParquetModel(filePath, monthStr + ".parquet");
    model = parquetModel;
    rebuildModel({ preserveView: true });
    setStatus("Loaded run <b>" + monthStr + "</b> via Parquet", "summary");
  } catch (err) {
    setStatus("Error loading " + monthStr + ": " + err.message, "error");
  }
}
