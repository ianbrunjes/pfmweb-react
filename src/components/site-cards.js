import {setCurrentSite, subscribeToForecastState} from "./pfm-state.js";
import {subscribeToLocale, t} from "./i18n.js";

const RISK_LABEL_KEYS = ["lowRisk", "mediumRisk", "highRisk"];
const RISK_ICONS = [
  '<path fill="palegreen" d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM369 209L241 337c-9.4 9.4-24.6 9.4-33.9 0l-64-64c-9.4-9.4-9.4-24.6 0-33.9s24.6-9.4 33.9 0l47 47L335 175c9.4-9.4 24.6-9.4 33.9 0s9.4 24.6 0 33.9z"></path>',
  '<path fill="gold" d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zm0-384c13.3 0 24 10.7 24 24l0 112c0 13.3-10.7 24-24 24s-24-10.7-24-24l0-112c0-13.3 10.7-24 24-24zM224 352a32 32 0 1 1 64 0 32 32 0 1 1 -64 0z"></path>',
  '<path fill="firebrick" d="M256 32c14.2 0 27.3 7.5 34.5 19.8l216 368c7.3 12.4 7.3 27.7 .2 40.1S486.3 480 472 480L40 480c-14.3 0-27.6-7.7-34.7-20.1s-7-27.8 .2-40.1l216-368C228.7 39.5 241.8 32 256 32zm0 128c-13.3 0-24 10.7-24 24l0 112c0 13.3 10.7 24 24 24s24-10.7 24-24l0-112c0-13.3-10.7-24-24-24zm32 224a32 32 0 1 0 -64 0 32 32 0 1 0 64 0z"></path>'
];

function createRiskIcon(risk) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.classList.add("site-risk-icon");
  svg.setAttribute("viewBox", "0 0 512 512");
  svg.setAttribute("aria-hidden", "true");
  svg.innerHTML = RISK_ICONS[risk] ?? RISK_ICONS[0];
  return svg;
}

export function renderSiteCards() {
  const wrapper = document.createElement("section");
  wrapper.className = "site-panel";

  const label = document.createElement("p");
  label.className = "site-panel-label";

  const list = document.createElement("div");
  list.className = "site-risk-list";

  wrapper.append(label, list);

  let currentState = null;

  const render = (state) => {
    if (state) currentState = state;
    if (!currentState) return;

    label.textContent = t("selectLocation");
    list.innerHTML = "";

    if (!currentState.sites.names.length) {
      const empty = document.createElement("div");
      empty.className = "site-detail-card site-detail-empty";
      empty.innerHTML = `
        <p class="site-empty-title">${t("monitoringUnavailable")}</p>
        <p class="site-empty-copy">${t("monitoringUnavailableCopy")}</p>
      `;
      list.append(empty);
      return;
    }

    currentState.sites.names.toReversed().forEach((name, reverseIndex) => {
      const index = currentState.sites.names.length - 1 - reverseIndex;
      const risk = currentState.sites.risk[currentState.currentFrame]?.[index] ?? 0;
      const riskLabel = t(RISK_LABEL_KEYS[risk] ?? "unknownRisk");
      const card = document.createElement("button");
      card.className = `site-risk-card risk-${risk}`;
      card.type = "button";
      card.dataset.active = String(index === currentState.currentSite);
      card.setAttribute("aria-label", t("siteRiskLabel", {site: name, risk: riskLabel}));
      card.addEventListener("pointerdown", () => setCurrentSite(index));
      card.addEventListener("click", () => setCurrentSite(index));

      const nameElement = document.createElement("span");
      nameElement.className = "site-risk-name";
      nameElement.textContent = name;

      card.append(createRiskIcon(risk), nameElement);
      list.append(card);
    });
  };

  subscribeToForecastState(render);
  subscribeToLocale(() => render());

  return wrapper;
}
