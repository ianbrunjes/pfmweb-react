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

  topRow.append(mapSlot, sliderSlot, siteSlot, chartSlot);
  wrapper.append(topRow, infoElement);
  return wrapper;
}
