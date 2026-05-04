import L from "leaflet";
import {FileAttachment} from "observablehq:stdlib";
import {
  getForecastState,
  getFrameUrl,
  setCurrentSite,
  subscribeToForecastState
} from "./pfm-state.js";

const RISK_COLORS = ["palegreen", "gold", "firebrick"];
const COLORBAR_IMAGE = FileAttachment("../vendor/images/pfmweb_colorbar_pcent.png");
const COLORBAR_MIN_HEIGHT = 180;
const COLORBAR_MAX_HEIGHT = 420;
const COLORBAR_MAP_HEIGHT_RATIO = 0.62;

function waitForMapLayout(element) {
  return new Promise((resolve) => {
    const check = () => {
      if (element.isConnected && element.clientWidth > 0 && element.clientHeight > 0) {
        resolve();
      } else {
        requestAnimationFrame(check);
      }
    };
    check();
  });
}

function addColorbar(map, imageUrl) {
  const ColorbarControl = L.Control.extend({
    options: {position: "bottomleft"},
    onAdd() {
      const div = L.DomUtil.create("div");
      div.className = "map-colorbar";
      div.innerHTML = `<img src="${imageUrl}" alt="Sewage concentration legend" class="map-colorbar-image">`;
      L.DomEvent.disableClickPropagation(div);
      return div;
    }
  });

  new ColorbarControl().addTo(map);
}

function updateColorbarSize(element) {
  const height = Math.round(
    Math.max(
      COLORBAR_MIN_HEIGHT,
      Math.min(COLORBAR_MAX_HEIGHT, element.clientHeight * COLORBAR_MAP_HEIGHT_RATIO)
    )
  );
  element.style.setProperty("--map-colorbar-height", `${height}px`);
}

export async function renderSanDiegoMap() {
  const wrapper = document.createElement("section");
  wrapper.className = "map-card";

  const mapElement = document.createElement("div");
  mapElement.id = "map-SD";
  mapElement.className = "leaflet-map";

  wrapper.append(mapElement);

  void (async () => {
    const colorbarUrl = await COLORBAR_IMAGE.url();
    await waitForMapLayout(mapElement);

    const map = L.map(mapElement, {
      zoomControl: true,
      attributionControl: true
    }).setView([32.58, -117.18], 14);

    L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      {
        maxZoom: 14,
        minZoom: 10,
        attribution: "Tiles &copy; Esri"
      }
    ).addTo(map);

    map.createPane("shoreRiskPane");
    map.getPane("shoreRiskPane").style.zIndex = 410;

    map.createPane("siteRiskPane");
    map.getPane("siteRiskPane").style.zIndex = 620;

    const resizeObserver = new ResizeObserver(() => {
      updateColorbarSize(mapElement);
      map.invalidateSize(false);
    });
    resizeObserver.observe(mapElement);
    updateColorbarSize(mapElement);

    let imageOverlay = null;
    let shoreLayer = null;
    let siteLayer = null;
    let domainLayer = null;
    let colorbarAdded = false;

    const buildShoreLayer = (snapshot) => {
      if (shoreLayer) shoreLayer.remove();
      if (!snapshot.shoreline.lats.length || !snapshot.shoreline.risk.length) return;

      const circles = snapshot.shoreline.lats.map((lat, index) =>
        L.circleMarker([lat, snapshot.shoreline.lons[index]], {
          pane: "shoreRiskPane",
          radius: 3,
          color: RISK_COLORS[snapshot.shoreline.risk[snapshot.currentFrame]?.[index] ?? 0] ?? "#888",
          fillColor: RISK_COLORS[snapshot.shoreline.risk[snapshot.currentFrame]?.[index] ?? 0] ?? "#888",
          fillOpacity: 0.9,
          weight: 0
        })
      );

      shoreLayer = L.layerGroup(circles).addTo(map);
    };

    const buildSiteMarkers = (snapshot) => {
      if (siteLayer) siteLayer.remove();
      if (!snapshot.sites.names.length) return;

      const markers = snapshot.sites.names.map((name, index) => {
        const risk = snapshot.sites.risk[snapshot.currentFrame]?.[index] ?? 0;

        const marker = L.circleMarker([snapshot.sites.lats[index], snapshot.sites.lons[index]], {
          pane: "siteRiskPane",
          radius: 6,
          color: "#fff",
          weight: 2,
          fillColor: RISK_COLORS[risk] ?? "#888",
          fillOpacity: 1,
          interactive: true
        }).bindTooltip(name, {
          permanent: true,
          direction: "right",
          offset: [6, 0],
          className: "site-label",
          interactive: true
        });

        marker.on("click", () => setCurrentSite(index));
        marker.on("tooltipopen", (event) => {
          const tooltipElement = event.tooltip.getElement();
          if (!tooltipElement) return;
          L.DomEvent.on(tooltipElement, "click", L.DomEvent.stopPropagation);
          L.DomEvent.on(tooltipElement, "click", () => setCurrentSite(index));
        });

        return marker;
      });

      siteLayer = L.layerGroup(markers).addTo(map);
    };

    //TODO image overlay has weird border
    //TODO verify contour styles and matching colorbar
    subscribeToForecastState((snapshot) => {
      if (snapshot.bounds && !imageOverlay) {
        const bounds = [
          [snapshot.bounds.south, snapshot.bounds.west],
          [snapshot.bounds.north, snapshot.bounds.east]
        ];

        imageOverlay = L.imageOverlay(getFrameUrl(0), bounds, {
          opacity: 1,
          interactive: false
        }).addTo(map);

        map.fitBounds(bounds, {
          padding: [40, 40]
        });

        if (snapshot.domain?.length) {
          domainLayer = L.polygon(snapshot.domain, {
            color: "#ffffff",
            weight: 1,
            opacity: 0.85,
            fill: false,
            interactive: false
          }).addTo(map);
        }

        if (!colorbarAdded) {
          addColorbar(map, colorbarUrl);
          colorbarAdded = true;
        }
      }

      if (imageOverlay && snapshot.frameUrls.length) {
        imageOverlay.setUrl(getFrameUrl(snapshot.currentFrame));
      }

      buildShoreLayer(snapshot);
      buildSiteMarkers(snapshot);
      requestAnimationFrame(() => map.invalidateSize(false));
    });
  })();

  return wrapper;
}
