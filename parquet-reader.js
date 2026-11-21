"use strict";

/**
 * parquet-reader.js: Pure JavaScript Parquet reader powered by hyparquet.
 * Zero external WASM or backend dependencies. Snappy decompression is built-in.
 */

async function loadParquetModel(parquetSource, fileName) {
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

  // Import local hyparquet ESM bundle
  const { parquetRead } = await import("./hyparquet.esm.js");

  const slots = new Map();
  const traceNumbers = new Set();
  let runMonthLabel = "";

  await parquetRead({
    file: arrayBuffer,
    onComplete: (data) => {
      // data: array of rows or column object
      // When columns are read, hyparquet returns an array of row arrays
      // We read schema to get column indices
    }
  });

  // Read full columnar data using parquetRead
  let columnNames = [];
  let rowList = [];
  await parquetRead({
    file: arrayBuffer,
    rowFormat: "object",
    onComplete: (rows) => {
      rowList = rows;
    }
  });

  for (let i = 0; i < rowList.length; i++) {
    const row = rowList[i];
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
        traces: new Map()
      });
    }

    const slotRec = slots.get(objectSlot);
    if (!slotRec.traces.has(trace)) {
      slotRec.traces.set(trace, {
        timesteps: [],
        values: [],
        isScalar: false
      });
    }

    const tr = slotRec.traces.get(trace);
    tr.timesteps.push(dt);
    tr.values.push(val);
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
    runCount: traceNumbers.size,
    runDate: runDate
  };
}
