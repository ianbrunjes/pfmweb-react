# PFM Web Dashboard

Observable Framework dashboard for the Pathogen Forecast Model San Diego / Tijuana coast view.

## Project Layout

`src/components/`
UI renderers for the page, cards, chart, slider, map, and modal.

`src/data/`
Forecast asset loading and generated-source helpers.

`src/state/`
Shared dashboard state and small state utilities.

`src/lib/`
Cross-cutting utilities such as localization and risk metadata.

`dockerfiles/`
Operational scaffolding for deployment and publishing built assets. This directory supports deployment, but it is not part of the app runtime architecture.

## Data Flow

The dashboard reads forecast assets from `src/data/pfm_his_daily.zip`.

That file is generated through Observable's file-attachment script convention via [src/data/pfm_his_daily.zip.py](/Users/ianbrunjes/Codex/pfmweb-dashboard/src/data/pfm_his_daily.zip.py:1). The script can read a mounted `/project/web_data_latest.nc` file or download `web_data_latest.nc` when needed.

At runtime:

1. [src/index.md](/Users/ianbrunjes/Codex/pfmweb-dashboard/src/index.md:1) initializes the forecast store.
2. [src/state/forecast-store.js](/Users/ianbrunjes/Codex/pfmweb-dashboard/src/state/forecast-store.js:1) loads assets and exposes subscribe/update helpers.
3. UI components subscribe to the store and re-render on frame, site, or locale changes.

## Commands

`npm run dev`
Start the Observable preview server.

`npm run build`
Create the static site output in `dist/`.

`npm test`
Run the lightweight Node test suite for pure helpers.

`pip3 install -r requirements.txt`
Install the Python dependencies used by the forecast asset generator.

## Generated And Large Files

`dist/`, `.observablehq/`, and local NetCDF artifacts such as `web_data_latest.nc` are generated and should not be committed.

If you are working on deployment, keep `dockerfiles/` changes separate from app-structure refactors when possible so runtime and operational concerns stay easier to review.
