import {getLocale, setLocale, subscribeToLocale, t} from "./i18n.js";

function renderModalContent() {
  return `
    <div class="info-modal" role="dialog" aria-modal="true" aria-labelledby="info-modal-title">
      <div class="info-modal-header">
        <h2 id="info-modal-title">${t("moreInformation")}</h2>
        <button class="info-modal-close" type="button" aria-label="${t("closeMoreInformation")}">×</button>
      </div>
      <div class="info-modal-body">
        <section class="info-modal-section">
          <h3>${t("infoForecastOverviewTitle")}</h3>
          <p>${t("infoForecastOverview")}</p>
        </section>
        <section class="info-modal-section">
          <h3>${t("infoRiskColorsTitle")}</h3>
          <p>${t("infoRiskColors")}</p>
          <ul class="info-risk-list">
            <li><span class="info-risk-dot risk-high"></span><strong>${t("red")}</strong> ${t("infoHighRisk")}</li>
            <li><span class="info-risk-dot risk-medium"></span><strong>${t("yellow")}</strong> ${t("infoMediumRisk")}</li>
            <li><span class="info-risk-dot risk-low"></span><strong>${t("green")}</strong> ${t("infoLowRisk")}</li>
          </ul>
        </section>
        <section class="info-modal-section">
          <h3>${t("infoSwimmingLocationsTitle")}</h3>
          <p>${t("infoSwimmingLocations")}</p>
        </section>
        <section class="info-modal-section">
          <h3>${t("infoRiskBasisTitle")}</h3>
          <p>${t("infoRiskBasis")}</p>
        </section>
        <section class="info-modal-section">
          <h3>${t("infoOfficialConditionsTitle")}</h3>
          <p>${t("infoOfficialConditions")}</p>
        </section>
        <section class="info-modal-section">
          <h3>${t("infoModelNotesTitle")}</h3>
          <p>${t("infoModelNotesPrefix")} <a href="mailto:ffeddersen@ucsd.edu">ffeddersen@ucsd.edu</a>.</p>
        </section>
        <section class="info-modal-callout">
          <p>${t("infoExperimental")}</p>
        </section>
        <section class="info-modal-section">
          <h3>${t("infoFundingTitle")}</h3>
          <p>${t("infoFunding")}</p>
        </section>
        <section class="info-modal-section">
          <h3>${t("infoDashboardGuideTitle")}</h3>
          <p>${t("infoDashboardGuide")}</p>
        </section>
      </div>
    </div>
  `;
}

export function renderInfoModal() {
  const wrapper = document.createElement("section");
  wrapper.className = "info-modal-control";

  const controls = document.createElement("div");
  controls.className = "settings-control-row";

  const infoButton = document.createElement("button");
  infoButton.className = "info-modal-button";
  infoButton.type = "button";
  infoButton.textContent = "?";

  const englishButton = document.createElement("button");
  englishButton.className = "locale-select-button";
  englishButton.type = "button";

  const spanishButton = document.createElement("button");
  spanishButton.className = "locale-select-button";
  spanishButton.type = "button";

  const modal = document.createElement("div");
  modal.className = "info-modal-backdrop";
  modal.hidden = true;

  let closeButton = null;
  const renderText = () => {
    const activeLocale = getLocale();
    infoButton.setAttribute("aria-label", t("openMoreInformation"));
    englishButton.textContent = t("localeEnglish");
    spanishButton.textContent = t("localeSpanish");
    englishButton.dataset.active = String(activeLocale === "en");
    spanishButton.dataset.active = String(activeLocale === "es");
    modal.innerHTML = renderModalContent();
    closeButton = modal.querySelector(".info-modal-close");
    closeButton.addEventListener("click", closeModal);
  };

  const openModal = () => {
    modal.hidden = false;
    document.body.classList.add("info-modal-open");
    closeButton.focus();
  };
  const closeModal = () => {
    modal.hidden = true;
    document.body.classList.remove("info-modal-open");
    infoButton.focus();
  };

  infoButton.addEventListener("click", openModal);
  englishButton.addEventListener("click", () => setLocale("en"));
  spanishButton.addEventListener("click", () => setLocale("es"));
  modal.addEventListener("click", (event) => {
    if (event.target === modal) closeModal();
  });
  document.addEventListener("keydown", (event) => {
    if (!modal.hidden && event.key === "Escape") closeModal();
  });

  subscribeToLocale(renderText);
  controls.append(infoButton, englishButton, spanishButton);
  wrapper.append(controls, modal);
  return wrapper;
}
