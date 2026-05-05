import {getLocale, setLocale, subscribeToLocale, t} from "../lib/i18n.js";

function appendSection(container, titleKey, bodyKey) {
  const section = document.createElement("section");
  section.className = "dashboard-info-section";

  const heading = document.createElement("h3");
  heading.textContent = t(titleKey);

  const body = document.createElement("p");
  body.textContent = t(bodyKey);

  section.append(heading, body);
  container.append(section);
}

function buildRiskList() {
  const list = document.createElement("ul");
  list.className = "info-risk-list";

  const items = [
    ["risk-high", "red", "infoHighRisk"],
    ["risk-medium", "yellow", "infoMediumRisk"],
    ["risk-low", "green", "infoLowRisk"]
  ];

  for (const [className, labelKey, bodyKey] of items) {
    const item = document.createElement("li");
    const dot = document.createElement("span");
    dot.className = `info-risk-dot ${className}`;

    const copy = document.createElement("span");
    copy.className = "info-risk-copy";

    const strong = document.createElement("strong");
    strong.textContent = t(labelKey);

    copy.append(strong, document.createTextNode(` ${t(bodyKey)}`));
    item.append(dot, copy);
    list.append(item);
  }

  return list;
}

export function renderLocaleControls() {
  const controls = document.createElement("div");
  controls.className = "settings-control-row";

  const englishButton = document.createElement("button");
  englishButton.className = "locale-select-button";
  englishButton.type = "button";
  englishButton.dataset.locale = "en";

  const spanishButton = document.createElement("button");
  spanishButton.className = "locale-select-button";
  spanishButton.type = "button";
  spanishButton.dataset.locale = "es";

  const renderText = () => {
    const activeLocale = getLocale();
    englishButton.setAttribute("aria-label", "Use US English");
    englishButton.title = "US English";
    spanishButton.setAttribute("aria-label", "Usar México Español");
    spanishButton.title = "México Español";
    englishButton.dataset.active = String(activeLocale === "en");
    spanishButton.dataset.active = String(activeLocale === "es");
  };

  englishButton.addEventListener("click", () => setLocale("en"));
  spanishButton.addEventListener("click", () => setLocale("es"));

  subscribeToLocale(renderText);
  controls.append(englishButton, spanishButton);
  return controls;
}

export function renderDashboardInfo() {
  const wrapper = document.createElement("section");
  wrapper.className = "dashboard-info-card";

  const header = document.createElement("div");
  header.className = "dashboard-info-header";

  const eyebrow = document.createElement("p");
  eyebrow.className = "dashboard-info-eyebrow";

  header.append(eyebrow);

  const content = document.createElement("div");
  content.className = "dashboard-info-body";

  const renderText = () => {
    eyebrow.textContent = t("moreInformation");

    content.replaceChildren();

    appendSection(content, "infoForecastOverviewTitle", "infoForecastOverview");

    const riskSection = document.createElement("section");
    riskSection.className = "dashboard-info-section";
    const riskHeading = document.createElement("h3");
    riskHeading.textContent = t("infoRiskColorsTitle");
    const riskBody = document.createElement("p");
    riskBody.textContent = t("infoRiskColors");
    riskSection.append(riskHeading, riskBody, buildRiskList());
    content.append(riskSection);

    appendSection(content, "infoSwimmingLocationsTitle", "infoSwimmingLocations");
    appendSection(content, "infoRiskBasisTitle", "infoRiskBasis");
    appendSection(content, "infoOfficialConditionsTitle", "infoOfficialConditions");

    const notesSection = document.createElement("section");
    notesSection.className = "dashboard-info-section";
    const notesHeading = document.createElement("h3");
    notesHeading.textContent = t("infoModelNotesTitle");
    const notesBody = document.createElement("p");
    notesBody.append(document.createTextNode(`${t("infoModelNotesPrefix")} `));
    const emailLink = document.createElement("a");
    emailLink.href = "mailto:ffeddersen@ucsd.edu";
    emailLink.textContent = "ffeddersen@ucsd.edu";
    notesBody.append(emailLink, document.createTextNode("."));
    notesSection.append(notesHeading, notesBody);
    content.append(notesSection);

    appendSection(content, "infoFundingTitle", "infoFunding");
    appendSection(content, "infoDashboardGuideTitle", "infoDashboardGuide");
  };

  subscribeToLocale(renderText);
  wrapper.append(header, content);
  return wrapper;
}

export function renderExperimentalBanner() {
  const banner = document.createElement("section");
  banner.className = "dashboard-info-callout dashboard-map-callout";

  const text = document.createElement("p");
  banner.append(text);

  const renderText = () => {
    text.textContent = t("infoExperimental");
  };

  subscribeToLocale(renderText);
  return banner;
}
