const STORAGE_KEY = "pfm-locale";
const DEFAULT_LOCALE = "en";
const listeners = new Set();

const dictionaries = {
  en: {
    localeEnglish: "EN",
    localeSpanish: "ES",
    title: "Pathogen Forecast Model Phase 1",
    coastLabel: "San Diego / Tijuana Coast",
    updated: "Updated {time}",
    forecastTimeUnavailable: "Forecast time unavailable",
    detailedForecast: "Detailed Forecast",
    sewageConcentration: "Sewage concentration",
    sewageConcentrationForSite: "Sewage concentration — {site}",
    chartUnavailable: "Forecast chart will appear once site assets are available.",
    mapColorbarTitle: "Sewage conc.",
    forecastAnimation: "Forecast Animation",
    sliderInstructions: 'Click "Play" to animate the forecast, move the slider to scrub through time, and select a shoreline site to view the detailed forecast below.',
    playForecast: "Play forecast playback",
    pauseForecast: "Pause forecast playback",
    selectLocation: "Select Location",
    lowRisk: "Low",
    mediumRisk: "Medium",
    highRisk: "High",
    unknownRisk: "Unknown",
    siteRiskLabel: "{site}: {risk} risk",
    monitoringUnavailable: "Monitoring sites unavailable",
    monitoringUnavailableCopy: "Generate the upstream forecast JSON assets to populate per-site risk and concentration data.",
    openMoreInformation: "Open more information",
    closeMoreInformation: "Close more information",
    moreInformation: "About the model",
    infoForecastOverviewTitle: "Forecast Overview",
    infoForecastOverview: "Forecasts of sewage at the ocean surface are provided for the San Diego/Tijuana border region. In the map on the left, colored contour lines represent the percentage of sewage at the ocean surface. A value of 100% is pure sewage and a value of zero is pure ocean water. Contours go from a high of 10% sewage to a low of 0.0005% sewage.",
    infoRiskColorsTitle: "Shoreline Risk Colors",
    infoRiskColors: "The color at the shoreline indicates swimmer illness risk based on sewage percentage.",
    red: "Red",
    yellow: "Yellow",
    green: "Green",
    infoHighRisk: "indicates high risk representing greater than 0.1% sewage.",
    infoMediumRisk: "indicates moderate risk at values between 0.001% and 0.1% sewage.",
    infoLowRisk: "indicates low risk at values less than 0.001% sewage.",
    infoSwimmingLocationsTitle: "Swimming Locations",
    infoSwimmingLocations: "Four swimming locations from south to north: Playas de Tijuana, Imperial Beach Pier, Silver Strand, and Coronado, Avenida Lunar are labeled with circles. Click on the circle to see a more detailed forecast shown above at these locations. One can also click on the location noame above detailed forecast shown above. In the graph above, sewage concentration is given in percentages with the high, moderate, and low swimmer risk indicated with the colored background.",
    infoRiskBasisTitle: "Risk Basis",
    infoRiskBasis: "Swimmer illness risk is based upon risk of illness from norovirus Feddersen et al. (2021). A value of 0.1% sewage corresponds to a 10% risk of swimmer illness and a value of 0.001% sewage corresponds to a 1% risk of swimmer illness.",
    infoOfficialConditionsTitle: "Official Water Quality Conditions",
    infoOfficialConditions: "The county's official beach water quality conditions are reported by the County of San Diego Beach & Bay Water Quality Monitoring Program. Current advisories, warnings, and closures are updated daily and can be found at {sdbeach_link}. The County of San Diego also maintains the {trdash_link}.",
    infoModelNotesTitle: "Model Notes",
    infoModelNotesPrefix: "This ocean forecast model is analogous to weather forecast models. Forecasts are typically 5 days long, but may be as short as 3 days. Occasionally if forecasts fail, the forecast date is a day (or more) behind. The dashed white rectangle box represents the region where the model is providing a forecast. Outside of this box, no forecast is made. This model uses NOAA forecasts of Tijuana River flow and estimates San Antonio de los Buenos outflow at Punta Bandera MX. As with any forecast, this forecast also has errors. More information on PFM and its forecast skill can be found at https://pubs.acs.org/esthag/article/60/31/21913/5232259/Pathogen-Forecast-Model-Version-1-0-A-Process. Questions regarding the Pathogen Forecast Model should be addressed to",
    infoExperimental: "This forecast is experimental and may contain errors. Not for official use. Accuracy is not guaranteed.",
    infoFundingTitle: "Funding",
    infoFunding: "Funding provided by the State of California.",
    infoDashboardGuideTitle: "Dashboard Guide",
    infoDashboardGuide: "A guide to the PFM dashboard can be found on YouTube {yt_link}. Note this is for a previous website version but it is largely similar.",
    infoDashboardGuideLinkLabel: "here",
    sdWaterQualityLinkLabel: "County of San Diego Beach Water Quality",
    trDashLinkLabel: "Tijuana River Valley Sewage Crisis Environmental Dashboard"
  },
  es: {
    localeEnglish: "EN",
    localeSpanish: "ES",
    title: "Modelo de Pronóstico de Patógenos Fase 1",
    coastLabel: "Costa de San Diego / Tijuana",
    updated: "Actualizado {time}",
    forecastTimeUnavailable: "Hora del pronóstico no disponible",
    detailedForecast: "Pronóstico Detallado",
    sewageConcentration: "Concentración de aguas residuales",
    sewageConcentrationForSite: "Concentración de aguas residuales — {site}",
    chartUnavailable: "La gráfica del pronóstico aparecerá cuando estén disponibles los datos de los sitios.",
    mapColorbarTitle: "Conc. de aguas residuales",
    forecastAnimation: "Animación del Pronóstico",
    sliderInstructions: 'Haz clic en "Reproducir" para animar el pronóstico, mueve el control deslizante para avanzar en el tiempo y selecciona un sitio de la costa para ver el pronóstico detallado abajo.',
    playForecast: "Reproducir pronóstico",
    pauseForecast: "Pausar pronóstico",
    selectLocation: "Seleccionar Ubicación",
    lowRisk: "Bajo",
    mediumRisk: "Medio",
    highRisk: "Alto",
    unknownRisk: "Desconocido",
    siteRiskLabel: "{site}: riesgo {risk}",
    monitoringUnavailable: "Sitios de monitoreo no disponibles",
    monitoringUnavailableCopy: "Genera los archivos JSON del pronóstico para mostrar el riesgo y la concentración por sitio.",
    openMoreInformation: "Abrir más información",
    closeMoreInformation: "Cerrar más información",
    moreInformation: "Acerca del modelo",
    infoForecastOverviewTitle: "Resumen del Pronóstico",
    infoForecastOverview: "Los pronósticos de aguas residuales en la superficie del océano se proporcionan para la región fronteriza de San Diego/Tijuana. En el mapa de la izquierda, las líneas de contorno de colores representan el porcentaje de aguas residuales en la superficie del océano. Un valor de 100% es aguas residuales puras y un valor de cero es agua oceánica pura. Los contornos van de un máximo de 10% de aguas residuales a un mínimo de 0.0005% de aguas residuales.",
    infoRiskColorsTitle: "Colores de Riesgo en la Costa",
    infoRiskColors: "El color en la costa indica el riesgo de enfermedad para nadadores con base en el porcentaje de aguas residuales.",
    red: "Rojo",
    yellow: "Amarillo",
    green: "Verde",
    infoHighRisk: "indica riesgo alto, que representa más de 0.1% de aguas residuales.",
    infoMediumRisk: "indica riesgo moderado, con valores entre 0.001% y 0.1% de aguas residuales.",
    infoLowRisk: "indica riesgo bajo, con valores menores a 0.001% de aguas residuales.",
    infoSwimmingLocationsTitle: "Sitios de Natación",
    infoSwimmingLocations: "Cuatro sitios de natación de sur a norte: Playas de Tijuana, Imperial Beach Pier, Silver Strand y Coronado, Avenida Lunar están marcados con círculos. Haz clic en un círculo para ver un pronóstico más detallado en estos sitios. También se puede hacer clic en el nombre de la ubicación arriba del pronóstico detallado. En la gráfica de arriba, la concentración de aguas residuales se muestra en porcentajes, con el riesgo alto, moderado y bajo para nadadores indicado por el fondo de color.",
    infoRiskBasisTitle: "Base del Riesgo",
    infoRiskBasis: "El riesgo de enfermedad para nadadores se basa en el riesgo de enfermedad por norovirus de Feddersen et al. (2021). Un valor de 0.1% de aguas residuales corresponde a un riesgo de enfermedad de 10% y un valor de 0.001% corresponde a un riesgo de enfermedad de 1%.",
    infoOfficialConditionsTitle: "Condiciones Oficiales de Calidad del Agua",
    infoOfficialConditions: "Las condiciones oficiales de calidad del agua en playas del condado son reportadas por el Programa de Monitoreo de Calidad del Agua de Playas y Bahías del Condado de San Diego. Los avisos, advertencias y cierres actuales se actualizan diariamente y se pueden consultar en {sdbeach_link}. El Condado de San Diego también mantiene el {trdash_link}.",
    infoModelNotesTitle: "Notas del Modelo",
    infoModelNotesPrefix: "Este modelo de pronóstico oceánico es análogo a los modelos de pronóstico del tiempo. Los pronósticos normalmente son de 5 días, pero pueden ser tan cortos como 3 días. En ocasiones, si los pronósticos fallan, la fecha del pronóstico queda un día atrasada. El rectángulo blanco punteado representa la región donde el modelo proporciona un pronóstico. Fuera de este rectángulo, no se realiza ningún pronóstico. Este modelo usa pronósticos de NOAA del flujo del Río Tijuana y estima el flujo de San Antonio de los Buenos en Punta Bandera, MX. Las preguntas sobre el Modelo de Pronóstico de Patógenos deben dirigirse a",
    infoExperimental: "Este pronóstico es experimental y puede contener errores. No es para uso oficial. No se garantiza su precisión.",
    infoFundingTitle: "Financiamiento",
    infoFunding: "Financiamiento proporcionado por el Estado de California.",
    infoDashboardGuideTitle: "Guía del Tablero",
    infoDashboardGuide: "Una guía del tablero PFM se puede encontrar en YouTube {yt_link}. Ten en cuenta que esto corresponde a una versión anterior del sitio web, pero es muy similar.",
    infoDashboardGuideLinkLabel: "aquí",
    sdWaterQualityLinkLabel: "County of San Diego Beach Water Quality",
    trDashLinkLabel: "Tijuana River Valley Sewage Crisis Environmental Dashboard"
  }
};

