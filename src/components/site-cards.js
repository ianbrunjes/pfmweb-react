import {setCurrentSite, subscribeToForecastState} from "../state/forecast-store.js";
import {subscribeToLocale, t} from "../lib/i18n.js";
import {createRiskIcon, getRiskLabelKey} from "../lib/risk.js";

export function renderSiteCards() {
  const wrapper = document.createElement("section");
  wrapper.className = "site-panel";

  const label = document.createElement("p");
  label.className = "site-panel-label";

  const list = document.createElement("div");
  list.className = "site-risk-list";

  wrapper.append(label, list);

  let currentState = null;
  let lastNamesKey = "";
  let cards = [];

  const updateCards = () => {
    cards.forEach((cardState) => {
      const {card, index} = cardState;
      const risk = currentState.sites.risk[currentState.currentFrame]?.[index] ?? 0;
      const riskLabel = t(getRiskLabelKey(risk) ?? "unknownRisk");
      card.className = `site-risk-card risk-${risk}`;
      card.dataset.active = String(index === currentState.currentSite);
      card.setAttribute(
        "aria-label",
        t("siteRiskLabel", {site: currentState.sites.names[index], risk: riskLabel})
      );
      const nextIcon = createRiskIcon(risk);
      cardState.icon.replaceWith(nextIcon);
      cardState.icon = nextIcon;
    });
  };

  const render = (state, forceRebuild = false) => {
    if (state) currentState = state;
    if (!currentState) return;

    label.textContent = t("selectLocation");
    const namesKey = currentState.sites.names.join("\u0000");

    if (!currentState.sites.names.length) {
      if (lastNamesKey === namesKey && !forceRebuild) return;
      lastNamesKey = namesKey;
      cards = [];
      list.replaceChildren();
      const empty = document.createElement("div");
      empty.className = "site-detail-card site-detail-empty";
      const emptyTitle = document.createElement("p");
      emptyTitle.className = "site-empty-title";
      emptyTitle.textContent = t("monitoringUnavailable");

      const emptyCopy = document.createElement("p");
      emptyCopy.className = "site-empty-copy";
      emptyCopy.textContent = t("monitoringUnavailableCopy");

      empty.append(emptyTitle, emptyCopy);
      list.append(empty);
      return;
    }

    if (lastNamesKey === namesKey && !forceRebuild) {
      updateCards();
      return;
    }

    lastNamesKey = namesKey;
    cards = [];
    list.replaceChildren();

    currentState.sites.names.toReversed().forEach((name, reverseIndex) => {
      const index = currentState.sites.names.length - 1 - reverseIndex;
      const risk = currentState.sites.risk[currentState.currentFrame]?.[index] ?? 0;
      const riskLabel = t(getRiskLabelKey(risk) ?? "unknownRisk");
      const card = document.createElement("button");
      card.className = `site-risk-card risk-${risk}`;
      card.type = "button";
      card.dataset.active = String(index === currentState.currentSite);
      card.setAttribute("aria-label", t("siteRiskLabel", {site: name, risk: riskLabel}));
      card.addEventListener("pointerdown", (event) => event.preventDefault());
      card.addEventListener("pointerup", (event) => {
        event.preventDefault();
        setCurrentSite(index);
      });
      card.addEventListener("click", (event) => {
        event.preventDefault();
        setCurrentSite(index);
      });

      const nameElement = document.createElement("span");
      nameElement.className = "site-risk-name";
      nameElement.textContent = name;

      const riskIcon = createRiskIcon(risk);
      card.append(riskIcon, nameElement);
      list.append(card);
      cards.push({card, icon: riskIcon, index});
    });
  };

  subscribeToForecastState(render);
  subscribeToLocale(() => render(null, true));

  return wrapper;
}
