import {formatUpdatedTime, subscribeToForecastState} from "./pfm-state.js";

export function renderTitleCard() {
  const wrapper = document.createElement("section");
  wrapper.className = "title-card";

  const copy = document.createElement("div");
  copy.className = "title-copy";

  const eyebrow = document.createElement("p");
  eyebrow.className = "title-eyebrow";
  eyebrow.textContent = "San Diego / Tijuana Coast";

  const title = document.createElement("h1");
  title.className = "title-card-heading";
  title.textContent = "Pathogen Forecast Model Phase 1";

  const update = document.createElement("p");
  update.className = "title-update";

  const instructions = document.createElement("p");
  instructions.className = "title-instructions";
  instructions.textContent = 'Click "Play" to animate the forecast, move the slider to scrub through time, and select a shoreline site to view the detailed forecast at right.';

  copy.append(eyebrow, title, update, instructions);
  wrapper.append(copy);

  subscribeToForecastState(() => {
    update.textContent = `${formatUpdatedTime()} · Forecast is experimental and may contain errors.`;
  });

  return wrapper;
}
