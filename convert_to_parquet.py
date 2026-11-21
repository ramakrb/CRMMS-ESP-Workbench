"""Convert RiverWare .rdf output files into optimized Parquet files.

Usage:
  python convert_to_parquet.py
  python convert_to_parquet.py --input-dir data --output-dir data/runs --month 2026-07
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path
import sys

import pandas as pd
import rdf_reader


def convert_monthly_bundle(
    input_dir: Path,
    output_file: Path,
    model_run_month: str,
) -> int:
    """Reads all .rdf files in input_dir and writes an optimized .parquet file."""
    rdf_files = sorted(input_dir.glob("*.rdf"))
    if not rdf_files:
        print(f"No .rdf files found in {input_dir}")
        return 0

    print(f"Converting {len(rdf_files)} .rdf files from {input_dir} for run {model_run_month}...")
    dfs = []
    
    for rdf_file in rdf_files:
        try:
            print(f"  Reading {rdf_file.name}...")
            df = rdf_reader.read_rdf(rdf_file)
            
            # Select essential columns
            cols = [
                "period_date", "year", "month", "timestep_type",
                "trace_number", "esp_year", "object_name", "slot_name",
                "object_slot", "value", "unit"
            ]
            df = df[[c for c in cols if c in df.columns]].copy()
            df["rdf_source"] = rdf_file.stem
            df["model_run_month"] = model_run_month
            dfs.append(df)
            print(f"    -> {len(df):,} rows parsed")
        except Exception as e:
            print(f"    Warning: Could not parse {rdf_file.name}: {e}")

    if not dfs:
        print("No data extracted.")
        return 0

    combined = pd.concat(dfs, ignore_index=True)

    # Convert period_date to string YYYY-MM-DD for fast browser JSON/JS compatibility
    combined["period_date"] = combined["period_date"].dt.strftime("%Y-%m-%d").fillna("")

    # Optimize data types to compress cleanly into Parquet
    cat_cols = [
        "rdf_source", "timestep_type", "object_name",
        "slot_name", "object_slot", "unit", "model_run_month"
    ]
    for col in cat_cols:
        if col in combined:
            combined[col] = combined[col].astype("category")

    combined["value"] = combined["value"].astype("float32")
    combined["trace_number"] = combined["trace_number"].astype("int16")
    combined["year"] = combined["year"].astype("int16")
    if "month" in combined:
        combined["month"] = combined["month"].astype("Int8")
    if "esp_year" in combined:
        combined["esp_year"] = combined["esp_year"].astype("Int16")

    # Sort to optimize columnar clustering and row group filtering
    combined = combined.sort_values(
        by=["object_slot", "trace_number", "period_date"]
    ).reset_index(drop=True)

    output_file.parent.mkdir(parents=True, exist_ok=True)
    combined.to_parquet(output_file, compression="zstd", index=False)
    size_mb = output_file.stat().st_size / (1024 * 1024)
    print(f"Successfully saved {output_file} ({len(combined):,} rows, {size_mb:.2f} MB)")
    return len(combined)


def build_catalog(runs_dir: Path, catalog_file: Path):
    """Builds a lightweight runs_catalog.json for the web dashboard."""
    runs = []
    for p in sorted(runs_dir.glob("*.parquet")):
        month_id = p.stem  # e.g. "2026-07"
        runs.append({
            "month": month_id,
            "file": f"data/runs/{p.name}",
            "available": True,
            "traces": 32
        })
    with open(catalog_file, "w", encoding="utf-8") as f:
        json.dump(runs, f, indent=2)
    print(f"Updated runs catalog: {catalog_file} with {len(runs)} runs.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Convert RDF files to Parquet")
    parser.add_argument("--input-dir", type=Path, default=Path("data"), help="Directory containing .rdf files")
    parser.add_argument("--output-file", type=Path, default=Path("data/runs/2026-07.parquet"), help="Path to output .parquet")
    parser.add_argument("--month", type=str, default="2026-07", help="Model run month (YYYY-MM)")
    parser.add_argument("--catalog", type=Path, default=Path("data/runs/catalog.json"), help="Catalog JSON output")
    args = parser.parse_args()

    convert_monthly_bundle(args.input_dir, args.output_file, args.month)
    build_catalog(args.output_file.parent, args.catalog)
