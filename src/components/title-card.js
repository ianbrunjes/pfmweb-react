import {formatUpdatedTime, subscribeToForecastState} from "./pfm-state.js";
import {renderInfoModal} from "./info-modal.js";

export function renderTitleCard() {
  const wrapper = document.createElement("section");
  wrapper.className = "title-card";

  const content = document.createElement("div");
  content.className = "title-card-content";

  const copy = document.createElement("div");
  copy.className = "title-copy";

  const eyebrow = document.createElement("p");
  eyebrow.className = "title-eyebrow";

  const title = document.createElement("h1");
  title.className = "title-card-heading";
  title.textContent = "Pathogen Forecast Model Phase 1";

  copy.append(eyebrow, title);
  content.append(copy, renderInfoModal());
  wrapper.append(content);

  subscribeToForecastState(() => {
    eyebrow.textContent = `San Diego / Tijuana Coast · ${formatUpdatedTime()}`;
  });

  return wrapper;
}
