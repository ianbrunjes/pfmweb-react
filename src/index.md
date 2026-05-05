```js
import {renderDashboardGrid} from "./components/dashboard-grid.js";
import {renderDashboardInfo, renderExperimentalBanner} from "./components/dashboard-info.js";
import {renderForecastChart} from "./components/forecast-chart.js";
import {initializeForecastState} from "./state/forecast-store.js";
import {renderSanDiegoMap} from "./components/leaflet-map.js";
import {renderSiteCards} from "./components/site-cards.js";
import {renderTimeSlider} from "./components/time-slider.js";
import {renderTitleCard} from "./components/title-card.js";

await initializeForecastState();

const titleCard = renderTitleCard();
const timeSlider = renderTimeSlider();
const bannerElement = renderExperimentalBanner();
const mapElement = await renderSanDiegoMap();
const cardsElement = renderSiteCards();
const chartElement = renderForecastChart();
const infoElement = renderDashboardInfo();
const dashboardGrid = renderDashboardGrid({
  bannerElement,
  mapElement,
  cardsElement,
  timeSlider,
  chartElement,
  infoElement
});

const page = document.createElement("div");
page.className = "dashboard-page";
page.append(titleCard, dashboardGrid);
display(page);
```
