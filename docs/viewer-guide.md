# CRMMS ESP Plot Viewer — User Guide

A single-page, serverless viewer for RiverWare RDF model output. It loads one or
more `.rdf` files, renders the CRMMS Explorer preset plots and custom table
presets, and requires no installation.

**Opening the page**

- **Hosted (GitHub Pages):** the page fetches the RDF file(s) listed in its
  configuration and loads automatically — no clicks needed.
- **From disk:** double-click `index.html`. Browsers block automatic file
  reading from disk, so a **drop zone** appears — drag one or more `.rdf`
  files onto it (or click **Browse for files**). Files are processed entirely
  in your browser; nothing is uploaded.
- **Add different files later:** the toolbar's **Add RDF files** button opens
  the same picker; dropping new files replaces the current data.

**Model run badge**

The teal badge in the title area — *Model run: Month Year* — is read from the
`create_date` line inside the RDF file, so it always identifies the model run
you are looking at. It also appears in the printed report.

---

## Preset bars

Two bars sit above the charts:

- **Plots** — the saved plot preset groups (e.g. *Powell + Mead Elevations*,
  *Powell Inflow PE*, *LC Evap*). Clicking one renders its chart cards.
- **Tables** — the saved table presets (e.g. *Slot Analysis*). Clicking one
  renders its table blocks in place of the charts; click a plot preset to
  switch back.

---

## Toolbar

| Control | What it does |
|---|---|
| **Traces** | Checkbox per trace. Ensemble traces (ESP 1991–2020) are shown by default; deterministic Max/Min/Most are opt-in. Buttons: **All**, **Ensemble only**, **None**. Your choice is remembered. |
| **Columns** | Chart grid width: 1, 2 or 3 columns. |
| **Height** | Chart height in pixels (250–700). |
| **Add plot** | Adds a new chart card to the current preset (see *Plot settings* below). |
| **Reset preset** | Undoes all adjustments made to the current preset (removed plots, changed settings, year choices). |
| **Build report** | Opens a printable report: every chart as an image, editable notes and assumptions, and the data table. Use *Print / Save as PDF*. |
| **Add RDF files** | Loads different `.rdf` files (replaces the current data). |

---

## Chart cards

Each card has:

- A **header bar** with the plot title, the slot and transform it uses, an
  on-plot **Year** selector (year-sum bar/stacked/scatter plots only), and a
  **Remove** button.
- The chart itself (zoom/pan with the mouse; the mode bar at the top-right has
  download-as-PNG and other tools).

### Year selector

Bar, stacked-bar and scatter charts that use a water-year or calendar-year sum
show a **Year** dropdown populated with the years present in the data. *Latest
year* (bar/stacked) and *Default (first year)* (scatter) match the App's default
behavior. The choice is saved per plot.

### Plot settings (⚙ Plot settings)

Everything about a card can be adjusted; changes are saved per preset in your
browser and reverted by **Reset preset**.

| Field | Notes |
|---|---|
| Plot type | Line · Bar (one per trace) · Stacked bar · Scatter (X vs Y) · Box (per-period distribution) |
| Transform | Raw values · Annual values · Water-year sum (Oct–Sep) · Calendar-year sum |
| Percentile band | Shaded 10–90 (configurable) band around the ensemble on line plots |
| Title / Subtitle | Empty = automatic |
| X / Y axis title | Empty = automatic |
| Y-axis scaling | Auto, or fixed with Y min / Y max |
| X range | Full period · first 12/24/36 months · custom start–end |
| Unit factor / offset / display unit | Rescale or relabel values (e.g. factor 0.3048 for ft→m) |
| Show grid | Toggle chart gridlines |
| Reference lines | See below |
| Line width | Line thickness (line plots; overlay lines on box plots) |

Scatter plots add: X slot, Y slot, X/Y transforms, calendar-vs-water basis, and
a year filter. Stacked bars add: component slots, sort slot/order, legend
position. Bars add: sort order and the annual year.

### Reference lines

One per line in the textarea, pipe-separated:

```
value | label | color | dash | width | axis
```

- Only `value` is required; the rest default (red, dashed, 1.25).
- Default (**horizontal**): `value` is a Y value —
  `3510 | Protection Elevation | #c0392b | dash | 1.25`
