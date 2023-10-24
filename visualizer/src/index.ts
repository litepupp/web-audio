"use strict";

// DOM elements
const fileInput = document.getElementById("fileInput") as HTMLInputElement;
if (!navigator.maxTouchPoints) fileInput.accept = "audio/*";
const uploadButton = document.getElementById(
  "uploadButton"
) as HTMLButtonElement;

const audioPlayer = document.getElementById("audioPlayer") as HTMLAudioElement;

const fftRange = document.getElementById("fftRange") as HTMLInputElement;
const fftLabel = document.getElementById("fftLabel") as HTMLLabelElement;

const oscilloscopeCanvas = document.getElementById(
  "oscilloscope"
) as HTMLCanvasElement;
const oscilloscopeContext = oscilloscopeCanvas.getContext("2d", {
  colorSpace: "display-p3",
})!;
oscilloscopeCanvas.width = document.documentElement.clientWidth;
oscilloscopeCanvas.height = 256;
oscilloscopeContext.lineWidth = 2;
oscilloscopeContext.imageSmoothingEnabled = false;

const frequencyGraphCanvas = document.getElementById(
  "frequencyGraph"
) as HTMLCanvasElement;
const frequencyGraphContext = frequencyGraphCanvas.getContext("2d", {
  colorSpace: "display-p3",
})!;
frequencyGraphCanvas.width = 1024;
frequencyGraphCanvas.height = 256;
frequencyGraphContext.imageSmoothingEnabled = false;

const spectrogramCanvas = document.getElementById(
  "spectrogram"
) as HTMLCanvasElement;
const spectrogramContext = spectrogramCanvas.getContext("2d", {
  colorSpace: "display-p3",
})!;
spectrogramCanvas.width = document.documentElement.clientWidth;
spectrogramCanvas.height = 1024;
spectrogramContext.imageSmoothingEnabled = false;

// Audio context and nodes
const audioContext = new AudioContext();
const audioSourceNode = audioContext.createMediaElementSource(audioPlayer);
const analyserNode = audioContext.createAnalyser();
audioSourceNode.connect(analyserNode).connect(audioContext.destination);

let timeDomainBuffer = new Uint8Array(analyserNode.fftSize);
let frequencyDomainBuffer = new Uint8Array(analyserNode.fftSize);

// Draw the oscilloscope
const drawOscilloscope = () => {
  oscilloscopeContext.clearRect(
    0,
    0,
    oscilloscopeCanvas.width,
    oscilloscopeCanvas.height
  );
  oscilloscopeContext.beginPath();

  timeDomainBuffer.forEach((amplitude, index) => {
    oscilloscopeContext.strokeStyle = `hsl(89, 100%, 50%)`;
    oscilloscopeContext.lineTo(index, amplitude);
    oscilloscopeContext.stroke();
    oscilloscopeContext.beginPath();
    oscilloscopeContext.moveTo(index, amplitude);
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

  frequencyDomainBuffer.forEach((frequency, index) => {
    /*
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

    
    frequencyGraphContext.fillStyle = `hsl(${hue}, 100%, ${lightness}%)`;
    */

    const hue = index * (360 / analyserNode.frequencyBinCount);
    const lightness = frequency * (50 / 255);
    frequencyGraphContext.fillStyle = `hsl(${hue}, 100%, ${lightness}%)`;
    frequencyGraphContext.fillRect(index, 256 - frequency, 1, frequency);
  });
};

// Draw Spectrogram
const drawSpectrogram = () => {
  spectrogramContext.drawImage(spectrogramCanvas, -1, 0);
  frequencyDomainBuffer.forEach((frequency, index) => {
    spectrogramContext.fillStyle = `rgb(${frequency}, ${frequency}, ${frequency})`;
    spectrogramContext.fillRect(
      spectrogramCanvas.width - 1,
      spectrogramCanvas.height - index - 1,
      1,
      1
    );
  });
};

// Start drawing
(function draw() {
  /*
  if (hueCounter > 360) {
    hueCounter = 0;
  }
  */

  analyserNode.getByteTimeDomainData(timeDomainBuffer);
  analyserNode.getByteFrequencyData(frequencyDomainBuffer);

  // drawOscilloscope();
  drawFrequencyGraph();
  drawSpectrogram();

  // hueCounter++;

  requestAnimationFrame(draw);
})();

// Event listeners
fileInput.addEventListener("change", (event) => {
  if (event.target instanceof HTMLInputElement) {
    uploadButton.disabled = !event.target.files!.length;
  }
});

uploadButton.addEventListener("click", () => {
  audioPlayer.src = URL.createObjectURL(fileInput.files![0]);
  uploadButton.disabled = true;
  audioPlayer.hidden = false;
  audioContext.resume();
});

fftRange.addEventListener("input", (event) => {
  if (event.target instanceof HTMLInputElement) {
    const value = Number(event.target.value);
    const fftValue = 2 ** value;

    analyserNode.fftSize = fftValue;
    timeDomainBuffer = new Uint8Array(fftValue);
    frequencyDomainBuffer = new Uint8Array(analyserNode.frequencyBinCount);
    fftLabel.innerHTML = `${fftValue}`;

    frequencyGraphCanvas.width = analyserNode.frequencyBinCount;
    spectrogramCanvas.height = analyserNode.frequencyBinCount;
  }
});
