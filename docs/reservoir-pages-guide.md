# Reservoir Pages — Configuration Guide

This guide explains how to create, update, and delete the **reservoir card
pages** (Reservoir Data, Reservoir Charts, and any pages you add yourself)
by editing the `RESERVOIR_PAGES` configuration block in `index.html`.

No code changes are needed for any of this — pages are pure configuration.

---

## 1. Background: what a reservoir page is

A reservoir page is a self-contained view with two parts:

1. **Cards** — one compact card per reservoir, showing just the reservoir
   name and how many of the page's slots the loaded RDF files contain.
2. **Content** — clicking a card expands it (one at a time) to reveal
   checkboxes for its slots; every ticked slot renders below the cards:

   | `kind` | Button appears in | Ticked slot renders as |
   |---|---|---|
   | `"data"` | **Tables** bar | a full Slot Analysis table (Filter & aggregate panel, scaling, value filters, cell selection + stats) |
   | `"charts"` | **Plots** bar | an ordinary plot card (line chart of the raw ensemble, Plot settings panel, trace highlighting, Build report) |

Each page has **its own independent state**: checked slots, expanded card,
per-slot table settings, and per-slot chart settings. Nothing you do on one
page affects another.

Rules the engine applies automatically:

- A reservoir gets a card **only if** at least one of the page's slots
  exists in the loaded RDF files (e.g. Navajo has no `Energy` slot, so its
  card shows 5 slots on the default pages).
- Slot names are built as `<Reservoir>.<Suffix>` — the lookup also tries the
  name **without spaces**, so a card named `"Flaming Gorge"` finds
  `FlamingGorge.Pool Elevation`.
- Ticked slots render in the order the reservoirs and slots are listed in
  the config, not the order you ticked them.

---

## 2. Where the configuration lives

Open `index.html` and search for `RESERVOIR_PAGES`. It sits in the
**configuration block near the top of the file**, right after `DOCS_URL`:

```js
const RESERVOIR_PAGES = [
  {
    id: "reservoir-data",
    name: "Reservoir Data",
    kind: "data",
    reservoirs: [
      "Powell", "Mead", "Fontenelle", "Flaming Gorge", "BlueMesa",
      "MorrowPoint", "Crystal", "Navajo", "TaylorPark", "Vallecito",
      "Mohave", "Havasu",
    ],
    slots: ["Pool Elevation", "Inflow", "Outflow", "Energy", "Storage", "Spill"],
  },
  {
    id: "reservoir-charts",
    name: "Reservoir Charts",
    kind: "charts",
    reservoirs: [ /* same list */ ],
    slots: [ /* same list */ ],
  },
];
```

Each entry in the array = **one button + one page**. The default config
reproduces the two shipped pages; everything below explains how to edit it.

---

## 3. The page schema

| Field | Type | Required | What it does |
|---|---|---|---|
| `id` | string | yes | Unique key for the page. Stores the page's per-slot state (checked slots, chart settings), so it must never change once people have used the page, and must never collide with another entry. |
| `name` | string | yes | The button label in the bar and the tooltip text. |
| `kind` | `"data"` or `"charts"` | yes | `"data"` → ticked slots render as **tables**, button goes in the **Tables** bar. `"charts"` → ticked slots render as **line charts**, button goes in the **Plots** bar. |
| `reservoirs` | array of strings | yes | Reservoir names shown as cards, in display order. Must match the object prefix in the RDF (spaces are ignored — see §5). |
| `slots` | array of strings | yes | Slot suffixes offered on the cards, in display order. The full slot name is `<Reservoir>.<suffix>`. |

Both bars are rebuilt from this config on every data load:

- The **Tables** bar shows: saved table presets … then every `kind: "data"`
  page.
- The **Plots** bar shows: saved plot presets … then every `kind: "charts"`
  page.

If a page's reservoirs have none of its slots in the loaded data, its button
is hidden (a `"data"` page can also disappear from the Tables bar entirely
when no table presets exist and no data pages qualify).

---

## 4. Updating an existing page

### 4.1 Add or remove slots

Edit the page's `slots` array. Example — adding Evaporation and removing
Spill from Reservoir Data:

```js
slots: ["Pool Elevation", "Inflow", "Outflow", "Energy", "Storage", "Evaporation"],
```

- Use the **RiverWare slot suffix exactly as it appears after the dot** in
  the RDF, including capitalization (`"Bank Storage"`, not `"bank storage"`).
- Checkboxes appear for every listed slot that exists for that reservoir; a
  listed slot that no reservoir has simply never shows a checkbox.
- Removing a slot from the config hides its table/chart everywhere. Its
  per-slot settings stay in the config for the *other* pages that still
  list it.
- Re-order the array to change the checkbox and table order.

### 4.2 Add or remove reservoirs

Edit the page's `reservoirs` array:

```js
reservoirs: ["Powell", "Mead", " Glen Canyon ", "Navajo"],
```

- Names must match the **object prefix** in the RDF. `"Flaming Gorge"` works
  for `FlamingGorge.*` because spaces are stripped in the fallback lookup.
- A listed reservoir with **none** of the page's slots silently gets no
  card — the rest of the page is unaffected.

### 4.3 Rename a page

Change `name` freely — it only affects the button label and tooltips. Do
**not** change `id` as part of a rename (see §6).

---

## 5. Adding a new page (worked example)

