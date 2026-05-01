export function renderDashboardGrid({
  mapElement,
  cardsElement,
  timeSlider,
  chartElement
}) {
  const wrapper = document.createElement("section");
  wrapper.className = "dashboard-grid";

  const mapSlot = document.createElement("div");
  mapSlot.className = "dashboard-map-slot";
  mapSlot.append(mapElement);

  const sideSlot = document.createElement("div");
  sideSlot.className = "dashboard-side-slot";
  sideSlot.append(timeSlider,cardsElement, chartElement);

  wrapper.append(mapSlot, sideSlot);
  return wrapper;
}
