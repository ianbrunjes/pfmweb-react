```js
import {renderDashboardGrid} from "./components/dashboard-grid.js";
import {renderForecastChart} from "./components/forecast-chart.js";
import {initializeForecastState} from "./components/pfm-state.js";
import {renderSanDiegoMap} from "./components/leaflet-map.js";
import {renderSiteCards} from "./components/site-cards.js";
import {renderTimeSlider} from "./components/time-slider.js";
import {renderTitleCard} from "./components/title-card.js";

await initializeForecastState();

const titleCard = renderTitleCard();
const timeSlider = renderTimeSlider();
const mapElement = await renderSanDiegoMap();
const cardsElement = renderSiteCards();
const chartElement = renderForecastChart();
const dashboardGrid = renderDashboardGrid({
  mapElement,
  cardsElement,
  timeSlider,
  chartElement
});

const page = document.createElement("div");
page.className = "dashboard-page";
page.append(titleCard, dashboardGrid);
display(page);
```
