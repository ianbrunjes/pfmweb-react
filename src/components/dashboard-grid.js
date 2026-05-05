export function renderDashboardGrid({
  bannerElement,
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
  mapSlot.append(bannerElement, mapElement);

  const sideSlot = document.createElement("div");
  sideSlot.className = "dashboard-side-slot";
  sideSlot.append(timeSlider, cardsElement, chartElement);

  topRow.append(mapSlot, sideSlot);
  wrapper.append(topRow, infoElement);
  return wrapper;
}
