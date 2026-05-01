export function renderInfoModal() {
  const wrapper = document.createElement("section");
  wrapper.className = "info-modal-control";

  const controls = document.createElement("div");
  controls.className = "settings-control-row";

  const infoButton = document.createElement("button");
  infoButton.className = "info-modal-button";
  infoButton.type = "button";
  infoButton.setAttribute("aria-label", "Open more information");
  infoButton.textContent = "?";

  const englishButton = document.createElement("button");
  englishButton.className = "locale-select-button";
  englishButton.type = "button";
  englishButton.dataset.active = "true";
  englishButton.textContent = "EN";

  const spanishButton = document.createElement("button");
  spanishButton.className = "locale-select-button";
  spanishButton.type = "button";
  spanishButton.textContent = "ES";

  const modal = document.createElement("div");
  modal.className = "info-modal-backdrop";
  modal.hidden = true;
  modal.innerHTML = `
    <div class="info-modal" role="dialog" aria-modal="true" aria-labelledby="info-modal-title">
      <div class="info-modal-header">
        <h2 id="info-modal-title">More Information</h2>
        <button class="info-modal-close" type="button" aria-label="Close more information">×</button>
      </div>
      <div class="info-modal-body">
        <section class="info-modal-section">
          <h3>Forecast Overview</h3>
          <p>Forecasts of sewage at the ocean surface are provided for the San Diego/Tijuana border region. In the map on the left, colored contour lines represent the percentage of sewage at the ocean surface. A value of 100% is pure sewage and a value of zero is pure ocean water. Contours go from a high of 10% sewage to a low of 0.0005% sewage.</p>
        </section>
        <section class="info-modal-section">
          <h3>Shoreline Risk Colors</h3>
          <p>The color at the shoreline indicates swimmer illness risk based on sewage percentage.</p>
          <ul class="info-risk-list">
            <li><span class="info-risk-dot risk-high"></span><strong>Red</strong> indicates high risk representing greater than 0.1% sewage.</li>
            <li><span class="info-risk-dot risk-medium"></span><strong>Yellow</strong> indicates moderate risk at values between 0.001% and 0.1% sewage.</li>
            <li><span class="info-risk-dot risk-low"></span><strong>Green</strong> indicates low risk at values less than 0.001% sewage.</li>
          </ul>
        </section>
        <section class="info-modal-section">
          <h3>Swimming Locations</h3>
          <p>Four swimming locations from south to north: Playas de Tijuana, Imperial Beach Pier, Silver Strand, and Coronado, Avenida Lunar are labeled with circles. Click on the circle to see a more detailed forecast shown above at these locations. There is also a drop-down menu in the detailed forecast shown above. In the graph above, sewage concentration is given in percentages with the high, moderate, and low swimmer risk indicated with the colored background.</p>
        </section>
        <section class="info-modal-section">
          <h3>Risk Basis</h3>
          <p>Swimmer illness risk is based upon risk of illness from norovirus Feddersen et al. (2021). A value of 0.1% sewage corresponds to a 10% risk of swimmer illness and a value of 0.001% sewage corresponds to a 1% risk of swimmer illness.</p>
        </section>
        <section class="info-modal-section">
          <h3>Official Water Quality Conditions</h3>
          <p>The county's official beach water quality conditions are reported by the County of San Diego Beach & Bay Water Quality Monitoring Program. Current advisories, warnings, and closures are updated daily and can be found at County of San Diego Beach Water Quality. The County of San Diego also maintains the Tijuana River Valley Sewage Crisis Environmental Dashboard.</p>
        </section>
        <section class="info-modal-section">
          <h3>Model Notes</h3>
          <p>This ocean forecast model is analogous to weather forecast models. Forecasts are typically 5 days long, but may be as short as 3 days. Occasionally if forecasts fail, the forecast date is a day behind. The dashed white rectangle box represents the region where the model is providing a forecast. Outside of this box, no forecast is made. This model uses NOAA forecasts of Tijuana River flow and estimates San Antonio de los Buenos outflow at Punta Bandera MX. Questions regarding the Pathogen Forecast Model should be addressed to <a href="mailto:ffeddersen@ucsd.edu">ffeddersen@ucsd.edu</a>.</p>
        </section>
        <section class="info-modal-callout">
          <p>This forecast is experimental and may contain errors. Not for official use. Accuracy is not guaranteed.</p>
        </section>
        <section class="info-modal-section">
          <h3>Funding</h3>
          <p>Funding provided by the State of California.</p>
        </section>
        <section class="info-modal-section">
          <h3>Dashboard Guide</h3>
          <p>A guide to the PFM dashboard can be found on YouTube here.</p>
        </section>
      </div>
    </div>
  `;

  const closeButton = modal.querySelector(".info-modal-close");
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
  closeButton.addEventListener("click", closeModal);
  modal.addEventListener("click", (event) => {
    if (event.target === modal) closeModal();
  });
  document.addEventListener("keydown", (event) => {
    if (!modal.hidden && event.key === "Escape") closeModal();
  });

  controls.append(infoButton, englishButton, spanishButton);
  wrapper.append(controls, modal);
  return wrapper;
}