- **Vertical** (`axis` = `x`): `value` is a position on the X axis —
  - a date on time axes: `2025-07-01 | Mid-2025 | #2c7fb8 | dot | 1.5 | x`
  - a bare year on water-year/calendar-year axes (auto-maps to `WY 2027` / `2027`):
    `2027 | Chosen year | #c0392b | dash | 1 | x`
  - a number on scatter/bar axes (scatter X value, trace number): `20 | Trace 20 | x`

Tip: monthly RiverWare data sits on **month-end** dates — use `2024-07-31` to
align a vertical line with the Jul-24 data column.

Leaving the label field empty draws the line with no text: `3510 |`

---

## Traces and highlighting

- Click a **trace in any chart**, or a **column header in the data table** —
  the same trace highlights in every chart (others dim), scatter data tables
  filter to that row, and the data table below switches to showing that
  trace's data for **every slot plotted on the page** (one table group per
  slot, slot name and unit in the heading). Click again to clear and restore
  the full table.
- Deterministic Max/Min/Most traces are excluded from condition checks and
  percentile bands, matching the App.

---

## Data table

Below the charts: period rows × trace columns for the selected slot
(change it with the **Slot** dropdown).

- **Only visible traces** (checked by default) hides Max/Min/Most and any
  traces you unchecked in the Traces menu.
- Click a column to highlight that trace everywhere.
- Values respect each slot's units and scale.

---

## Scatter data tables

Scatter cards have a **"Data used in this plot (N points)"** collapsible: one
row per trace with its X and Y values. Click a column header to sort, **Copy
for Excel** to place a TSV on your clipboard, or **Download CSV**. When a trace
is highlighted, the table filters to that trace's row.

---

## Custom table presets

Clicking a table preset replaces the charts with its table blocks (the data
table below the charts is a plot-page feature and is hidden here). The shipped
**Slot Analysis** preset starts with a monthly *Powell.Pool Elevation* table;
everything about each block can be changed live on the page.

### Filter & aggregate panel

Every table block has a **Filter & aggregate** panel:

- **Slot** — analyze any slot from the loaded RDF files.
- **Rows** — *Monthly values* (raw value per month), *Water-year aggregation*
  (Oct–Sep), *Calendar-year aggregation*, or *Annual values* (annual slots).
  When an aggregation is selected, each year shows **only the aggregated
  value** — no monthly rows, no total columns.
- **Statistic (per year)** — Sum, Average, Minimum, Maximum, or End of period
  (e.g. the September value of a water year). Slots where a sum is meaningless
  — *Pool Elevation, Storage, Surface Area, Power Plant Cap Fraction, Peak
  Flow* — offer no Sum option and default to **End of period**; flow and
  volume slots can be summed.
- **WY sum / CY sum columns** — optional total columns for monthly tables
  (hidden while aggregating; off by default).
- **Traces** — currently visible / ensemble only / all traces.
- **Year from / Year to** — limit rows to a period range.
- **Months** — pick a single month for monthly tables.
- **Value filter** — filters the **value shown** (the monthly value, or the
  per-year aggregated value). Operators include `<`, `≤`, `>`, `≥`, `=`, `≠`
  and **between** (a range — enter both values). Leave the value empty to
  turn the filter off.
- **Filter mode** — *Filter out non-matching* blanks the cells that do not
  meet the criteria, or *Highlight matching* keeps every value and marks the
  matching cells in amber.

Preset-level **value conditions** (set in the Preset Builder) stay active and
blank out trace/year combinations that do not match. Deterministic
Max/Min/Most traces are always excluded from condition checks.

### Adding more tables

The **+ Add slot table** control above the tables appends another table block
with the same options (slot picker, rows, statistic, filters, value filter).
Added tables are session-level — switching presets clears them.

Example: *keep traces whose Powell.Inflow water-year sum is below 9,500,000
acre-feet* — add a value condition in the Preset Builder with slot
`Powell.Inflow`, calculation `WY sum`, operator `<`, value `9500000`.

Every table has **Copy for Excel** and **Download CSV** buttons (the export
matches what the table shows, including filter blanking).

---

## Printing a report

**Build report** → the preview collects every chart as a high-resolution image,
your notes and assumptions (click to edit; drafts are remembered), and the
current data table. Choose **Include data table** to toggle it, then
**Print / Save as PDF**. The layout is sized for portrait A4; leave the print
scale at *Default*.

---

## Tips

- Blank cells in a condition-filtered table mean that trace/year combination
  did not satisfy the condition.
- Partial first years (a run starting mid-year) produce partial water-year
  sums — pair a year-range filter with conditions to exclude them.
- If charts look stale after a data update, hard-refresh with `Ctrl+F5`.