let currentLocale = getStoredLocale();

function getStoredLocale() {
  if (typeof window === "undefined") return DEFAULT_LOCALE;
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return dictionaries[stored] ? stored : DEFAULT_LOCALE;
}

function notifyLocaleChange() {
  for (const listener of listeners) listener(currentLocale);
}

export function interpolateTemplate(template, values = {}) {
  return Object.entries(values).reduce(
    (result, [name, value]) => result.replaceAll(`{${name}}`, value),
    template
  );
}

export function getLocale() {
  return currentLocale;
}

export function setLocale(locale) {
  if (!dictionaries[locale] || locale === currentLocale) return;
  currentLocale = locale;
  if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_KEY, locale);
  notifyLocaleChange();
}

export function subscribeToLocale(listener) {
  listeners.add(listener);
  listener(currentLocale);
  return () => listeners.delete(listener);
}

export function t(key, values = {}) {
  const template = dictionaries[currentLocale][key] ?? dictionaries[DEFAULT_LOCALE][key] ?? key;
  return interpolateTemplate(template, values);
}

export function formatDateTime(isoString, options = {}) {
  const normalized = isoString.endsWith("Z") ? isoString : `${isoString}Z`;
  return new Date(normalized).toLocaleString(currentLocale === "es" ? "es-MX" : "en-US", {
    timeZone: "America/Los_Angeles",
    ...options
  });
}
