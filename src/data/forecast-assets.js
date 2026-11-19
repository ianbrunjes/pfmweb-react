import {FileAttachment, registerFile} from "observablehq:stdlib";
import {getForecastFileId} from "../state/forecast-state-utils.js";

const forecastFilesAttachment = FileAttachment("./forecast_files.json");
const defaultForecastZipFile = FileAttachment("./pfm_his_daily.zip");
const assetCache = new Map();

export {getForecastFileId};

function getFrameNames(zip) {
  return zip.filenames
    .filter((name) => /^map\/frame_\d{3}\.png$/.test(name))
    .sort();
}

export async function loadForecastFileList() {
  try {
    const data = await forecastFilesAttachment.json();
    const files = Array.isArray(data?.files) ? data.files : [];
    const defaultFile = data?.defaultFile || files[0] || "";
    return {defaultFile, files};
  } catch {
    return {defaultFile: "", files: []};
  }
}

function getZipAttachment(fileName, defaultFile = "") {
  const fileId = getForecastFileId(fileName);
  if (!fileId || (defaultFile && fileName === defaultFile)) {
    return defaultForecastZipFile;
  }
  return registerFile(`./pfm_his_daily_${fileId}.zip`, {
    path: `/_file/data/pfm_his_daily_${fileId}.zip`,
    mimeType: "application/zip"
  });
}

export async function loadForecastAssets(fileName = "", defaultFile = "") {
  const cacheKey = fileName || defaultFile || "__default__";
  if (assetCache.has(cacheKey)) {
    return assetCache.get(cacheKey);
  }

  const zipAttachment = getZipAttachment(fileName, defaultFile);
  const zip = await zipAttachment.zip();

  const [times, sites, shoreline] = await Promise.all([
    zip.file("times.json").json(),
    zip.file("sites.json").json(),
    zip.file("shoreline.json").json()
  ]);

  const frameUrls = await Promise.all(
    getFrameNames(zip).map((name) => zip.file(name).url())
  );

  const assets = {times, sites, shoreline, frameUrls};
  assetCache.set(cacheKey, assets);
  return assets;
}
