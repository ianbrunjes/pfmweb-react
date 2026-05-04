import io
import json
import os
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


TEMP_FILE = "./web_data_latest.nc"
LOCAL_FILE = "/project/web_data_latest.nc"
REMOTE_URL = "https://falk.ucsd.edu/PFM_Forecast/LV4_His/web_data_latest.nc"

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


def load_dataset():
    if os.path.isfile(LOCAL_FILE):
        return xr.open_dataset(LOCAL_FILE, decode_timedelta=False)

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

    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, "w") as zip_file:
        for index in range(len(timestamps)):
            frame = render_map_frame(
                ds["map_l10_dye_tot"][index, :, :].values,
                frame_grid,
                contour_levels,
                contour_norm,
            )
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


write_forecast_zip(load_dataset())
