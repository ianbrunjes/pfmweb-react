export function renderDashboardGrid({
  mapElement,
  cardsElement,
  timeSlider,
  chartElement,
  infoElement
}) {
  const wrapper = document.createElement("section");
  wrapper.className = "dashboard-grid";

  const topRow = document.createElement("div");
  topRow.className = "dashboard-top-row";

  const mapSlot = document.createElement("div");
  mapSlot.className = "dashboard-map-slot";
  mapSlot.append(mapElement);

  const sliderSlot = document.createElement("div");
  sliderSlot.className = "dashboard-slider-slot";
  sliderSlot.append(timeSlider);

  const siteSlot = document.createElement("div");
  siteSlot.className = "dashboard-site-slot";
  siteSlot.append(cardsElement);

  const chartSlot = document.createElement("div");
  chartSlot.className = "dashboard-chart-slot";
  chartSlot.append(chartElement);

  const controlsPlotSlot = document.createElement("div");
  controlsPlotSlot.className = "dashboard-controls-plot-slot";
  controlsPlotSlot.append(sliderSlot, siteSlot, chartSlot);

  topRow.append(mapSlot, controlsPlotSlot);
  wrapper.append(topRow, infoElement);
  return wrapper;
}
