#!/usr/bin/env python3
"""Preprocess web_data_latest.nc into Observable-ready assets."""

import json
import os
from datetime import datetime, timedelta

import h5py
import numpy as np
from PIL import Image
from scipy.spatial import KDTree

NC_CANDIDATES = [
    "web_data_latest.nc",
    os.path.join("src", "data", "web_data_latest.nc"),
]
OUT_DIR = os.path.join("src", "pfm-data")
MAP_DIR = os.path.join(OUT_DIR, "map")
ASSET_MODULE = os.path.join("src", "components", "pfm-assets.js")

os.makedirs(MAP_DIR, exist_ok=True)

SITE_NAMES = [
    "Playas de Tijuana",
    "Imperial Beach Pier",
    "Silver Strand",
    "Coronado Avenida Lunar",
]

COLOR_RAMP = np.array([
    [-8.0, 255, 220, 0, 0],
    [-6.0, 255, 220, 0, 20],
    [-5.0, 255, 210, 0, 110],
    [-4.0, 255, 160, 0, 185],
    [-3.0, 255, 80, 0, 225],
    [-1.3, 70, 0, 110, 240],
    [0.0, 40, 0, 70, 255],
], dtype=float)


def l10_to_rgba(l10_frame: np.ndarray) -> np.ndarray:
    h, w = l10_frame.shape
    rgba = np.zeros((h, w, 4), dtype=np.uint8)
    valid = ~np.isnan(l10_frame)
    values = np.clip(l10_frame[valid], COLOR_RAMP[0, 0], COLOR_RAMP[-1, 0])
    for channel in range(4):
        rgba[valid, channel] = np.interp(
            values,
            COLOR_RAMP[:, 0],
            COLOR_RAMP[:, channel + 1],
        ).astype(np.uint8)
    return rgba


def write_asset_module(frame_count: int) -> None:
    frame_entries = ",\n".join(
        f'  FileAttachment("../pfm-data/map/frame_{index:03d}.png")'
        for index in range(frame_count)
    )

    module_source = f"""import {{FileAttachment}} from "observablehq:stdlib";

const timesFile = FileAttachment("../pfm-data/times.json");
const sitesFile = FileAttachment("../pfm-data/sites.json");
const shorelineFile = FileAttachment("../pfm-data/shoreline.json");
const frameFiles = [
{frame_entries}
];

export async function loadForecastAssets() {{
  const [times, sites, shoreline, frameUrls] = await Promise.all([
    timesFile.json(),
    sitesFile.json(),
    shorelineFile.json(),
    Promise.all(frameFiles.map((file) => file.url())),
  ]);

  return {{times, sites, shoreline, frameUrls}};
}}
"""

    with open(ASSET_MODULE, "w", encoding="utf-8") as handle:
        handle.write(module_source)


print("Loading NetCDF…")
nc_file = next((path for path in NC_CANDIDATES if os.path.exists(path)), None)
if nc_file is None:
    raise FileNotFoundError(
        "Could not find web_data_latest.nc in the repo root or src/data/."
    )

with h5py.File(nc_file, "r") as forecast_file:
    raw_time = forecast_file["time"][:]
    map_lat = forecast_file["map_lat"][:]
    map_lon = forecast_file["map_lon"][:]
    map_l10 = forecast_file["map_l10_dye_tot"][:]
    shore_lat = forecast_file["shoreline_lat"][:]
    shore_lon = forecast_file["shoreline_lon"][:]
    shore_risk = forecast_file["shoreline_risk"][:]
    sites_lat = forecast_file["sites_lat"][:]
    sites_lon = forecast_file["sites_lon"][:]
    sites_risk = forecast_file["sites_risk"][:]
    sites_dye = forecast_file["sites_dye_tot"][:]
    sites_l10 = forecast_file["sites_l10_dye_tot"][:]
    thresholds = forecast_file["thresh_holds"][:]

base = datetime(1999, 1, 1)
timestamps = [
    (base + timedelta(days=float(value))).strftime("%Y-%m-%dT%H:%M:%S")
    for value in raw_time
]

print(f"Generating {len(raw_time)} map frames…")
bounds = {
    "south": float(map_lat.min()),
    "north": float(map_lat.max()),
    "west": float(map_lon.min()),
    "east": float(map_lon.max()),
}

out_width = 300
dy = bounds["north"] - bounds["south"]
dx = bounds["east"] - bounds["west"]
out_height = round(out_width * dy / dx)

flat_lat = map_lat.ravel()
flat_lon = map_lon.ravel()
tree = KDTree(np.column_stack([flat_lat, flat_lon]))

lat_reg = np.linspace(bounds["north"], bounds["south"], out_height)
lon_reg = np.linspace(bounds["west"], bounds["east"], out_width)
lon_out, lat_out = np.meshgrid(lon_reg, lat_reg)
query_pts = np.column_stack([lat_out.ravel(), lon_out.ravel()])

dist, src_idx = tree.query(query_pts, k=1, workers=-1)
dist = dist.reshape(out_height, out_width)
src_idx = src_idx.reshape(out_height, out_width)

land_mask = dist > 0.001

for index in range(len(raw_time)):
    flat_data = map_l10[index].ravel()
    out_data = flat_data[src_idx]
    out_data[land_mask] = np.nan
    rgba = l10_to_rgba(out_data)
    Image.fromarray(rgba, "RGBA").save(
        os.path.join(MAP_DIR, f"frame_{index:03d}.png"),
        optimize=True,
        compress_level=6,
    )
    if (index + 1) % 20 == 0:
        print(f"  {index + 1}/{len(raw_time)}")

domain_corners = [
    [float(map_lat[0, 0]), float(map_lon[0, 0])],
    [float(map_lat[0, -1]), float(map_lon[0, -1])],
    [float(map_lat[-1, -1]), float(map_lon[-1, -1])],
    [float(map_lat[-1, 0]), float(map_lon[-1, 0])],
]

with open(os.path.join(OUT_DIR, "times.json"), "w", encoding="utf-8") as handle:
    json.dump(
        {
            "times": timestamps,
            "bounds": bounds,
            "domain": domain_corners,
            "thresholds": thresholds.tolist(),
        },
        handle,
    )

with open(os.path.join(OUT_DIR, "sites.json"), "w", encoding="utf-8") as handle:
    json.dump(
        {
            "names": SITE_NAMES,
            "lats": sites_lat.tolist(),
            "lons": sites_lon.tolist(),
            "risk": [[int(value) for value in row] for row in sites_risk],
            "dye": [[float(f"{value:.6e}") for value in row] for row in sites_dye],
            "l10": [[round(float(value), 3) for value in row] for row in sites_l10],
        },
        handle,
    )

with open(os.path.join(OUT_DIR, "shoreline.json"), "w", encoding="utf-8") as handle:
    json.dump(
        {
            "lats": [round(float(value), 5) for value in shore_lat],
            "lons": [round(float(value), 5) for value in shore_lon],
            "risk": [[int(value) for value in row] for row in shore_risk],
        },
        handle,
    )

write_asset_module(len(raw_time))

print(f"Done. Output written to {OUT_DIR}/")
