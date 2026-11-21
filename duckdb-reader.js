"use strict";

/**
 * duckdb-reader.js: Client-side Parquet reader powered by DuckDB-Wasm
 * Reads .parquet files and populates the model structure for crmms-esp-workbench.
 */

let _duckdb = null;
let _db = null;
let _conn = null;

async function initDuckDB() {
  if (_conn) return _conn;
  const duckdb = await import("https://cdn.jsdelivr.net/npm/@duckdb/duckdb-wasm@1.28.0/+esm");
  const JSDELIVR_BUNDLES = duckdb.getJsDelivrBundles();
  const bundle = await duckdb.selectBundle(JSDELIVR_BUNDLES);

  const worker_url = URL.createObjectURL(
    new Blob([`importScripts("${bundle.mainWorker}");`], { type: "text/javascript" })
  );

  const worker = new Worker(worker_url);
  const logger = new duckdb.ConsoleLogger();
  _db = new duckdb.AsyncDuckDB(logger, worker);
  await _db.instantiate(bundle.mainModule, bundle.pthreadWorker);
  URL.revokeObjectURL(worker_url);

  _conn = await _db.connect();
  return _conn;
}

/**
 * Loads a .parquet file from a URL or File object into the internal CRMMS model format.
 */
async function loadParquetModel(parquetSource, fileName) {
  const conn = await initDuckDB();

  let arrayBuffer;
  if (typeof parquetSource === "string") {
    const res = await fetch(parquetSource);
    if (!res.ok) throw new Error("HTTP " + res.status + " fetching " + parquetSource);
    arrayBuffer = await res.arrayBuffer();
  } else if (parquetSource instanceof ArrayBuffer) {
    arrayBuffer = parquetSource;
  } else if (parquetSource instanceof Blob) {
    arrayBuffer = await parquetSource.arrayBuffer();
  } else {
    throw new Error("Unsupported parquet source type");
  }

  const registeredName = "run_" + Math.random().toString(36).slice(2) + ".parquet";
  await _db.registerFileBuffer(registeredName, new Uint8Array(arrayBuffer));

  // Query table data
  const result = await conn.query(`
    SELECT 
      period_date, year, month, timestep_type,
      trace_number, esp_year, object_name, slot_name,
      object_slot, value, unit, model_run_month
    FROM '${registeredName}'
    ORDER BY object_slot, trace_number, period_date
  `);

  const slots = new Map();
  const traceNumbers = new Set();
  let runMonthLabel = "";

  const rows = result.toArray();
  for (const row of rows) {
    const objectSlot = row.object_slot;
    const trace = row.trace_number;
    const dt = row.period_date;
    const yr = row.year;
    const mo = row.month;
    const tt = row.timestep_type;
    const unit = row.unit;
    const val = row.value;
    if (!runMonthLabel && row.model_run_month) {
      runMonthLabel = row.model_run_month;
    }

    traceNumbers.add(trace);

    if (!slots.has(objectSlot)) {
      slots.set(objectSlot, {
        unit: unit,
        scale: 1,
        timestepType: tt,
        traces: new Map(),
        files: new Set([fileName])
      });
    }

    const slotRec = slots.get(objectSlot);
    if (!slotRec.traces.has(trace)) {
      slotRec.traces.set(trace, {
        timesteps: [],
        values: [],
        points: []
      });
    }

    const tr = slotRec.traces.get(trace);
    tr.timesteps.push(dt);
    tr.values.push(val);
    tr.points.push({
      timestep: dt,
      periodDate: dt,
      year: yr,
      month: mo,
      day: 1,
      idx: tr.points.length + 1,
      value: val
    });
  }

  let runDate = null;
  if (runMonthLabel) {
    const parts = runMonthLabel.split("-");
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    const mNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    runDate = { year: y, month: m, label: mNames[m - 1] + " " + y };
  }

  return {
    name: fileName,
    meta: {
      create_date: runDate ? `${runDate.year}-${runDate.month}-01 00:00` : "",
      number_of_runs: traceNumbers.size
    },
    slots: slots,
    runCount: traceNumbers.size
  };
}
