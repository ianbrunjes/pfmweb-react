import argparse
from concurrent.futures import ThreadPoolExecutor
import io
import json
import os
import re
import sys
import urllib.request
import zipfile
from datetime import datetime, timedelta

import matplotlib.colors as mcolors
import matplotlib.pyplot as plt
import numpy as np
import xarray as xr
from PIL import Image
from scipy.spatial import KDTree

import SOURCE_FILE_CONFIG as config

LOCAL_FILE = getattr(config, "LOCAL_FILE", "")
REMOTE_URL = getattr(config, "REMOTE_URL", "")
TEMP_FILE = getattr(config, "TEMP_FILE", "./web_data_latest.nc")
ARCHIVE_DIR = getattr(
    config,
    "ARCHIVE_DIR",
    os.path.dirname(LOCAL_FILE) or "/dataSIO/PFM_Simulations/Archive/web",
)
FILE_ID_PATTERN = re.compile(r"^(?:web_data_)?(\d{10})(?:\.nc)?$")

BASE_DATETIME = datetime(1999, 1, 1)
TIME_FORMAT = "%Y-%m-%dT%H:%M:%S"

CONTOUR_MIN = -5.5
CONTOUR_MAX = -0.75
CONTOUR_INTERVAL = 0.25
CONTOUR_CMAP = plt.get_cmap("magma").reversed()

FRAME_WIDTH = 300
FRAME_SUPERSAMPLE = 3
LAND_MASK_DISTANCE = 0.001


def parse_site_names(site_info):
    site_info = site_info.strip()
    if ":" in site_info:
        site_info = site_info.split(":", 1)[1].strip()

    prefix = "the site locations are"
    if site_info.lower().startswith(prefix):
        site_info = site_info[len(prefix):].strip()

    return [name.strip() for name in site_info.split(",") if name.strip()]


def resolve_requested_file(file_arg):
    if not file_arg:
        return LOCAL_FILE

    base = os.path.basename(file_arg.strip())
    match = FILE_ID_PATTERN.match(base)
    filename = f"web_data_{match.group(1)}.nc" if match else (
        base if base.endswith(".nc") else f"{base}.nc"
    )

    candidate = os.path.join(ARCHIVE_DIR, filename)
    if os.path.isfile(candidate):
        return candidate

    local_dir = os.path.dirname(LOCAL_FILE)
    if local_dir:
        fallback = os.path.join(local_dir, filename)
        if os.path.isfile(fallback):
            return fallback

    return candidate


def load_dataset(file_arg=None):
    target_file = resolve_requested_file(file_arg)
    if target_file and os.path.isfile(target_file):
        return xr.open_dataset(target_file, decode_timedelta=False)

    if file_arg:
        raise FileNotFoundError(f"NetCDF file not found: {target_file}")

    urllib.request.urlretrieve(REMOTE_URL, TEMP_FILE)
    return xr.open_dataset(TEMP_FILE, decode_timedelta=False)


def build_timestamps(raw_times):
    return [
        (BASE_DATETIME + timedelta(days=float(value))).strftime(TIME_FORMAT)
        for value in raw_times
    ]


def build_sites(ds, site_names):
    return {
        "names": site_names,
        "lats": ds["sites_lat"].values.tolist(),
        "lons": ds["sites_lon"].values.tolist(),
        "risk": [[int(value) for value in row] for row in ds["sites_risk"].values],
        "dye": [[float(f"{value:.6e}") for value in row] for row in ds["sites_dye_tot"].values],
        "l10": [[round(float(value), 3) for value in row] for row in ds["sites_l10_dye_tot"].values],
    }


def build_shoreline(ds):
    return {
        "lats": [round(float(value), 5) for value in ds["shoreline_lat"].values],
        "lons": [round(float(value), 5) for value in ds["shoreline_lon"].values],
        "risk": [[int(value) for value in row] for row in ds["shoreline_risk"].values],
    }


def build_bounds(map_lat, map_lon):
    return {
        "south": float(map_lat.min()),
        "north": float(map_lat.max()),
        "west": float(map_lon.min()),
        "east": float(map_lon.max()),
    }


def build_domain(map_lat, map_lon):
    return [
        [float(map_lat[0, 0]), float(map_lon[0, 0])],
        [float(map_lat[0, -1]), float(map_lon[0, -1])],
        [float(map_lat[-1, -1]), float(map_lon[-1, -1])],
        [float(map_lat[-1, 0]), float(map_lon[-1, 0])],
    ]


