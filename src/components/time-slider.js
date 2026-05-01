import {icon} from "@fortawesome/fontawesome-svg-core";
import {faPause, faPlay} from "@fortawesome/free-solid-svg-icons";
import {
  formatForecastTime,
  getFrameCount,
  setCurrentFrame,
  subscribeToForecastState
} from "./pfm-state.js";

export function renderTimeSlider() {
  const wrapper = document.createElement("section");
  wrapper.className = "slider-card";

  const label = document.createElement("p");
  label.className = "slider-label";
  label.textContent = "Forecast Animation";

  const instructions = document.createElement("p");
  instructions.className = "slider-instructions";
  instructions.textContent = 'Click "Play" to animate the forecast, move the slider to scrub through time, and select a shoreline site to view the detailed forecast at right.';

  const dateValue = document.createElement("p");
  dateValue.className = "slider-date-value";

  const controls = document.createElement("div");
  controls.className = "slider-controls";

  const playButton = document.createElement("button");
  playButton.className = "slider-play-button";
  playButton.type = "button";

  const slider = document.createElement("input");
  slider.className = "time-slider";
  slider.type = "range";
  slider.min = "0";
  slider.step = "1";

  let timer = null;
  let playing = false;

  const renderButtonIcon = () => {
    const svg = icon(playing ? faPause : faPlay, {styles: {height: "1rem"}});
    playButton.innerHTML = svg.html.join("");
    playButton.setAttribute("aria-label", playing ? "Pause forecast playback" : "Play forecast playback");
  };

  const stopPlayback = () => {
    if (timer !== null) {
      window.clearInterval(timer);
      timer = null;
    }
    playing = false;
    renderButtonIcon();
  };

  const startPlayback = () => {
    if (Number(slider.value) >= Number(slider.max)) {
      slider.value = slider.min;
      setCurrentFrame(slider.value);
    }

    playing = true;
    renderButtonIcon();

    timer = window.setInterval(() => {
      const current = Number(slider.value);
      const max = Number(slider.max);
      if (current >= max) {
        stopPlayback();
        return;
      }
      slider.value = String(current + 1);
      setCurrentFrame(slider.value);
      if (Number(slider.value) >= max) stopPlayback();
    }, 100);
  };

  playButton.addEventListener("click", () => {
    if (playing) stopPlayback();
    else startPlayback();
  });

  slider.addEventListener("pointerdown", () => {
    if (playing) stopPlayback();
  });

  slider.addEventListener("keydown", () => {
    if (playing) stopPlayback();
  });

  slider.addEventListener("input", () => {
    setCurrentFrame(slider.value);
    if (Number(slider.value) >= Number(slider.max) && playing) stopPlayback();
  });

  subscribeToForecastState((state) => {
    slider.max = String(Math.max(0, getFrameCount() - 1));
    slider.value = String(state.currentFrame);
    dateValue.textContent = formatForecastTime(state.currentFrame);
  });

  renderButtonIcon();
  controls.append(playButton, slider);
  wrapper.append(label, dateValue, controls, instructions);
  return wrapper;
}
