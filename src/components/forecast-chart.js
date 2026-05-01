import Chart from "chart.js/auto";
import {getForecastState, setCurrentSite, subscribeToForecastState} from "./pfm-state.js";

const CHART_LINE_COLOR = "#2563eb";

function formatShortLabel(isoString) {
  const normalized = isoString.endsWith("Z") ? isoString : `${isoString}Z`;
  return new Date(normalized).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    hour12: true,
    timeZone: "America/Los_Angeles"
  });
}

export function renderForecastChart() {
  const wrapper = document.createElement("section");
  wrapper.className = "chart-card";

  const eyebrow = document.createElement("p");
  eyebrow.className = "chart-eyebrow";
  eyebrow.textContent = "Detailed Forecast";

  const title = document.createElement("h2");
  title.className = "chart-title";
  title.textContent = "Sewage concentration";

  const canvas = document.createElement("canvas");
  canvas.className = "chart-canvas";

  const empty = document.createElement("div");
  empty.className = "chart-empty";
  empty.textContent = "Forecast chart will appear once site assets are available.";

  wrapper.append(eyebrow, title, canvas, empty);

  let chart = null;

  const destroyChart = () => {
    if (chart) {
      chart.destroy();
      chart = null;
    }
  };

  subscribeToForecastState((state) => {
    title.textContent = state.sites.names.length
      ? `Sewage concentration — ${state.sites.names[state.currentSite]}`
      : "Sewage concentration";

    if (!state.sites.names.length || !state.sites.l10.length) {
      canvas.style.display = "none";
      empty.style.display = "block";
      destroyChart();
      return;
    }

    empty.style.display = "none";
    canvas.style.display = "block";

    if (!chart) {
      chart = new Chart(canvas, {
        type: "line",
        data: {
          labels: state.times.map(formatShortLabel),
          datasets: state.sites.names.map((name, index) => ({
            label: name,
            data: state.sites.l10.map((row) => row[index]),
            borderColor: CHART_LINE_COLOR,
            backgroundColor: "transparent",
            borderWidth: 2.5,
            pointRadius: 0,
            tension: 0.3,
            fill: false
          }))
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: {mode: "index", intersect: false},
          plugins: {
            legend: {display: false},
            tooltip: {enabled: false}
          },
          onClick: (_event, elements) => {
            if (elements.length) {
              setCurrentSite(elements[0].datasetIndex);
            }
          },
          scales: {
            x: {
              ticks: {maxTicksLimit: 6, font: {size: 10}, color: "#6b7280"},
              grid: {color: "#f0f0f0"}
            },
            y: {
              min: -7,
              max: -1,
              ticks: {
                font: {size: 10},
                color: "#6b7280",
                stepSize: 1,
                callback: (value) => {
                  const pct = Math.pow(10, value + 2);
                  if (pct >= 1) return `${pct.toFixed(0)}%`;
                  const decimals = Math.max(0, -Math.floor(Math.log10(pct)));
                  return `${pct.toFixed(decimals)}%`;
                }
              },
              grid: {color: "#f0f0f0"}
            }
          }
        },
        plugins: [{
          id: "riskBands",
          beforeDatasetsDraw(instance) {
            const thresholds = getForecastState().thresholds;
            if (!thresholds || thresholds.length < 2) return;
            const {ctx, chartArea, scales: {y}} = instance;
            const [tLow, tHigh] = thresholds;
            const clamp = (value) => Math.max(chartArea.top, Math.min(chartArea.bottom, value));
            const yLow = clamp(y.getPixelForValue(tLow));
            const yHigh = clamp(y.getPixelForValue(tHigh));
            const x = chartArea.left;
            const width = chartArea.right - chartArea.left;

            ctx.save();
            ctx.fillStyle = "rgba(211,47,47,0.14)";
            ctx.fillRect(x, chartArea.top, width, yHigh - chartArea.top);
            ctx.fillStyle = "rgba(230,168,23,0.18)";
            ctx.fillRect(x, yHigh, width, yLow - yHigh);
            ctx.fillStyle = "rgba(26,158,63,0.14)";
            ctx.fillRect(x, yLow, width, chartArea.bottom - yLow);
            ctx.restore();
          }
        }, {
          id: "timeBar",
          afterDraw(instance) {
            const snapshot = getForecastState();
            const meta = instance.getDatasetMeta(snapshot.currentSite);
            if (!meta?.data?.[snapshot.currentFrame]) return;
            const xPx = meta.data[snapshot.currentFrame].x;
            const {ctx, scales: {y}} = instance;
            ctx.save();
            ctx.strokeStyle = "rgba(13,33,55,0.6)";
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(xPx, y.top);
            ctx.lineTo(xPx, y.bottom);
            ctx.stroke();
            ctx.restore();
          }
        }]
      });
    }

    chart.data.labels = state.times.map(formatShortLabel);
    chart.data.datasets.forEach((dataset, index) => {
      dataset.data = state.sites.l10.map((row) => row[index]);
      chart.setDatasetVisibility(index, index === state.currentSite);
    });
    chart.update("none");
  });

  return wrapper;
}