Suppose you want an **"Evaporation Data"** page with monthly evaporation and
evaporated-volume tables for the big reservoirs. Add one entry to the array:

```js
const RESERVOIR_PAGES = [
  /* ...existing entries... */
  {
    id: "evaporation-data",
    name: "Evaporation Data",
    kind: "data",
    reservoirs: [
      "Powell", "Mead", "Flaming Gorge", "BlueMesa", "MorrowPoint",
      "Crystal", "Navajo",
    ],
    slots: ["Evaporation", "Evaporated Volume"],
  },
];
```

Result after saving and reloading:

- A **new "Evaporation Data" button appears at the end of the Tables bar**
  (because `kind` is `"data"`; use `"charts"` for a button at the end of the
  Plots bar).
- Clicking it shows cards only for reservoirs that actually have
  `X.Evaporation` or `X.Evaporated Volume` slots.
- Expanding a card and ticking a slot renders that slot's table below —
  with the same Filter & aggregate panel as Slot Analysis.
- The page's checkboxes, expanded card, and per-slot settings are tracked
  under its own `id` — completely independent of Reservoir Data.

For a charts page, the only difference is `kind: "charts"` and that ticked
slots render as chart cards instead of tables:

```js
{
  id: "evaporation-charts",
  name: "Evaporation Charts",
  kind: "charts",
  reservoirs: ["Powell", "Mead", "Flaming Gorge"],
  slots: ["Evaporation"],
}
```

### Multiple pages with the same slots

Entries are deliberately independent — e.g. you can keep the default
"Reservoir Data" (six general slots) and add a "Evaporation Data" page
focused on evaporation slots, each remembering its own ticked slots.

---

## 6. Deleting a page

Remove its entry from `RESERVOIR_PAGES` (or set `RESERVOIR_PAGES = []` to
hide the feature entirely). Notes:

- The button and page disappear; nothing else changes.
- Per-slot chart settings for a charts page are stored under its `id` —
  deleting the entry orphans them silently (harmless). If you later reuse
  the same `id`, those old settings come back.
- **Don't reuse an `id` for a different purpose.** Two entries with the same
  `id` would share one state store (and one preset store for `charts`
  pages), producing confusing behavior.

---

## 7. Behavior reference (what stores what)

| Thing | Where it lives | Survives page switch | Survives reload |
|---|---|---|---|
| Ticked slots on a **data** page | in-memory (session) | yes | no |
| Ticked slots on a **charts** page | persisted (localStorage, under the page's `id`) | yes | yes |
| Slot table settings (Filter & aggregate edits) | in-memory, keyed `reservoir:<slot>` | yes | no |
| Chart settings (Plot settings panel edits) | persisted, keyed `reservoir-charts:p<index>` for the shipped page (or `<page.id>:p<index>` for yours) | yes | yes |
| Expanded card | in-memory, per page | yes | no |

Consequences worth knowing:

- **Reload** a data page → all cards collapse and tables untick (the RDF
  data itself reloads automatically).
- **Remove** on a reservoir table unticks that slot on the card — the other
  tables on the page are unaffected.
- **Reset preset** on a charts page shows **every** slot of that page (and
  re-syncs the checkboxes). Reset has no effect on data pages (the toolbar's
  Reset applies to presets only).

---

## 8. Deploying your changes

1. Edit `index.html`, save.
2. Commit and push:

   ```
   git add index.html
   git commit -m "Add <page name> reservoir page"
   git push
   ```

3. GitHub Pages redeploys automatically; open the site and **hard-refresh
   (`Ctrl+F5`)** to pick up the new build.
4. Local testing first: serve the repo folder
   (`python -m http.server 8124 --bind 127.0.0.1`) and open
   `http://127.0.0.1:8124/index.html`.

---

## 9. Troubleshooting

| Symptom | Likely cause / fix |
|---|---|
| Page button doesn't appear in the bar | No reservoir on the page has any of the listed slots in the loaded RDF. Check the exact suffix spelling/capitalization against the data, or the bar is hidden because it has nothing else to show. |
| A reservoir card is missing | That reservoir has none of the page's slots (or its name doesn't match the RDF object prefix after space-stripping). |
| Checkbox ticked but no table/chart | The slot exists (checkbox shows) but check the slot has data for the loaded traces; also confirm you're on the page you think — each page's ticks are independent. |
| Chart settings "moved" to another slot on a charts page | The page's `plots` array is ordered by `reservoirs` × `slots`; inserting a new reservoir or slot shifts indices for entries after it. Settings are keyed `<page.id>:p<index>` — after reordering, re-apply the moved slots' settings once. |
| Two pages behave weirdly together | Two entries share an `id`. Give each entry a unique `id`. |
| Syntax error / page won't load after editing | A missing comma or bracket in `RESERVOIR_PAGES`. Check the browser console (F12) — the error names the line. |

---

## 10. Quick reference

```js
// Minimal new page
{
  id: "my-new-page",           // unique, stable — don't change later
  name: "My New Page",         // button label
  kind: "data",                // "data" (tables) or "charts" (charts)
  reservoirs: ["Powell", "Mead"],
  slots: ["Pool Elevation", "Inflow"],
}
```

- Slot lookup: `<Reservoir>.<suffix>` and `<ReservoirNoSpaces>.<suffix>`.
- Reservoirs without any of the slots: no card.
- Order of cards: the `reservoirs` array. Order of checkboxes and rendered
  content: the `slots` array.
