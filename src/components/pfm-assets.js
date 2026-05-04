import {FileAttachment} from "observablehq:stdlib";

const forecastZipFile = FileAttachment("../data/pfm_his_daily.zip");

function frameNames(zip) {
  return zip.filenames
    .filter((name) => /^map\/frame_\d{3}\.png$/.test(name))
    .sort();
}

export async function loadForecastAssets() {
  const zip = await forecastZipFile.zip();

  const [times, sites, shoreline] = await Promise.all([
    zip.file("times.json").json(),
    zip.file("sites.json").json(),
    zip.file("shoreline.json").json(),
  ]);

  const frameUrls = await Promise.all(
    frameNames(zip).map((name) => zip.file(name).url())
  );

  return {times, sites, shoreline, frameUrls};
}
