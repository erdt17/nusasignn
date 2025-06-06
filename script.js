let model;
let video = document.getElementById("video");
let output = document.getElementById("output");

// Load TFJS model
async function loadModel() {
  model = await tf.loadLayersModel("model/model.json");
}
loadModel();

// Mulai kamera
navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
  video.srcObject = stream;
});

// Mediapipe hands
const hands = new Hands({
  locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
});
hands.setOptions({
  maxNumHands: 1,
  modelComplexity: 1,
  minDetectionConfidence: 0.8,
  minTrackingConfidence: 0.8,
});
hands.onResults(onResults);

const camera = new Camera(video, {
  onFrame: async () => {
    await hands.send({ image: video });
  },
  width: 640,
  height: 480,
});
camera.start();

// Prediksi huruf
function onResults(results) {
  if (results.multiHandLandmarks && model) {
    let keypoints = results.multiHandLandmarks[0]
      .map(p => [p.x, p.y, p.z])
      .flat();
    let tensor = tf.tensor([keypoints]);
    let prediction = model.predict(tensor);
    let index = prediction.argMax(1).dataSync()[0];
    let char = String.fromCharCode(65 + index); // A-Z
    output.innerText = `Huruf: ${char}`;
  } else {
    output.innerText = "Mendeteksi...";
  }
}

// Bookmark
let saved = [];
document.getElementById("bookmarkBtn").onclick = () => {
  saved.push(output.innerText.replace("Huruf: ", ""));
  alert("Disimpan: " + saved.join(""));
};

// Translate Sunda ↔ Indonesia
document.getElementById("translateBtn").onclick = async () => {
  const input = document.getElementById("translateInput").value;
  const langPair = document.getElementById("lang").value;
  const [source, target] = langPair.split("-");

  const res = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=${source}&tl=${target}&dt=t&q=${encodeURI(input)}`);
  const data = await res.json();
  document.getElementById("translateOutput").innerText = data[0][0][0];
};
