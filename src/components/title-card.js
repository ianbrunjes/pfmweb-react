import {formatUpdatedTime, subscribeToForecastState} from "./pfm-state.js";
import {renderInfoModal} from "./info-modal.js";
import {subscribeToLocale, t} from "./i18n.js";

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

  copy.append(eyebrow, title);
  content.append(copy, renderInfoModal());
  wrapper.append(content);

  const renderText = () => {
    title.textContent = t("title");
    eyebrow.textContent = `${t("coastLabel")} · ${formatUpdatedTime()}`;
  };

  subscribeToForecastState(renderText);
  subscribeToLocale(renderText);

  return wrapper;
}
