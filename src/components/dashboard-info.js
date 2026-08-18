import {getLocale, setLocale, subscribeToLocale, t} from "../lib/i18n.js";
import {dashboardGuideLinks} from "../lib/info-links.js";
import {parseTemplateSegments} from "../lib/render-linked-text.js";

function appendSection(container, titleKey, bodyKey) {
  appendSectionWithContent(container, titleKey, () => {
    const body = document.createElement("p");
    body.textContent = t(bodyKey);
    return [body];
  });
}

function appendSectionWithContent(container, titleKey, buildContent) {
  const section = document.createElement("section");
  section.className = "dashboard-info-section";

  const heading = document.createElement("h3");
  heading.textContent = t(titleKey);

  const content = buildContent();
  section.append(heading, ...(Array.isArray(content) ? content : [content]));
  container.append(section);
}

function appendSectionWithLinks(container, titleKey, bodyKey, linksByToken) {
  appendSectionWithContent(container, titleKey, () => {
    const body = document.createElement("p");
    const template = t(bodyKey);
    const segments = parseTemplateSegments(template, linksByToken, (labelKey) => t(labelKey), window.location.origin);

    for (const segment of segments) {
      if (segment.type === "text") {
        body.append(document.createTextNode(segment.value));
      } else {
        const link = document.createElement("a");
        link.href = segment.href;
        link.textContent = segment.label;
        if (segment.href.startsWith("https://")) {
          link.target = "_blank";
          link.rel = "noopener noreferrer";
        }
        body.append(link);
      }
    }

    return [body];
  });
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

    appendSectionWithContent(content, "infoRiskColorsTitle", () => {
      const riskBody = document.createElement("p");
      riskBody.textContent = t("infoRiskColors");
      return [riskBody, buildRiskList()];
    });

    appendSection(content, "infoRiskBasisTitle", "infoRiskBasis");
    appendSection(content, "infoSwimmingLocationsTitle", "infoSwimmingLocations");
    appendSectionWithLinks(content, "infoOfficialConditionsTitle", "infoOfficialConditions", dashboardGuideLinks);

    appendSectionWithContent(content, "infoModelNotesTitle", () => {
      const notesBody = document.createElement("p");
      const template = t("infoModelNotesPrefix");
      const segments = parseTemplateSegments(template, dashboardGuideLinks, (labelKey) => t(labelKey), window.location.origin);

      for (const segment of segments) {
        if (segment.type === "text") {
          notesBody.append(document.createTextNode(segment.value));
        } else {
          const link = document.createElement("a");
          link.href = segment.href;
          link.textContent = segment.label;
          if (segment.href.startsWith("https://")) {
            link.target = "_blank";
            link.rel = "noopener noreferrer";
          }
          notesBody.append(link);
        }
      }

      notesBody.append(document.createTextNode(" "));
      const emailLink = document.createElement("a");
      emailLink.href = "mailto:ffeddersen@ucsd.edu";
      emailLink.textContent = "ffeddersen@ucsd.edu";
      notesBody.append(emailLink, document.createTextNode("."));
      return [notesBody];
    });

    appendSectionWithLinks(content, "infoDashboardGuideTitle", "infoDashboardGuide", dashboardGuideLinks);
    appendSection(content, "infoFundingTitle", "infoFunding");
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