def prepare_frame_grid(map_lat, map_lon, bounds):
    dy = bounds["north"] - bounds["south"]
    dx = bounds["east"] - bounds["west"]
    output_width = FRAME_WIDTH
    output_height = round(output_width * dy / dx)
    render_width = output_width * FRAME_SUPERSAMPLE
    render_height = output_height * FRAME_SUPERSAMPLE

    tree = KDTree(np.column_stack([map_lat.ravel(), map_lon.ravel()]))
    lat_reg = np.linspace(bounds["north"], bounds["south"], render_height)
    lon_reg = np.linspace(bounds["west"], bounds["east"], render_width)
    lon_out, lat_out = np.meshgrid(lon_reg, lat_reg)
    query_points = np.column_stack([lat_out.ravel(), lon_out.ravel()])

    dist, src_idx = tree.query(query_points, k=1, workers=-1)
    return {
        "output_size": (output_width, output_height),
        "render_size": (render_width, render_height),
        "src_idx": src_idx.reshape(render_height, render_width),
        "land_mask": dist.reshape(render_height, render_width) > LAND_MASK_DISTANCE,
    }


def render_map_frame(l10_frame, frame_grid, contour_levels, contour_norm):
    render_width, render_height = frame_grid["render_size"]
    output_size = frame_grid["output_size"]

    out_data = l10_frame.ravel()[frame_grid["src_idx"]]
    out_data[frame_grid["land_mask"]] = np.nan

    valid = ~np.isnan(out_data) & (out_data >= contour_levels[0])
    rgba = np.zeros((render_height, render_width, 4), dtype=np.uint8)
    rgba[valid] = CONTOUR_CMAP(contour_norm(out_data[valid]), bytes=True)
    rgba[valid, 3] = 255

    frame_buffer = io.BytesIO()
    Image.fromarray(rgba, "RGBA").resize(
        output_size,
        resample=Image.Resampling.LANCZOS,
    ).save(
        frame_buffer,
        format="PNG",
        optimize=True,
        compress_level=6,
    )
    return frame_buffer.getvalue()


def write_json(zip_file, path, data):
    zip_file.writestr(
        path,
        json.dumps(data),
        compress_type=zipfile.ZIP_DEFLATED,
    )


def write_forecast_zip(ds):
    timestamps = build_timestamps(ds["time"].values)
    site_names = parse_site_names(ds.attrs["site info"])
    sites = build_sites(ds, site_names)
    shoreline = build_shoreline(ds)

    map_lat = ds["map_lat"].values
    map_lon = ds["map_lon"].values
    bounds = build_bounds(map_lat, map_lon)
    frame_grid = prepare_frame_grid(map_lat, map_lon, bounds)
    contour_levels = np.arange(CONTOUR_MIN, CONTOUR_MAX, CONTOUR_INTERVAL)
    contour_norm = mcolors.BoundaryNorm(contour_levels, CONTOUR_CMAP.N, extend="max")

    map_l10_dye_tot = ds["map_l10_dye_tot"].values
    with ThreadPoolExecutor() as executor:
        frames = list(
            executor.map(
                lambda idx: render_map_frame(
                    map_l10_dye_tot[idx],
                    frame_grid,
                    contour_levels,
                    contour_norm,
                ),
                range(len(timestamps)),
            )
        )

    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, "w") as zip_file:
        for index, frame in enumerate(frames):
            zip_file.writestr(
                f"map/frame_{index:03d}.png",
                frame,
                compress_type=zipfile.ZIP_DEFLATED,
            )

        write_json(zip_file, "shoreline.json", shoreline)
        write_json(zip_file, "sites.json", sites)
        write_json(zip_file, "times.json", {
            "times": timestamps,
            "bounds": bounds,
            "domain": build_domain(map_lat, map_lon),
            "thresholds": ds["thresh_holds"][:].values.tolist(),
        })

    sys.stdout.buffer.write(zip_buffer.getvalue())


def parse_args(argv=None):
    parser = argparse.ArgumentParser(add_help=False)
    parser.add_argument("--file", default=None)
    args, _ = parser.parse_known_args(argv)
    return args


if __name__ == "__main__":
    args = parse_args()
    write_forecast_zip(load_dataset(args.file))
