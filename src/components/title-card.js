import {
  formatUpdatedTime,
  setSelectedFile,
  subscribeToForecastState
} from "../state/forecast-store.js";
import {renderLocaleControls} from "./dashboard-info.js";
import {subscribeToLocale, t} from "../lib/i18n.js";

function renderFileSelector() {
  const container = document.createElement("div");
  container.className = "forecast-file-control";

  const label = document.createElement("label");
  label.className = "forecast-file-label";
  label.htmlFor = "forecast-file-select";

  const selectRow = document.createElement("div");
  selectRow.className = "forecast-file-select-row";

  const select = document.createElement("select");
  select.id = "forecast-file-select";
  select.className = "forecast-file-select";

  const status = document.createElement("span");
  status.className = "forecast-file-status";
  status.setAttribute("aria-live", "polite");
  status.hidden = true;

  selectRow.append(select, status);
  container.append(label, selectRow);

  let lastFilesKey = "";

  select.addEventListener("change", () => {
    if (select.value) {
      void setSelectedFile(select.value);
    }
  });

  const updateLabels = () => {
    label.textContent = t("selectForecastFile");
    select.setAttribute("aria-label", t("selectForecastFile"));
    if (!status.hidden) {
      status.textContent = t("loadingForecastFile");
    }
  };

  subscribeToForecastState((state) => {
    const files = state.availableFiles ?? [];
    const filesKey = files.join("\u0000");

    if (filesKey !== lastFilesKey) {
      lastFilesKey = filesKey;
      select.replaceChildren();
      for (const fileName of files) {
        const option = document.createElement("option");
        option.value = fileName;
        option.textContent = fileName;
        select.append(option);
      }
    }

    if (state.selectedFile && files.includes(state.selectedFile)) {
      select.value = state.selectedFile;
    }

    select.disabled = Boolean(state.loadingFile) || files.length === 0;
    status.hidden = !state.loadingFile;
    status.textContent = state.loadingFile ? t("loadingForecastFile") : "";
  });

  subscribeToLocale(updateLabels);
  updateLabels();

  return container;
}

export function renderTitleCard({bannerElement} = {}) {
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

  const controlsGroup = document.createElement("div");
  controlsGroup.className = "title-card-controls";
  controlsGroup.append(renderFileSelector(), renderLocaleControls());

  mainRow.append(title, controlsGroup);
  content.append(eyebrow, mainRow);
  if (bannerElement) {
    content.append(bannerElement);
  }
  wrapper.append(content);

  const renderText = () => {
    title.textContent = t("title");
    eyebrow.textContent = `${t("coastLabel")} · ${formatUpdatedTime()}`;
  };

  subscribeToForecastState(renderText);
  subscribeToLocale(renderText);

  return wrapper;
}
