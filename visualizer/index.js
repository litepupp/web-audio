"use strict";

// DOM elements
const uploadButton = document.getElementById("uploadButton");
const fileInput = document.getElementById("fileInput");
const fftRange = document.getElementById("fftRange");
const fftLabel = document.getElementById("fftLabel");
const audioPlayer = document.getElementById("audioPlayer");

const oscilloscopeSpeedRange = document.getElementById(
  "oscilloscopeSpeedRange"
);
const oscilloscopeSpeedLabel = document.getElementById(
  "oscilloscopeSpeedLabel"
);
const oscilloscopeCanvas = document.getElementById("oscilloscope");
const oscilloscopeContext = oscilloscopeCanvas.getContext("2d");
oscilloscopeContext.lineWidth = 1;
oscilloscopeContext.imageSmoothingEnabled = false;

const frequencyGraphCanvas = document.getElementById("frequencyGraph");
const frequencyGraphContext = frequencyGraphCanvas.getContext("2d");

const spectrogramCanvas = document.getElementById("spectrogram");
const spectrogramContext = spectrogramCanvas.getContext("2d");

const heightMult = oscilloscopeCanvas.height / 255;
let hueCounter = 0;
let spectrogramX = 0;
let oscilloscopeSpeed = 0;

// Audio context and nodes
const audioContext = new AudioContext();

const audioSourceNode = audioContext.createMediaElementSource(audioPlayer);
const analyserNode = audioContext.createAnalyser();

let timeDomainBuffer = new Uint8Array(analyserNode.frequencyBinCount);
let frequencyDomainBuffer = new Uint8Array(analyserNode.frequencyBinCount);

// Connect audio nodes
audioSourceNode.connect(analyserNode).connect(audioContext.destination);

// Draw the oscilloscope
const drawOscilloscope = () => {
  oscilloscopeContext.clearRect(
    0,
    0,
    oscilloscopeCanvas.width,
    oscilloscopeCanvas.height
  );
  oscilloscopeContext.beginPath();

  const widthMult = oscilloscopeCanvas.width / analyserNode.frequencyBinCount;

  timeDomainBuffer.forEach((amplitude, index) => {
    const x = index * widthMult;
    const y = amplitude * heightMult;

    const hue =
      (index * (360 / analyserNode.frequencyBinCount) + hueCounter) % 360;
    oscilloscopeContext.strokeStyle = `hsl(${hue}, 100%, 50%)`;
    oscilloscopeContext.lineTo(x, y);
    oscilloscopeContext.stroke();
    oscilloscopeContext.beginPath();
    oscilloscopeContext.moveTo(x, y);
  });
};

// Draw Frequency Graph
const drawFrequencyGraph = () => {
  frequencyGraphContext.clearRect(
    0,
    0,
    frequencyGraphCanvas.width,
    frequencyGraphCanvas.height
  );

  const barWidth = frequencyGraphCanvas.width / analyserNode.frequencyBinCount;
  frequencyDomainBuffer.forEach((frequency, index) => {
    // Frequency Bar graph
    const barHeight = frequency * heightMult;
    const x = index * barWidth + 1;
    const y = frequencyGraphCanvas.height - barHeight;

    const hue =
      (index * (360 / analyserNode.frequencyBinCount) + hueCounter) % 360;
    const lightness = frequency * (50 / 255);

    const gradient = frequencyGraphContext.createLinearGradient(
      x - 0.5,
      0,
      x - 0.5,
      frequencyGraphCanvas.height
    );
    gradient.addColorStop(0, `hsl(${hue} , 100%, 50%)`);
    gradient.addColorStop(1, `black`);

    /*
    frequencyGraphContext.fillStyle = `hsl(${hue}, 100%, ${lightness}%)`;
    */

    frequencyGraphContext.fillStyle = gradient;
    frequencyGraphContext.fillRect(x, y, barWidth, barHeight);
  });
};

const drawSpectrogram = () => {
  const barWidth = spectrogramCanvas.width / analyserNode.frequencyBinCount;
  const barHeight = spectrogramCanvas.height / analyserNode.frequencyBinCount;
  frequencyDomainBuffer.forEach((frequency, index) => {
    const x = spectrogramX + barWidth;
    const y = index * barHeight + barHeight;

    spectrogramContext.fillStyle = `rgb(${frequency}, ${frequency}, ${frequency})`;
    spectrogramContext.fillRect(x, y, barWidth, barHeight);
  });
};

// Start drawing
(function draw() {
  if (hueCounter > 360) {
    hueCounter = 0;
  }
  if (spectrogramX > spectrogramCanvas.width) {
    spectrogramX = 0;
    spectrogramContext.clearRect(
      0,
      0,
      spectrogramCanvas.width,
      spectrogramCanvas.height
    );
  }

  analyserNode.getByteTimeDomainData(timeDomainBuffer);
  analyserNode.getByteFrequencyData(frequencyDomainBuffer);

  drawOscilloscope();
  drawFrequencyGraph();
  drawSpectrogram();

  hueCounter++;
  spectrogramX++;

  setTimeout(() => {
    requestAnimationFrame(draw);
  }, oscilloscopeSpeed);
})();

// Event listeners
fileInput.addEventListener("change", (event) => {
  uploadButton.disabled = !event.target.files[0];
});

uploadButton.addEventListener("click", () => {
  audioPlayer.src = URL.createObjectURL(fileInput.files[0]);
  uploadButton.disabled = true;
  audioPlayer.hidden = false;
  audioContext.resume();
});

fftRange.addEventListener("input", (event) => {
  const value = event.target.value;
  const fftValue = 2 ** value;

  analyserNode.fftSize = fftValue;
  timeDomainBuffer = new Uint8Array(analyserNode.frequencyBinCount);
  frequencyDomainBuffer = new Uint8Array(analyserNode.frequencyBinCount);
  fftLabel.innerHTML = fftValue;
});

oscilloscopeSpeedRange.addEventListener("input", (event) => {
  const value = event.target.value;
  oscilloscopeSpeed = value;
  oscilloscopeSpeedLabel.innerHTML = value + " ms";
});
