const SVG_NAMESPACE = "http://www.w3.org/2000/svg";

const RISK_LEVELS = [
  {
    color: "palegreen",
    labelKey: "lowRisk",
    path: "M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM369 209L241 337c-9.4 9.4-24.6 9.4-33.9 0l-64-64c-9.4-9.4-9.4-24.6 0-33.9s24.6-9.4 33.9 0l47 47L335 175c9.4-9.4 24.6-9.4 33.9 0s9.4 24.6 0 33.9z"
  },
  {
    color: "gold",
    labelKey: "mediumRisk",
    path: "M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zm0-384c13.3 0 24 10.7 24 24l0 112c0 13.3-10.7 24-24 24s-24-10.7-24-24l0-112c0-13.3 10.7-24 24-24zM224 352a32 32 0 1 1 64 0 32 32 0 1 1 -64 0z"
  },
  {
    color: "firebrick",
    labelKey: "highRisk",
    path: "M256 32c14.2 0 27.3 7.5 34.5 19.8l216 368c7.3 12.4 7.3 27.7 .2 40.1S486.3 480 472 480L40 480c-14.3 0-27.6-7.7-34.7-20.1s-7-27.8 .2-40.1l216-368C228.7 39.5 241.8 32 256 32zm0 128c-13.3 0-24 10.7-24 24l0 112c0 13.3 10.7 24 24 24s24-10.7 24-24l0-112c0-13.3-10.7-24-24-24zm32 224a32 32 0 1 0 -64 0 32 32 0 1 0 64 0z"
  }
];

function getRiskLevel(risk) {
  return RISK_LEVELS[risk] ?? RISK_LEVELS[0];
}

export function getRiskColor(risk) {
  return getRiskLevel(risk).color;
}

export function getRiskLabelKey(risk) {
  return getRiskLevel(risk).labelKey;
}

export function createRiskIcon(risk) {
  const {color, path: pathData} = getRiskLevel(risk);
  const svg = document.createElementNS(SVG_NAMESPACE, "svg");
  svg.classList.add("site-risk-icon");
  svg.setAttribute("viewBox", "0 0 512 512");
  svg.setAttribute("aria-hidden", "true");

  const path = document.createElementNS(SVG_NAMESPACE, "path");
  path.setAttribute("fill", color);
  path.setAttribute("d", pathData);
  svg.append(path);

  return svg;
}
