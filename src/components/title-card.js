import {formatUpdatedTime, subscribeToForecastState} from "../state/forecast-store.js";
import {renderLocaleControls} from "./dashboard-info.js";
import {subscribeToLocale, t} from "../lib/i18n.js";

export function renderTitleCard() {
  const wrapper = document.createElement("section");
  wrapper.className = "title-card";

  const content = document.createElement("div");
  content.className = "title-card-content";

  const mainRow = document.createElement("div");
  mainRow.className = "title-card-main-row";

  const eyebrow = document.createElement("p");
  eyebrow.className = "title-eyebrow";

  const title = document.createElement("h1");
  title.className = "title-card-heading";

  mainRow.append(title, renderLocaleControls());
  content.append(eyebrow, mainRow);
  wrapper.append(content);

  const renderText = () => {
    title.textContent = t("title");
    eyebrow.textContent = `${t("coastLabel")} · ${formatUpdatedTime()}`;
  };

  subscribeToForecastState(renderText);
  subscribeToLocale(renderText);

  return wrapper;
}
