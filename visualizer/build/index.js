"use strict";
// DOM elements
var fileInput = document.getElementById("fileInput");
if (!navigator.maxTouchPoints)
    fileInput.accept = "audio/*";
var uploadButton = document.getElementById("uploadButton");
var audioPlayer = document.getElementById("audioPlayer");
var fftRange = document.getElementById("fftRange");
var fftLabel = document.getElementById("fftLabel");
var oscilloscopeCanvas = document.getElementById("oscilloscope");
var oscilloscopeContext = oscilloscopeCanvas.getContext("2d", {
    colorSpace: "display-p3",
});
oscilloscopeCanvas.width = document.documentElement.clientWidth;
oscilloscopeCanvas.height = 256;
oscilloscopeContext.lineWidth = 2;
oscilloscopeContext.imageSmoothingEnabled = false;
var frequencyGraphCanvas = document.getElementById("frequencyGraph");
var frequencyGraphContext = frequencyGraphCanvas.getContext("2d", {
    colorSpace: "display-p3",
});
frequencyGraphCanvas.width = 1024;
frequencyGraphCanvas.height = 256;
frequencyGraphContext.imageSmoothingEnabled = false;
var spectrogramCanvas = document.getElementById("spectrogram");
var spectrogramContext = spectrogramCanvas.getContext("2d", {
    colorSpace: "display-p3",
});
spectrogramCanvas.width = document.documentElement.clientWidth;
spectrogramCanvas.height = 1024;
spectrogramContext.imageSmoothingEnabled = false;
// Audio context and nodes
var audioContext = new AudioContext();
var audioSourceNode = audioContext.createMediaElementSource(audioPlayer);
var analyserNode = audioContext.createAnalyser();
audioSourceNode.connect(analyserNode).connect(audioContext.destination);
var timeDomainBuffer = new Uint8Array(analyserNode.fftSize);
var frequencyDomainBuffer = new Uint8Array(analyserNode.fftSize);
// Draw the oscilloscope
var drawOscilloscope = function () {
    oscilloscopeContext.clearRect(0, 0, oscilloscopeCanvas.width, oscilloscopeCanvas.height);
    oscilloscopeContext.beginPath();
    timeDomainBuffer.forEach(function (amplitude, index) {
        oscilloscopeContext.strokeStyle = "hsl(89, 100%, 50%)";
        oscilloscopeContext.lineTo(index, amplitude);
        oscilloscopeContext.stroke();
        oscilloscopeContext.beginPath();
        oscilloscopeContext.moveTo(index, amplitude);
    });
};
// Draw Frequency Graph
var drawFrequencyGraph = function () {
    frequencyGraphContext.clearRect(0, 0, frequencyGraphCanvas.width, frequencyGraphCanvas.height);
    frequencyDomainBuffer.forEach(function (frequency, index) {
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
        var hue = index * (360 / analyserNode.frequencyBinCount);
        var lightness = frequency * (50 / 255);
        frequencyGraphContext.fillStyle = "hsl(".concat(hue, ", 100%, ").concat(lightness, "%)");
        frequencyGraphContext.fillRect(index, 256 - frequency, 1, frequency);
    });
};
// Draw Spectrogram
var drawSpectrogram = function () {
    spectrogramContext.drawImage(spectrogramCanvas, -1, 0);
    frequencyDomainBuffer.forEach(function (frequency, index) {
        spectrogramContext.fillStyle = "rgb(".concat(frequency, ", ").concat(frequency, ", ").concat(frequency, ")");
        spectrogramContext.fillRect(spectrogramCanvas.width - 1, spectrogramCanvas.height - index - 1, 1, 1);
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
fileInput.addEventListener("change", function (event) {
    if (event.target instanceof HTMLInputElement) {
        uploadButton.disabled = !event.target.files.length;
    }
});
uploadButton.addEventListener("click", function () {
    audioPlayer.src = URL.createObjectURL(fileInput.files[0]);
    uploadButton.disabled = true;
    audioPlayer.hidden = false;
    audioContext.resume();
});
fftRange.addEventListener("input", function (event) {
    if (event.target instanceof HTMLInputElement) {
        var value = Number(event.target.value);
        var fftValue = Math.pow(2, value);
        analyserNode.fftSize = fftValue;
        timeDomainBuffer = new Uint8Array(fftValue);
        frequencyDomainBuffer = new Uint8Array(analyserNode.frequencyBinCount);
        fftLabel.innerHTML = "".concat(fftValue);
        frequencyGraphCanvas.width = analyserNode.frequencyBinCount;
        spectrogramCanvas.height = analyserNode.frequencyBinCount;
    }
});
