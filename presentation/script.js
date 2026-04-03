const orbitalCanvas = document.getElementById("orbitalCanvas");
const orbitalCtx = orbitalCanvas.getContext("2d");
const digitMapCanvas = document.getElementById("digitMapCanvas");
const digitMapCtx = digitMapCanvas.getContext("2d");
const drawCanvas = document.getElementById("drawCanvas");
const drawCtx = drawCanvas.getContext("2d");

const linearBtn = document.getElementById("linearBtn");
const nonLinearBtn = document.getElementById("nonLinearBtn");
const resetLineBtn = document.getElementById("resetLineBtn");
const resetCurveBtn = document.getElementById("resetCurveBtn");
const orbitalInstruction = document.getElementById("orbitalInstruction");
const orbitalMessage = document.getElementById("orbitalMessage");
const linearScoreNode = document.getElementById("linearScore");
const nonLinearScoreNode = document.getElementById("nonLinearScore");

const clearBtn = document.getElementById("clearBtn");
const sampleBtn = document.getElementById("sampleBtn");
const stampGrid = document.getElementById("stampGrid");
const modelStatusNode = document.getElementById("modelStatus");
const modelNameNode = document.getElementById("modelName");
const modelAccuracyNode = document.getElementById("modelAccuracy");
const trainingSamplesNode = document.getElementById("trainingSamples");
const topGuessNode = document.getElementById("topGuess");
const topConfidenceNode = document.getElementById("topConfidence");
const filledPixelsNode = document.getElementById("filledPixels");
const probabilityList = document.getElementById("probabilityList");
const lensCanvas = document.getElementById("lensCanvas");
const lensCtx = lensCanvas.getContext("2d");
const lensTitleNode = document.getElementById("lensTitle");
const lensCopyNode = document.getElementById("lensCopy");
const lensStatLabel1Node = document.getElementById("lensStatLabel1");
const lensStatLabel2Node = document.getElementById("lensStatLabel2");
const lensStatLabel3Node = document.getElementById("lensStatLabel3");
const lensStatValue1Node = document.getElementById("lensStatValue1");
const lensStatValue2Node = document.getElementById("lensStatValue2");
const lensStatValue3Node = document.getElementById("lensStatValue3");
const lensButtons = Array.from(document.querySelectorAll(".lens-btn"));

const trainingChartCanvas = document.getElementById("trainingChartCanvas");
const trainingChartCtx = trainingChartCanvas.getContext("2d");
const epochSlider = document.getElementById("epochSlider");
const epochValueNode = document.getElementById("epochValue");
const epochStageTitleNode = document.getElementById("epochStageTitle");
const epochStageCopyNode = document.getElementById("epochStageCopy");
const lossValueNode = document.getElementById("lossValue");
const validationValueNode = document.getElementById("validationValue");
const parameterCountNode = document.getElementById("parameterCount");
const trainingIdeaNode = document.getElementById("trainingIdea");
const pipelineSteps = Array.from(document.querySelectorAll(".pipeline-step"));

const historyCanvas = document.getElementById("historyCanvas");
const historyCtx = historyCanvas.getContext("2d");
const historyButtons = Array.from(document.querySelectorAll(".history-btn"));
const historyTitleNode = document.getElementById("historyTitle");
const historyCopyNode = document.getElementById("historyCopy");
const historyMetricLabel1Node = document.getElementById("historyMetricLabel1");
const historyMetricLabel2Node = document.getElementById("historyMetricLabel2");
const historyMetricLabel3Node = document.getElementById("historyMetricLabel3");
const historyMetricValue1Node = document.getElementById("historyMetricValue1");
const historyMetricValue2Node = document.getElementById("historyMetricValue2");
const historyMetricValue3Node = document.getElementById("historyMetricValue3");

const sceneButtons = Array.from(document.querySelectorAll(".scene-btn"));
const sceneProgressBar = document.getElementById("sceneProgressBar");
const sceneTimeNode = document.getElementById("sceneTime");
const sceneTitleNode = document.getElementById("sceneTitle");
const sceneGoalNode = document.getElementById("sceneGoal");
const sceneOnScreenNode = document.getElementById("sceneOnScreen");
const sceneSayNode = document.getElementById("sceneSay");
const sceneWhyNode = document.getElementById("sceneWhy");

const palette = {
  grid: "rgba(255,255,255,0.07)",
  safe: "#63d2c6",
  danger: "#ff6978",
  line: "#ffd166",
  text: "#f4efe1",
  muted: "#adc2d1",
  stroke: "#ff9b54",
};

const lensModes = {
  geometry: {
    title: "Geometry: the network sculpts regions in space",
    copy:
      "Use this when you want the room to stop thinking about digits as pictures and start thinking about them as points that must land inside the right territory.",
    stats: [
      ["Hook", "A digit is a point in space"],
      ["Angle", "Boundary carving"],
      ["Why it feels fresh", "Same topic, unusual framing"],
    ],
  },
  dataset: {
    title: "Dataset: MNIST as the shared arena of the field",
    copy:
      "Use this when you want to emphasize why MNIST mattered practically: small, clear, comparable, and fast enough to let people iterate.",
    stats: [
      ["Hook", "60,000 train + 10,000 test"],
      ["Angle", "Shared benchmark"],
      ["Why it feels fresh", "Turns history into a playable system"],
    ],
  },
  history: {
    title: "History: the benchmark that became the launchpad",
    copy:
      "Use this when the audience responds to stories of how a simple benchmark changed teaching, experimentation, and the pace of model improvement.",
    stats: [
      ["Hook", "Small problem, huge impact"],
      ["Angle", "Field-building tool"],
      ["Why it feels fresh", "MNIST becomes a character, not a definition"],
    ],
  },
};

const historyModes = {
  benchmark: {
    title: "A common ruler",
    copy:
      "MNIST gave everyone the same problem, the same train-test split, and a clean scoreboard. That let researchers compare models without moving goalposts.",
    metrics: [
      ["What it fixed", "Unclear comparisons"],
      ["What MNIST gave", "One scoreboard"],
      ["Why it matters", "Fair progress"],
    ],
  },
  feedback: {
    title: "Fast feedback loops",
    copy:
      "Because the images are only 28x28 grayscale digits, training is light enough for quick experiments. That makes hyperparameters, epochs, and architecture choices teachable.",
    metrics: [
      ["Image size", "28 x 28"],
      ["Loop speed", "Minutes, not days"],
      ["Classroom value", "Rapid iteration"],
    ],
  },
  visibility: {
    title: "Visible learning",
    copy:
      "Anyone can inspect an input and understand the task immediately. If the model fails, the mistake is concrete, visual, and easy to discuss in class.",
    metrics: [
      ["Classes", "10 digits"],
      ["Human-readable", "Instantly"],
      ["Debugging value", "Mistakes are visible"],
    ],
  },
  gateway: {
    title: "The hello-world effect",
    copy:
      "MNIST became the entry point where theory, code, and intuition finally meet. It is simple enough to start with, yet rich enough to teach real training behavior.",
    metrics: [
      ["Entry barrier", "Low"],
      ["Skill transfer", "High"],
      ["Legacy", "Deep learning on-ramp"],
    ],
  },
};

const sceneData = [
  {
    time: "0:00 - 1:00",
    title: "Hook the room with the geometry framing",
    goal:
      "Start from the surprising claim that MNIST matters because it taught models how to carve space, not because digits are the hardest visual task.",
    onScreen: "Hero plus the lens selector. Pick Geometry Lens before you even touch the colony map.",
    say:
      '"MNIST is the first arena where we can watch a model carve a messy world into clean regions."',
    why: "It reframes both required topics in one sentence and immediately sounds different from a normal recap.",
  },
  {
    time: "1:00 - 3:00",
    title: "Let the straight rule fail in public",
    goal:
      "Use the colony map to make the limitation of a single linear separator visible, then manually bend the border with the hidden-layer mode.",
    onScreen: "Act I. Drag the straight line first. Then draw a closed curve in hidden-layer mode.",
    say:
      '"One weighted sum gives us one flat cut. The moment the world has islands, one line is no longer enough."',
    why: "The class sees solution space change with their own eyes instead of hearing a definition.",
  },
  {
    time: "3:00 - 5:30",
    title: "Scale the idea up to real MNIST",
    goal:
      "Move from 2D intuition to 784 dimensions and show that the digit canvas is the same story, just on a much larger coordinate system.",
    onScreen: "Act II. Load a real MNIST sample, then draw your own digit and watch the probabilities shift.",
    say:
      '"Every 28 by 28 image becomes one point in a 784-dimensional world, and the network has to push it into the correct digit territory."',
    why: "You connect the toy visualization to the real benchmark without losing the audience.",
  },
  {
    time: "5:30 - 7:30",
    title: "Show the procedure, not just the result",
    goal:
      "Use the training observatory to scrub through epochs and explain how loss goes down, validation improves, and repeated updates shape the decision function.",
    onScreen: "Act III. Drag the epoch slider and point to the pipeline strip and the real loss and validation curves.",
    say:
      '"Training is repeated geometry editing: forward pass, compare to truth, update the weights, repeat."',
    why: "This is the missing procedural layer that makes the presentation feel engineered rather than decorative.",
  },
  {
    time: "7:30 - 10:00",
    title: "Close with why MNIST mattered historically",
    goal:
      "Land the benchmark story and finish with significance: shared ruler, fast feedback, visible task, and the hello-world effect.",
    onScreen: "Act IV. Click through the four MNIST launchpad modes and then show this rehearsal console if you want a crisp ending.",
    say:
      '"MNIST won because it was small enough to enter, clear enough to trust, and useful enough to accelerate the whole field."',
    why: "You end on importance and historical perspective instead of just mechanics.",
  },
];

const orbitalSamples = [
  { x: 0.18, y: 0.16, label: "danger" },
  { x: 0.31, y: 0.12, label: "danger" },
  { x: 0.5, y: 0.08, label: "danger" },
  { x: 0.72, y: 0.16, label: "danger" },
  { x: 0.86, y: 0.3, label: "danger" },
  { x: 0.82, y: 0.54, label: "danger" },
  { x: 0.72, y: 0.76, label: "danger" },
  { x: 0.52, y: 0.86, label: "danger" },
  { x: 0.28, y: 0.8, label: "danger" },
  { x: 0.15, y: 0.62, label: "danger" },
  { x: 0.22, y: 0.38, label: "safe" },
  { x: 0.34, y: 0.32, label: "safe" },
  { x: 0.51, y: 0.28, label: "safe" },
  { x: 0.64, y: 0.37, label: "safe" },
  { x: 0.61, y: 0.55, label: "safe" },
  { x: 0.49, y: 0.64, label: "safe" },
  { x: 0.33, y: 0.58, label: "safe" },
  { x: 0.41, y: 0.46, label: "safe" },
];

const digitAnchors = [
  { x: 0.18, y: 0.24, hue: "#7ec8ff" },
  { x: 0.33, y: 0.15, hue: "#63d2c6" },
  { x: 0.5, y: 0.12, hue: "#ffd166" },
  { x: 0.7, y: 0.16, hue: "#ff9b54" },
  { x: 0.84, y: 0.3, hue: "#ff6978" },
  { x: 0.83, y: 0.56, hue: "#f4a261" },
  { x: 0.68, y: 0.76, hue: "#8bd3dd" },
  { x: 0.48, y: 0.84, hue: "#b8de6f" },
  { x: 0.26, y: 0.72, hue: "#ffb4a2" },
  { x: 0.14, y: 0.49, hue: "#cdb4db" },
];

const drawState = {
  pixels: new Float32Array(28 * 28),
  isDrawing: false,
  lastCell: null,
};

let currentLens = "geometry";
let currentHistoryMode = "benchmark";
let currentSceneIndex = 0;

const prepSourceCanvas = document.createElement("canvas");
const prepScaledCanvas = document.createElement("canvas");
const prepFinalCanvas = document.createElement("canvas");
[prepSourceCanvas, prepScaledCanvas, prepFinalCanvas].forEach((canvas) => {
  canvas.width = 28;
  canvas.height = 28;
});
const prepSourceCtx = prepSourceCanvas.getContext("2d");
const prepScaledCtx = prepScaledCanvas.getContext("2d");
const prepFinalCtx = prepFinalCanvas.getContext("2d");

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function distance(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function softmax(values) {
  let max = -Infinity;
  for (let i = 0; i < values.length; i += 1) {
    if (values[i] > max) {
      max = values[i];
    }
  }

  const exps = new Float32Array(values.length);
  let total = 0;
  for (let i = 0; i < values.length; i += 1) {
    const value = Math.exp(values[i] - max);
    exps[i] = value;
    total += value;
  }

  return Array.from(exps, (value) => value / total);
}

function drawStarfield(ctx, width, height) {
  ctx.clearRect(0, 0, width, height);

  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, "#0d1b27");
  gradient.addColorStop(1, "#08131d");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = palette.grid;
  ctx.lineWidth = 1;
  for (let x = 28; x < width; x += 42) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 24; y < height; y += 42) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  for (let i = 0; i < 70; i += 1) {
    const x = (i * 73) % width;
    const y = (i * 41) % height;
    const alpha = 0.12 + ((i % 5) * 0.08);
    ctx.fillStyle = `rgba(255,255,255,${alpha})`;
    ctx.fillRect(x, y, 2, 2);
  }
}

function drawPanelBackdrop(ctx, width, height) {
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, "#0d1b27");
  gradient.addColorStop(1, "#08131d");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = "rgba(255,255,255,0.05)";
  ctx.lineWidth = 1;
  for (let x = 24; x < width; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 24; y < height; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
}

function drawBadge(ctx, x, y, radius, color, text) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = palette.text;
  ctx.font = '700 16px "Trebuchet MS", sans-serif';
  ctx.fillText(text, x - 6, y + 5);
}

function drawLensScene(mode) {
  const { width, height } = lensCanvas;
  drawPanelBackdrop(lensCtx, width, height);

  lensCtx.fillStyle = palette.text;
  lensCtx.font = '16px "Trebuchet MS", sans-serif';

  if (mode === "geometry") {
    lensCtx.fillText("Same digits, different regions", 26, 34);

    lensCtx.fillStyle = "rgba(99, 210, 198, 0.10)";
    lensCtx.beginPath();
    lensCtx.ellipse(210, 136, 120, 70, -0.25, 0, Math.PI * 2);
    lensCtx.fill();

    lensCtx.strokeStyle = palette.line;
    lensCtx.lineWidth = 3;
    lensCtx.beginPath();
    lensCtx.moveTo(100, 200);
    lensCtx.bezierCurveTo(170, 40, 285, 40, 330, 190);
    lensCtx.stroke();

    [
      [145, 96, "2", palette.safe],
      [196, 118, "8", palette.safe],
      [244, 148, "6", palette.safe],
      [418, 74, "1", palette.danger],
      [518, 118, "7", palette.danger],
      [470, 196, "4", palette.danger],
    ].forEach(([x, y, label, color]) => drawBadge(lensCtx, x, y, 18, color, label));

    lensCtx.fillStyle = palette.muted;
    lensCtx.fillText("A network changes the shape of the border", 380, 218);
  }

  if (mode === "dataset") {
    lensCtx.fillText("MNIST as a benchmark arena", 26, 34);

    const cards = [
      { x: 80, y: 60, color: "#63d2c6", label: "Train 60k" },
      { x: 280, y: 50, color: "#ffd166", label: "Test 10k" },
      { x: 500, y: 72, color: "#ff9b54", label: "10 classes" },
    ];

    cards.forEach((card) => {
      lensCtx.fillStyle = `${card.color}22`;
      lensCtx.strokeStyle = card.color;
      lensCtx.lineWidth = 2;
      lensCtx.beginPath();
      lensCtx.roundRect(card.x, card.y, 130, 86, 18);
      lensCtx.fill();
      lensCtx.stroke();
      lensCtx.fillStyle = palette.text;
      lensCtx.font = '700 18px "Trebuchet MS", sans-serif';
      lensCtx.fillText(card.label, card.x + 18, card.y + 48);
    });

    lensCtx.strokeStyle = palette.line;
    lensCtx.lineWidth = 3;
    lensCtx.beginPath();
    lensCtx.moveTo(110, 188);
    lensCtx.lineTo(590, 188);
    lensCtx.stroke();

    for (let i = 0; i < 10; i += 1) {
      drawBadge(lensCtx, 120 + i * 48, 188, 14, digitAnchors[i].hue, String(i));
    }
  }

  if (mode === "history") {
    lensCtx.fillText("MNIST as a launchpad", 26, 34);

    lensCtx.strokeStyle = palette.line;
    lensCtx.lineWidth = 2.5;
    lensCtx.beginPath();
    lensCtx.moveTo(70, 200);
    lensCtx.lineTo(620, 200);
    lensCtx.stroke();

    const stages = [
      { x: 120, y: 160, label: "Idea", color: "#7ec8ff" },
      { x: 260, y: 130, label: "Benchmark", color: "#63d2c6" },
      { x: 410, y: 90, label: "Classroom", color: "#ffd166" },
      { x: 560, y: 48, label: "Field", color: "#ff9b54" },
    ];

    stages.forEach((stage) => {
      lensCtx.fillStyle = `${stage.color}22`;
      lensCtx.strokeStyle = stage.color;
      lensCtx.beginPath();
      lensCtx.arc(stage.x, stage.y, 32, 0, Math.PI * 2);
      lensCtx.fill();
      lensCtx.stroke();
      lensCtx.fillStyle = palette.text;
      lensCtx.font = '700 14px "Trebuchet MS", sans-serif';
      lensCtx.fillText(stage.label, stage.x - 22, stage.y + 5);
    });

    lensCtx.fillStyle = palette.muted;
    lensCtx.font = '16px "Trebuchet MS", sans-serif';
    lensCtx.fillText("A small benchmark becomes a staircase for a whole discipline", 170, 232);
  }
}

function setLens(mode) {
  currentLens = mode;
  const content = lensModes[mode];
  lensTitleNode.textContent = content.title;
  lensCopyNode.textContent = content.copy;
  lensStatLabel1Node.textContent = content.stats[0][0];
  lensStatLabel2Node.textContent = content.stats[1][0];
  lensStatLabel3Node.textContent = content.stats[2][0];
  lensStatValue1Node.textContent = content.stats[0][1];
  lensStatValue2Node.textContent = content.stats[1][1];
  lensStatValue3Node.textContent = content.stats[2][1];
  lensButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.lens === mode);
  });
  drawLensScene(mode);
}

function getTrainingStage(epochIndex, totalEpochs) {
  const ratio = totalEpochs <= 1 ? 1 : epochIndex / (totalEpochs - 1);
  if (ratio < 0.2) {
    return {
      activeSteps: ["load", "forward", "loss"],
      title: "The model is still guessing wildly",
      copy:
        "At the beginning, the network is almost random. Each pass mostly teaches it what obviously wrong looks like.",
      idea: "From chaos to a first signal",
    };
  }
  if (ratio < 0.55) {
    return {
      activeSteps: ["forward", "loss", "update"],
      title: "Weights are moving toward useful features",
      copy:
        "Now the updates start to matter: stroke thickness, loops, slants, and other patterns become more informative inside the hidden layers.",
      idea: "Useful features emerge",
    };
  }
  if (ratio < 0.85) {
    return {
      activeSteps: ["loss", "update", "repeat"],
      title: "The model is refining instead of discovering",
      copy:
        "Loss still drops, but more slowly. The network is polishing boundaries rather than inventing them from scratch.",
      idea: "Refinement and calibration",
    };
  }
  return {
    activeSteps: ["update", "repeat"],
    title: "The model is close to its generalization ceiling",
    copy:
      "Late training is about squeezing out the last gains without drifting into overfitting. Validation becomes the decision signal.",
    idea: "Generalize, do not memorize",
  };
}

function drawTrainingChart(epochIndex) {
  const lossCurve = mnistState?.meta.lossCurve || [1];
  const validationCurve = mnistState?.meta.validationCurve || [0];
  const { width, height } = trainingChartCanvas;
  drawPanelBackdrop(trainingChartCtx, width, height);

  const plot = { x: 62, y: 26, width: width - 100, height: height - 76 };
  trainingChartCtx.fillStyle = "rgba(126, 200, 255, 0.07)";
  trainingChartCtx.fillRect(plot.x, plot.y, plot.width, plot.height);

  const lossMin = Math.min(...lossCurve);
  const lossMax = Math.max(...lossCurve);
  const valMin = Math.min(...validationCurve);
  const valMax = Math.max(...validationCurve);

  trainingChartCtx.strokeStyle = "rgba(255,255,255,0.08)";
  for (let i = 0; i <= 4; i += 1) {
    const y = plot.y + (plot.height / 4) * i;
    trainingChartCtx.beginPath();
    trainingChartCtx.moveTo(plot.x, y);
    trainingChartCtx.lineTo(plot.x + plot.width, y);
    trainingChartCtx.stroke();
  }

  function pointForLoss(index) {
    const x = plot.x + (plot.width * index) / Math.max(lossCurve.length - 1, 1);
    const t = (lossCurve[index] - lossMin) / Math.max(lossMax - lossMin, 1e-9);
    const y = plot.y + t * plot.height;
    return { x, y };
  }

  function pointForVal(index) {
    const x = plot.x + (plot.width * index) / Math.max(validationCurve.length - 1, 1);
    const t = (validationCurve[index] - valMin) / Math.max(valMax - valMin, 1e-9);
    const y = plot.y + (1 - t) * plot.height;
    return { x, y };
  }

  trainingChartCtx.lineWidth = 3;
  trainingChartCtx.strokeStyle = palette.stroke;
  trainingChartCtx.beginPath();
  lossCurve.forEach((_, index) => {
    const point = pointForLoss(index);
    if (index === 0) {
      trainingChartCtx.moveTo(point.x, point.y);
    } else {
      trainingChartCtx.lineTo(point.x, point.y);
    }
  });
  trainingChartCtx.stroke();

  trainingChartCtx.strokeStyle = palette.safe;
  trainingChartCtx.beginPath();
  validationCurve.forEach((_, index) => {
    const point = pointForVal(index);
    if (index === 0) {
      trainingChartCtx.moveTo(point.x, point.y);
    } else {
      trainingChartCtx.lineTo(point.x, point.y);
    }
  });
  trainingChartCtx.stroke();

  const currentLossPoint = pointForLoss(epochIndex);
  const currentValPoint = pointForVal(epochIndex);

  trainingChartCtx.strokeStyle = palette.line;
  trainingChartCtx.setLineDash([8, 8]);
  trainingChartCtx.beginPath();
  trainingChartCtx.moveTo(currentLossPoint.x, plot.y);
  trainingChartCtx.lineTo(currentLossPoint.x, plot.y + plot.height);
  trainingChartCtx.stroke();
  trainingChartCtx.setLineDash([]);

  [currentLossPoint, currentValPoint].forEach((point, index) => {
    trainingChartCtx.fillStyle = index === 0 ? palette.stroke : palette.safe;
    trainingChartCtx.beginPath();
    trainingChartCtx.arc(point.x, point.y, 6, 0, Math.PI * 2);
    trainingChartCtx.fill();
    trainingChartCtx.strokeStyle = "rgba(255,255,255,0.55)";
    trainingChartCtx.lineWidth = 2;
    trainingChartCtx.stroke();
  });

  trainingChartCtx.fillStyle = palette.text;
  trainingChartCtx.font = '14px "Trebuchet MS", sans-serif';
  trainingChartCtx.fillText("Loss", plot.x, plot.y - 8);
  trainingChartCtx.fillText("Validation", plot.x + 64, plot.y - 8);
  trainingChartCtx.fillStyle = palette.stroke;
  trainingChartCtx.fillRect(plot.x + 34, plot.y - 17, 20, 4);
  trainingChartCtx.fillStyle = palette.safe;
  trainingChartCtx.fillRect(plot.x + 126, plot.y - 17, 20, 4);
}

function updateTrainingUi(epochIndex = 0) {
  if (!mnistState) {
    epochValueNode.textContent = "No model";
    return;
  }

  const totalEpochs = mnistState.meta.lossCurve.length;
  const stage = getTrainingStage(epochIndex, totalEpochs);
  const loss = mnistState.meta.lossCurve[epochIndex];
  const validation = mnistState.meta.validationCurve[epochIndex];

  epochValueNode.textContent = `Epoch ${epochIndex + 1}`;
  epochStageTitleNode.textContent = stage.title;
  epochStageCopyNode.textContent = stage.copy;
  lossValueNode.textContent = loss.toFixed(3);
  validationValueNode.textContent = `${(validation * 100).toFixed(1)}%`;
  parameterCountNode.textContent = mnistState.meta.parameterCount.toLocaleString();
  trainingIdeaNode.textContent = stage.idea;

  pipelineSteps.forEach((step) => {
    step.classList.toggle("active", stage.activeSteps.includes(step.dataset.step));
  });

  drawTrainingChart(epochIndex);
}

function drawHistoryScene(mode) {
  const { width, height } = historyCanvas;
  drawPanelBackdrop(historyCtx, width, height);

  historyCtx.fillStyle = palette.text;
  historyCtx.font = '16px "Trebuchet MS", sans-serif';

  if (mode === "benchmark") {
    historyCtx.fillText("One benchmark, many competitors", 26, 34);
    historyCtx.strokeStyle = palette.line;
    historyCtx.lineWidth = 3;
    historyCtx.beginPath();
    historyCtx.moveTo(120, 230);
    historyCtx.lineTo(120, 80);
    historyCtx.lineTo(126, 80);
    historyCtx.stroke();

    for (let i = 0; i < 6; i += 1) {
      const y = 220 - i * 24;
      historyCtx.strokeStyle = "rgba(255,255,255,0.18)";
      historyCtx.beginPath();
      historyCtx.moveTo(120, y);
      historyCtx.lineTo(140, y);
      historyCtx.stroke();
    }

    const bars = [
      ["Model A", 0.82, "#7ec8ff"],
      ["Model B", 0.9, "#63d2c6"],
      ["Model C", 0.95, "#ffd166"],
      ["Model D", 0.977, "#ff9b54"],
    ];
    bars.forEach(([label, score, color], index) => {
      const x = 180;
      const y = 72 + index * 54;
      historyCtx.fillStyle = "rgba(255,255,255,0.04)";
      historyCtx.fillRect(x, y, 360, 24);
      historyCtx.fillStyle = color;
      historyCtx.fillRect(x, y, 360 * score, 24);
      historyCtx.fillStyle = palette.text;
      historyCtx.fillText(label, x + 10, y + 17);
      historyCtx.fillText(`${Math.round(score * 100)}%`, x + 372, y + 17);
    });
  }

  if (mode === "feedback") {
    historyCtx.fillText("Fast enough to experiment repeatedly", 26, 34);
    historyCtx.strokeStyle = palette.safe;
    historyCtx.lineWidth = 8;
    historyCtx.beginPath();
    historyCtx.arc(220, 155, 74, -Math.PI * 0.75, Math.PI * 1.1);
    historyCtx.stroke();
    historyCtx.strokeStyle = palette.line;
    historyCtx.beginPath();
    historyCtx.arc(220, 155, 48, -Math.PI * 0.45, Math.PI * 1.25);
    historyCtx.stroke();
    historyCtx.fillStyle = palette.text;
    historyCtx.font = '700 34px "Palatino Linotype", Georgia, serif';
    historyCtx.fillText("28x28", 177, 166);
    historyCtx.font = '16px "Trebuchet MS", sans-serif';
    historyCtx.fillText("small input size means short iteration loops", 148, 206);

    ["tune", "train", "test", "repeat"].forEach((label, index) => {
      const x = 430 + index * 74;
      const y = 154 + Math.sin(index * 0.9) * 30;
      historyCtx.fillStyle = `${digitAnchors[index + 1].hue}22`;
      historyCtx.strokeStyle = digitAnchors[index + 1].hue;
      historyCtx.beginPath();
      historyCtx.roundRect(x, y, 70, 36, 12);
      historyCtx.fill();
      historyCtx.stroke();
      historyCtx.fillStyle = palette.text;
      historyCtx.fillText(label, x + 15, y + 23);
    });
  }

  if (mode === "visibility") {
    historyCtx.fillText("The task is instantly human-readable", 26, 34);
    historyCtx.strokeStyle = "rgba(255,255,255,0.12)";
    for (let row = 0; row < 12; row += 1) {
      for (let col = 0; col < 12; col += 1) {
        historyCtx.strokeRect(120 + col * 18, 70 + row * 18, 18, 18);
      }
    }
    historyCtx.strokeStyle = palette.line;
    historyCtx.lineWidth = 8;
    historyCtx.beginPath();
    historyCtx.moveTo(180, 100);
    historyCtx.quadraticCurveTo(240, 55, 290, 100);
    historyCtx.quadraticCurveTo(290, 130, 230, 156);
    historyCtx.lineTo(170, 206);
    historyCtx.lineTo(294, 206);
    historyCtx.stroke();

    historyCtx.strokeStyle = palette.safe;
    historyCtx.lineWidth = 4;
    historyCtx.beginPath();
    historyCtx.arc(500, 150, 54, 0, Math.PI * 2);
    historyCtx.stroke();
    historyCtx.beginPath();
    historyCtx.moveTo(540, 190);
    historyCtx.lineTo(586, 236);
    historyCtx.stroke();
    historyCtx.fillStyle = palette.text;
    historyCtx.fillText("A person can tell what went wrong", 424, 250);
  }

  if (mode === "gateway") {
    historyCtx.fillText("MNIST became the runway into deep learning", 26, 34);
    const path = [
      { x: 110, y: 210, label: "curious student" },
      { x: 280, y: 170, label: "first model" },
      { x: 450, y: 120, label: "better experiments" },
      { x: 610, y: 54, label: "research direction" },
    ];
    historyCtx.strokeStyle = palette.line;
    historyCtx.lineWidth = 3;
    historyCtx.beginPath();
    historyCtx.moveTo(path[0].x, path[0].y);
    path.slice(1).forEach((point) => historyCtx.lineTo(point.x, point.y));
    historyCtx.stroke();

    path.forEach((point, index) => {
      historyCtx.fillStyle = `${digitAnchors[(index * 2) % 10].hue}22`;
      historyCtx.strokeStyle = digitAnchors[(index * 2) % 10].hue;
      historyCtx.beginPath();
      historyCtx.roundRect(point.x - 48, point.y - 20, 112, 40, 14);
      historyCtx.fill();
      historyCtx.stroke();
      historyCtx.fillStyle = palette.text;
      historyCtx.fillText(point.label, point.x - 30, point.y + 6);
    });

    historyCtx.fillStyle = palette.stroke;
    historyCtx.beginPath();
    historyCtx.moveTo(648, 52);
    historyCtx.lineTo(692, 14);
    historyCtx.lineTo(676, 60);
    historyCtx.lineTo(700, 88);
    historyCtx.lineTo(660, 76);
    historyCtx.lineTo(634, 106);
    historyCtx.lineTo(638, 68);
    historyCtx.lineTo(606, 52);
    historyCtx.closePath();
    historyCtx.fill();
  }
}

function setHistoryMode(mode) {
  currentHistoryMode = mode;
  const content = historyModes[mode];
  historyTitleNode.textContent = content.title;
  historyCopyNode.textContent = content.copy;
  historyMetricLabel1Node.textContent = content.metrics[0][0];
  historyMetricLabel2Node.textContent = content.metrics[1][0];
  historyMetricLabel3Node.textContent = content.metrics[2][0];
  historyMetricValue1Node.textContent = content.metrics[0][1];
  historyMetricValue2Node.textContent = content.metrics[1][1];
  historyMetricValue3Node.textContent = content.metrics[2][1];
  historyButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.history === mode);
  });
  drawHistoryScene(mode);
}

function setScene(index) {
  currentSceneIndex = index;
  const scene = sceneData[index];
  sceneTimeNode.textContent = scene.time;
  sceneTitleNode.textContent = scene.title;
  sceneGoalNode.textContent = scene.goal;
  sceneOnScreenNode.textContent = scene.onScreen;
  sceneSayNode.textContent = scene.say;
  sceneWhyNode.textContent = scene.why;
  sceneButtons.forEach((button, buttonIndex) => {
    button.classList.toggle("active", buttonIndex === index);
  });
  sceneProgressBar.style.width = `${((index + 1) / sceneData.length) * 100}%`;
}

function createDefaultCurve() {
  const points = [];
  for (let i = 0; i < 26; i += 1) {
    const angle = (i / 26) * Math.PI * 2;
    const radiusX = 0.24 + Math.sin(angle * 3) * 0.01;
    const radiusY = 0.21 + Math.cos(angle * 2) * 0.012;
    points.push({
      x: 0.49 + Math.cos(angle) * radiusX,
      y: 0.46 + Math.sin(angle) * radiusY,
    });
  }
  return points;
}

const orbitalState = {
  plot: {
    x: 40,
    y: 24,
    width: orbitalCanvas.width - 80,
    height: orbitalCanvas.height - 60,
  },
  mode: "linear",
  lineHandles: [
    { x: 0.92, y: 0.05 },
    { x: 0.06, y: 0.92 },
  ],
  curvePoints: createDefaultCurve(),
  draggingHandle: null,
  activePointerId: null,
  isDrawingCurve: false,
  lineResult: { accuracy: 0, orientation: 1 },
  curveResult: { accuracy: 0 },
};

function orbitalCanvasPointToNorm(event) {
  const rect = orbitalCanvas.getBoundingClientRect();
  const scaleX = orbitalCanvas.width / rect.width;
  const scaleY = orbitalCanvas.height / rect.height;
  const canvasX = (event.clientX - rect.left) * scaleX;
  const canvasY = (event.clientY - rect.top) * scaleY;

  return {
    x: (canvasX - orbitalState.plot.x) / orbitalState.plot.width,
    y: (canvasY - orbitalState.plot.y) / orbitalState.plot.height,
  };
}

function orbitalNormToCanvas(point) {
  return {
    x: orbitalState.plot.x + point.x * orbitalState.plot.width,
    y: orbitalState.plot.y + point.y * orbitalState.plot.height,
  };
}

function pointInsidePlot(point) {
  return point.x >= 0 && point.x <= 1 && point.y >= 0 && point.y <= 1;
}

function crossAgainstLine(point, handles) {
  const [a, b] = handles;
  return (b.x - a.x) * (point.y - a.y) - (b.y - a.y) * (point.x - a.x);
}

function classifyLine(point, handles, orientation) {
  return crossAgainstLine(point, handles) * orientation >= 0 ? "safe" : "danger";
}

function computeLineResult(handles) {
  const options = [1, -1].map((orientation) => {
    const correct = orbitalSamples.filter(
      (sample) => classifyLine(sample, handles, orientation) === sample.label
    ).length;
    return {
      accuracy: Math.round((correct / orbitalSamples.length) * 100),
      orientation,
    };
  });

  return options[0].accuracy >= options[1].accuracy ? options[0] : options[1];
}

function pointInPolygon(point, polygon) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i, i += 1) {
    const xi = polygon[i].x;
    const yi = polygon[i].y;
    const xj = polygon[j].x;
    const yj = polygon[j].y;
    const intersects =
      yi > point.y !== yj > point.y &&
      point.x < ((xj - xi) * (point.y - yi)) / ((yj - yi) || 1e-9) + xi;
    if (intersects) {
      inside = !inside;
    }
  }
  return inside;
}

function computeCurveResult(points) {
  if (points.length < 3) {
    return { accuracy: 0 };
  }

  const correct = orbitalSamples.filter((sample) => {
    const prediction = pointInPolygon(sample, points) ? "safe" : "danger";
    return prediction === sample.label;
  }).length;

  return {
    accuracy: Math.round((correct / orbitalSamples.length) * 100),
  };
}

function uniquePush(target, point, epsilon = 0.0025) {
  if (target.length === 0 || distance(target[target.length - 1], point) > epsilon) {
    target.push(point);
  }
}

function clipInfiniteLineToPlot(handles) {
  const [a, b] = handles;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const hits = [];
  const epsilon = 1e-6;

  function pushCandidate(point) {
    if (!pointInsidePlot(point)) {
      return;
    }
    if (hits.some((candidate) => distance(candidate, point) < 1e-4)) {
      return;
    }
    hits.push(point);
  }

  if (Math.abs(dx) > epsilon) {
    const t0 = (0 - a.x) / dx;
    pushCandidate({ x: 0, y: a.y + t0 * dy });
    const t1 = (1 - a.x) / dx;
    pushCandidate({ x: 1, y: a.y + t1 * dy });
  }

  if (Math.abs(dy) > epsilon) {
    const t2 = (0 - a.y) / dy;
    pushCandidate({ x: a.x + t2 * dx, y: 0 });
    const t3 = (1 - a.y) / dy;
    pushCandidate({ x: a.x + t3 * dx, y: 1 });
  }

  if (hits.length >= 2) {
    return [hits[0], hits[1]];
  }

  return handles;
}

function resetLine() {
  orbitalState.lineHandles = [
    { x: 0.92, y: 0.05 },
    { x: 0.06, y: 0.92 },
  ];
}

function resetCurve() {
  orbitalState.curvePoints = createDefaultCurve();
}

function refreshOrbitalResults() {
  orbitalState.lineResult = computeLineResult(orbitalState.lineHandles);
  orbitalState.curveResult = computeCurveResult(orbitalState.curvePoints);
}

function drawOrbitalDemo() {
  const { width, height } = orbitalCanvas;
  drawStarfield(orbitalCtx, width, height);

  orbitalCtx.save();
  orbitalCtx.translate(orbitalState.plot.x, orbitalState.plot.y);

  orbitalCtx.fillStyle = "rgba(126, 200, 255, 0.08)";
  orbitalCtx.fillRect(0, 0, orbitalState.plot.width, orbitalState.plot.height);

  orbitalCtx.fillStyle = palette.muted;
  orbitalCtx.font = '14px "Trebuchet MS", sans-serif';
  orbitalCtx.fillText("feature 1", orbitalState.plot.width - 56, orbitalState.plot.height + 24);
  orbitalCtx.save();
  orbitalCtx.translate(-26, 28);
  orbitalCtx.rotate(-Math.PI / 2);
  orbitalCtx.fillText("feature 2", 0, 0);
  orbitalCtx.restore();

  if (orbitalState.mode === "linear") {
    const segment = clipInfiniteLineToPlot(orbitalState.lineHandles);
    const start = orbitalNormToCanvas(segment[0]);
    const end = orbitalNormToCanvas(segment[1]);

    orbitalCtx.save();
    orbitalCtx.strokeStyle = palette.line;
    orbitalCtx.lineWidth = 3;
    orbitalCtx.setLineDash([10, 8]);
    orbitalCtx.beginPath();
    orbitalCtx.moveTo(start.x - orbitalState.plot.x, start.y - orbitalState.plot.y);
    orbitalCtx.lineTo(end.x - orbitalState.plot.x, end.y - orbitalState.plot.y);
    orbitalCtx.stroke();
    orbitalCtx.setLineDash([]);

    orbitalState.lineHandles.forEach((handle, index) => {
      const canvasPoint = orbitalNormToCanvas(handle);
      orbitalCtx.beginPath();
      orbitalCtx.fillStyle = index === 0 ? palette.line : palette.stroke;
      orbitalCtx.arc(
        canvasPoint.x - orbitalState.plot.x,
        canvasPoint.y - orbitalState.plot.y,
        9,
        0,
        Math.PI * 2
      );
      orbitalCtx.fill();
      orbitalCtx.strokeStyle = "rgba(255,255,255,0.55)";
      orbitalCtx.lineWidth = 2;
      orbitalCtx.stroke();
    });

    orbitalCtx.fillStyle = palette.text;
    orbitalCtx.fillText("drag the gold handles", orbitalState.plot.width * 0.53, 26);
    orbitalCtx.restore();
  } else {
    if (orbitalState.curvePoints.length > 1) {
      orbitalCtx.save();
      orbitalCtx.fillStyle = "rgba(99, 210, 198, 0.12)";
      orbitalCtx.strokeStyle = palette.line;
      orbitalCtx.lineWidth = 2.5;
      orbitalCtx.beginPath();
      orbitalState.curvePoints.forEach((point, index) => {
        const canvasPoint = orbitalNormToCanvas(point);
        const x = canvasPoint.x - orbitalState.plot.x;
        const y = canvasPoint.y - orbitalState.plot.y;
        if (index === 0) {
          orbitalCtx.moveTo(x, y);
        } else {
          orbitalCtx.lineTo(x, y);
        }
      });
      orbitalCtx.closePath();
      orbitalCtx.fill();
      orbitalCtx.stroke();
      orbitalCtx.restore();
    }

    orbitalCtx.fillStyle = palette.text;
    orbitalCtx.fillText("press and sketch a closed border", orbitalState.plot.width * 0.43, 26);
  }

  orbitalSamples.forEach((sample) => {
    const x = sample.x * orbitalState.plot.width;
    const y = sample.y * orbitalState.plot.height;
    const prediction =
      orbitalState.mode === "linear"
        ? classifyLine(sample, orbitalState.lineHandles, orbitalState.lineResult.orientation)
        : pointInPolygon(sample, orbitalState.curvePoints)
        ? "safe"
        : "danger";
    const correct = prediction === sample.label;

    orbitalCtx.beginPath();
    orbitalCtx.fillStyle = sample.label === "safe" ? palette.safe : palette.danger;
    orbitalCtx.arc(x, y, 8, 0, Math.PI * 2);
    orbitalCtx.fill();

    orbitalCtx.lineWidth = correct ? 2 : 3;
    orbitalCtx.strokeStyle = correct ? "rgba(255,255,255,0.35)" : palette.line;
    orbitalCtx.stroke();

    if (!correct) {
      orbitalCtx.strokeStyle = palette.line;
      orbitalCtx.lineWidth = 2;
      orbitalCtx.beginPath();
      orbitalCtx.moveTo(x - 12, y - 12);
      orbitalCtx.lineTo(x + 12, y + 12);
      orbitalCtx.moveTo(x + 12, y - 12);
      orbitalCtx.lineTo(x - 12, y + 12);
      orbitalCtx.stroke();
    }
  });

  orbitalCtx.fillStyle = palette.safe;
  orbitalCtx.fillRect(8, orbitalState.plot.height - 30, 16, 16);
  orbitalCtx.fillStyle = palette.text;
  orbitalCtx.fillText("safe landing", 30, orbitalState.plot.height - 17);

  orbitalCtx.fillStyle = palette.danger;
  orbitalCtx.fillRect(142, orbitalState.plot.height - 30, 16, 16);
  orbitalCtx.fillStyle = palette.text;
  orbitalCtx.fillText("asteroid belt", 164, orbitalState.plot.height - 17);

  orbitalCtx.restore();
}

function updateOrbitalReadout() {
  refreshOrbitalResults();

  linearScoreNode.textContent = `${orbitalState.lineResult.accuracy}%`;
  nonLinearScoreNode.textContent = `${orbitalState.curveResult.accuracy}%`;

  if (orbitalState.mode === "linear") {
    orbitalInstruction.textContent =
      "Drag the two handles. The straight separator updates immediately, and the crosses mark the mistakes your line creates.";
    orbitalMessage.textContent =
      orbitalState.lineResult.accuracy === 100
        ? "You found a perfect straight split here, but only because the line was allowed to rotate freely. Most real spaces are not this cooperative."
        : "One weighted sum gives you one flat cut. Rotate it however you want: it still cannot bend around islands of meaning.";
  } else {
    orbitalInstruction.textContent =
      "Click and drag to sketch a closed border. Everything inside becomes the safe region, which is a toy version of a hidden-layer feature map.";
    orbitalMessage.textContent =
      orbitalState.curveResult.accuracy === 100
        ? "Your hand-drawn curve separates the classes perfectly. That is the intuition behind richer non-linear solution spaces."
        : "A hidden layer does not literally let you draw by hand, but it does let the network create borders that are far more flexible than one straight cut.";
  }

  linearBtn.classList.toggle("active", orbitalState.mode === "linear");
  nonLinearBtn.classList.toggle("active", orbitalState.mode === "nonlinear");

  drawOrbitalDemo();
}

linearBtn.addEventListener("click", () => {
  orbitalState.mode = "linear";
  updateOrbitalReadout();
});

nonLinearBtn.addEventListener("click", () => {
  orbitalState.mode = "nonlinear";
  updateOrbitalReadout();
});

resetLineBtn.addEventListener("click", () => {
  resetLine();
  updateOrbitalReadout();
});

resetCurveBtn.addEventListener("click", () => {
  resetCurve();
  updateOrbitalReadout();
});

orbitalCanvas.addEventListener("pointerdown", (event) => {
  const point = orbitalCanvasPointToNorm(event);
  if (!pointInsidePlot(point)) {
    return;
  }

  if (orbitalState.mode === "linear") {
    const nearest = orbitalState.lineHandles
      .map((handle, index) => ({
        index,
        distance: distance(handle, point),
      }))
      .sort((a, b) => a.distance - b.distance)[0];

    if (nearest && nearest.distance < 0.08) {
      orbitalState.draggingHandle = nearest.index;
      orbitalState.activePointerId = event.pointerId;
      orbitalCanvas.setPointerCapture(event.pointerId);
    }
  } else {
    orbitalState.curvePoints = [point];
    orbitalState.isDrawingCurve = true;
    orbitalState.activePointerId = event.pointerId;
    orbitalCanvas.setPointerCapture(event.pointerId);
    updateOrbitalReadout();
  }
});

orbitalCanvas.addEventListener("pointermove", (event) => {
  if (event.pointerId !== orbitalState.activePointerId) {
    return;
  }

  const point = orbitalCanvasPointToNorm(event);
  const clampedPoint = {
    x: clamp(point.x, 0, 1),
    y: clamp(point.y, 0, 1),
  };

  if (orbitalState.mode === "linear" && orbitalState.draggingHandle !== null) {
    orbitalState.lineHandles[orbitalState.draggingHandle] = clampedPoint;
    updateOrbitalReadout();
  }

  if (orbitalState.mode === "nonlinear" && orbitalState.isDrawingCurve) {
    uniquePush(orbitalState.curvePoints, clampedPoint);
    updateOrbitalReadout();
  }
});

function endOrbitalInteraction(event) {
  if (event.pointerId !== orbitalState.activePointerId) {
    return;
  }
  orbitalState.draggingHandle = null;
  orbitalState.isDrawingCurve = false;
  orbitalState.activePointerId = null;
  updateOrbitalReadout();
}

["pointerup", "pointercancel", "pointerleave"].forEach((type) => {
  orbitalCanvas.addEventListener(type, endOrbitalInteraction);
});

function indexFor(x, y) {
  return y * 28 + x;
}

function blendPixel(x, y, value) {
  if (x < 0 || x >= 28 || y < 0 || y >= 28) {
    return;
  }
  const idx = indexFor(x, y);
  drawState.pixels[idx] = Math.max(drawState.pixels[idx], value);
}

function stampBrush(x, y) {
  for (let dy = -2; dy <= 2; dy += 1) {
    for (let dx = -2; dx <= 2; dx += 1) {
      const brushDistance = Math.sqrt(dx * dx + dy * dy);
      if (brushDistance > 2.3) {
        continue;
      }
      const strength = clamp(1 - brushDistance / 2.5, 0.15, 1);
      blendPixel(x + dx, y + dy, strength);
    }
  }
}

function drawLineCells(from, to) {
  const steps = Math.max(Math.abs(to.x - from.x), Math.abs(to.y - from.y), 1);
  for (let step = 0; step <= steps; step += 1) {
    const x = Math.round(from.x + ((to.x - from.x) * step) / steps);
    const y = Math.round(from.y + ((to.y - from.y) * step) / steps);
    stampBrush(x, y);
  }
}

function canvasPosition(event) {
  const rect = drawCanvas.getBoundingClientRect();
  const scaleX = drawCanvas.width / rect.width;
  const scaleY = drawCanvas.height / rect.height;
  const x = Math.floor(((event.clientX - rect.left) * scaleX) / 10);
  const y = Math.floor(((event.clientY - rect.top) * scaleY) / 10);
  return { x: clamp(x, 0, 27), y: clamp(y, 0, 27) };
}

function renderDrawCanvas() {
  drawCtx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
  drawCtx.fillStyle = "#091521";
  drawCtx.fillRect(0, 0, drawCanvas.width, drawCanvas.height);

  for (let y = 0; y < 28; y += 1) {
    for (let x = 0; x < 28; x += 1) {
      const pixel = drawState.pixels[indexFor(x, y)];
      if (pixel > 0) {
        drawCtx.fillStyle = `rgba(255, 230, 176, ${0.12 + pixel * 0.88})`;
        drawCtx.fillRect(x * 10, y * 10, 10, 10);
      }
      drawCtx.strokeStyle = "rgba(255,255,255,0.05)";
      drawCtx.strokeRect(x * 10, y * 10, 10, 10);
    }
  }
}

function clearDrawing() {
  drawState.pixels.fill(0);
  renderDrawCanvas();
  updateDigitAnalysis();
}

clearBtn.addEventListener("click", clearDrawing);

drawCanvas.addEventListener("pointerdown", (event) => {
  event.preventDefault();
  drawState.isDrawing = true;
  const cell = canvasPosition(event);
  stampBrush(cell.x, cell.y);
  drawState.lastCell = cell;
  renderDrawCanvas();
  updateDigitAnalysis();
});

drawCanvas.addEventListener("pointermove", (event) => {
  if (!drawState.isDrawing) {
    return;
  }
  const cell = canvasPosition(event);
  if (!drawState.lastCell) {
    stampBrush(cell.x, cell.y);
  } else {
    drawLineCells(drawState.lastCell, cell);
  }
  drawState.lastCell = cell;
  renderDrawCanvas();
  updateDigitAnalysis();
});

["pointerup", "pointerleave", "pointercancel"].forEach((type) => {
  drawCanvas.addEventListener(type, () => {
    drawState.isDrawing = false;
    drawState.lastCell = null;
  });
});

function pixelsToCanvas(pixels, ctx) {
  const image = ctx.createImageData(28, 28);
  for (let i = 0; i < pixels.length; i += 1) {
    const value = Math.round(clamp(pixels[i], 0, 1) * 255);
    image.data[i * 4] = value;
    image.data[i * 4 + 1] = value;
    image.data[i * 4 + 2] = value;
    image.data[i * 4 + 3] = 255;
  }
  ctx.putImageData(image, 0, 0);
}

function canvasToPixels(ctx) {
  const image = ctx.getImageData(0, 0, 28, 28).data;
  const pixels = new Float32Array(28 * 28);
  for (let i = 0; i < pixels.length; i += 1) {
    pixels[i] = image[i * 4] / 255;
  }
  return pixels;
}

function boundingBox(pixels, threshold = 0.05) {
  let minX = 28;
  let minY = 28;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < 28; y += 1) {
    for (let x = 0; x < 28; x += 1) {
      if (pixels[indexFor(x, y)] <= threshold) {
        continue;
      }
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }

  if (maxX < minX || maxY < minY) {
    return null;
  }

  return {
    minX: Math.max(0, minX - 1),
    minY: Math.max(0, minY - 1),
    maxX: Math.min(27, maxX + 1),
    maxY: Math.min(27, maxY + 1),
  };
}

function centerOfMass(pixels) {
  let mass = 0;
  let sumX = 0;
  let sumY = 0;

  for (let y = 0; y < 28; y += 1) {
    for (let x = 0; x < 28; x += 1) {
      const value = pixels[indexFor(x, y)];
      mass += value;
      sumX += x * value;
      sumY += y * value;
    }
  }

  if (mass <= 0) {
    return { x: 13.5, y: 13.5, mass: 0 };
  }

  return { x: sumX / mass, y: sumY / mass, mass };
}

function preprocessForMnist(pixels) {
  const box = boundingBox(pixels);
  if (!box) {
    return new Float32Array(28 * 28);
  }

  pixelsToCanvas(pixels, prepSourceCtx);

  prepScaledCtx.save();
  prepScaledCtx.setTransform(1, 0, 0, 1, 0, 0);
  prepScaledCtx.clearRect(0, 0, 28, 28);
  prepScaledCtx.restore();

  const width = box.maxX - box.minX + 1;
  const height = box.maxY - box.minY + 1;
  const scale = 20 / Math.max(width, height);
  const drawWidth = width * scale;
  const drawHeight = height * scale;

  prepScaledCtx.imageSmoothingEnabled = true;
  prepScaledCtx.drawImage(
    prepSourceCanvas,
    box.minX,
    box.minY,
    width,
    height,
    (28 - drawWidth) / 2,
    (28 - drawHeight) / 2,
    drawWidth,
    drawHeight
  );

  const scaledPixels = canvasToPixels(prepScaledCtx);
  const mass = centerOfMass(scaledPixels);

  prepFinalCtx.save();
  prepFinalCtx.setTransform(1, 0, 0, 1, 0, 0);
  prepFinalCtx.clearRect(0, 0, 28, 28);
  prepFinalCtx.restore();

  prepFinalCtx.imageSmoothingEnabled = true;
  prepFinalCtx.drawImage(prepScaledCanvas, 13.5 - mass.x, 13.5 - mass.y);

  return canvasToPixels(prepFinalCtx);
}

const rawMnistModel = window.MNIST_MODEL || null;
const mnistState = rawMnistModel
  ? {
      meta: rawMnistModel.meta,
      layers: rawMnistModel.layers.map((layer) => ({
        input: layer.input,
        output: layer.output,
        weights: Float32Array.from(layer.weights),
        bias: Float32Array.from(layer.bias),
      })),
      samples: rawMnistModel.samples,
      digitExamples: rawMnistModel.digitExamples,
    }
  : null;

function setPixels(sourcePixels) {
  drawState.pixels.fill(0);
  drawState.pixels.set(sourcePixels);
  renderDrawCanvas();
  updateDigitAnalysis();
}

function rawSampleToPixels(rawSample) {
  const pixels = new Float32Array(28 * 28);
  for (let i = 0; i < pixels.length; i += 1) {
    pixels[i] = rawSample[i] / 255;
  }
  return pixels;
}

function runMnistModel(inputPixels) {
  let activations = inputPixels;

  mnistState.layers.forEach((layer, layerIndex) => {
    const output = new Float32Array(layer.output);
    for (let out = 0; out < layer.output; out += 1) {
      let sum = layer.bias[out];
      for (let inputIndex = 0; inputIndex < layer.input; inputIndex += 1) {
        sum += activations[inputIndex] * layer.weights[inputIndex * layer.output + out];
      }
      output[out] = layerIndex === mnistState.layers.length - 1 ? sum : Math.max(0, sum);
    }
    activations = output;
  });

  return softmax(activations);
}

function classifyDigit(pixels) {
  const preparedPixels = preprocessForMnist(pixels);
  const probabilities = runMnistModel(preparedPixels);
  const ranked = probabilities
    .map((probability, digit) => ({ digit, probability }))
    .sort((a, b) => b.probability - a.probability);
  return { preparedPixels, probabilities, ranked };
}

function analyzePixels(pixels) {
  return centerOfMass(pixels);
}

function drawDigitMap(probabilities, analysis) {
  const { width, height } = digitMapCanvas;
  digitMapCtx.clearRect(0, 0, width, height);

  const gradient = digitMapCtx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, "#0c1824");
  gradient.addColorStop(1, "#08131d");
  digitMapCtx.fillStyle = gradient;
  digitMapCtx.fillRect(0, 0, width, height);

  digitMapCtx.strokeStyle = "rgba(255,255,255,0.05)";
  for (let x = 30; x < width; x += 50) {
    digitMapCtx.beginPath();
    digitMapCtx.moveTo(x, 0);
    digitMapCtx.lineTo(x, height);
    digitMapCtx.stroke();
  }
  for (let y = 24; y < height; y += 50) {
    digitMapCtx.beginPath();
    digitMapCtx.moveTo(0, y);
    digitMapCtx.lineTo(width, y);
    digitMapCtx.stroke();
  }

  digitAnchors.forEach((anchor, digit) => {
    const x = anchor.x * width;
    const y = anchor.y * height;
    const glow = digitMapCtx.createRadialGradient(x, y, 0, x, y, 42);
    glow.addColorStop(0, `${anchor.hue}55`);
    glow.addColorStop(1, `${anchor.hue}00`);
    digitMapCtx.fillStyle = glow;
    digitMapCtx.beginPath();
    digitMapCtx.arc(x, y, 42, 0, Math.PI * 2);
    digitMapCtx.fill();

    digitMapCtx.fillStyle = anchor.hue;
    digitMapCtx.beginPath();
    digitMapCtx.arc(x, y, 4, 0, Math.PI * 2);
    digitMapCtx.fill();

    digitMapCtx.fillStyle = palette.text;
    digitMapCtx.font = '700 16px "Trebuchet MS", sans-serif';
    digitMapCtx.fillText(String(digit), x + 9, y - 8);
  });

  if (analysis.mass < 2) {
    digitMapCtx.fillStyle = palette.text;
    digitMapCtx.font = '18px "Palatino Linotype", Georgia, serif';
    digitMapCtx.fillText("Draw a digit to place it on the map", 120, height / 2);
    return;
  }

  let mapX = 0;
  let mapY = 0;
  probabilities.forEach((probability, digit) => {
    mapX += digitAnchors[digit].x * probability;
    mapY += digitAnchors[digit].y * probability;
  });

  const filledRatio = clamp(analysis.mass / 90, 0, 1);
  mapX = clamp(mapX + ((analysis.x - 13.5) / 13.5) * 0.04, 0.08, 0.92);
  mapY = clamp(mapY + ((analysis.y - 13.5) / 13.5) * 0.04 - (filledRatio - 0.45) * 0.025, 0.1, 0.9);

  const px = mapX * width;
  const py = mapY * height;

  digitMapCtx.strokeStyle = "rgba(255, 209, 102, 0.4)";
  digitMapCtx.lineWidth = 1.5;
  digitMapCtx.beginPath();
  digitMapCtx.moveTo(px - 16, py);
  digitMapCtx.lineTo(px + 16, py);
  digitMapCtx.moveTo(px, py - 16);
  digitMapCtx.lineTo(px, py + 16);
  digitMapCtx.stroke();

  const pulse = digitMapCtx.createRadialGradient(px, py, 0, px, py, 20);
  pulse.addColorStop(0, "rgba(255, 209, 102, 0.9)");
  pulse.addColorStop(1, "rgba(255, 209, 102, 0)");
  digitMapCtx.fillStyle = pulse;
  digitMapCtx.beginPath();
  digitMapCtx.arc(px, py, 20, 0, Math.PI * 2);
  digitMapCtx.fill();

  digitMapCtx.fillStyle = palette.text;
  digitMapCtx.font = '14px "Trebuchet MS", sans-serif';
  digitMapCtx.fillText("current drawing", px + 14, py - 14);
}

function renderProbabilityList(ranked) {
  probabilityList.innerHTML = "";
  ranked.forEach(({ digit, probability }) => {
    const row = document.createElement("div");
    row.className = "probability-row";

    const label = document.createElement("span");
    label.textContent = digit;

    const track = document.createElement("div");
    track.className = "bar-track";
    const fill = document.createElement("div");
    fill.className = "bar-fill";
    fill.style.width = `${Math.round(probability * 100)}%`;
    track.appendChild(fill);

    const score = document.createElement("strong");
    score.textContent = `${Math.round(probability * 100)}%`;
    score.style.fontSize = "0.95rem";

    row.appendChild(label);
    row.appendChild(track);
    row.appendChild(score);
    probabilityList.appendChild(row);
  });
}

function updateDigitAnalysis() {
  if (!mnistState) {
    topGuessNode.textContent = "-";
    topConfidenceNode.textContent = "-";
    filledPixelsNode.textContent = "0";
    probabilityList.innerHTML = "";
    drawDigitMap(new Array(10).fill(0.1), { mass: 0, x: 13.5, y: 13.5 });
    return;
  }

  const { preparedPixels, probabilities, ranked } = classifyDigit(drawState.pixels);
  const analysis = analyzePixels(preparedPixels);

  if (analysis.mass < 2) {
    topGuessNode.textContent = "-";
    topConfidenceNode.textContent = "0%";
    filledPixelsNode.textContent = "0";
    probabilityList.innerHTML = "";
    drawDigitMap(new Array(10).fill(0.1), analysis);
    return;
  }

  const top = ranked[0];
  topGuessNode.textContent = String(top.digit);
  topConfidenceNode.textContent = `${Math.round(top.probability * 100)}%`;
  filledPixelsNode.textContent = Math.round(analysis.mass).toString();

  drawDigitMap(probabilities, analysis);
  renderProbabilityList(ranked);
}

function initializeMnistUi() {
  if (!mnistState) {
    modelStatusNode.textContent = "MNIST model not loaded";
    modelNameNode.textContent = "Unavailable";
    modelAccuracyNode.textContent = "-";
    trainingSamplesNode.textContent = "-";
    epochSlider.disabled = true;
    sampleBtn.disabled = true;
    return;
  }

  modelStatusNode.textContent = "Real MNIST MLP loaded locally";
  modelNameNode.textContent = `MLP ${mnistState.meta.architecture.join("-")}`;
  modelAccuracyNode.textContent = `${(mnistState.meta.testAccuracy * 100).toFixed(1)}%`;
  trainingSamplesNode.textContent = mnistState.meta.trainSamples.toLocaleString();
  epochSlider.min = "1";
  epochSlider.max = String(mnistState.meta.lossCurve.length);
  epochSlider.value = "1";

  stampGrid.innerHTML = "";
  Object.entries(mnistState.digitExamples).forEach(([digit, rawPixels]) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "stamp-btn";
    button.textContent = `Load ${digit}`;
    button.addEventListener("click", () => setPixels(rawSampleToPixels(rawPixels)));
    stampGrid.appendChild(button);
  });

  sampleBtn.addEventListener("click", () => {
    const sample = mnistState.samples[Math.floor(Math.random() * mnistState.samples.length)];
    setPixels(rawSampleToPixels(sample.pixels));
  });

  updateTrainingUi(0);
}

if (mnistState) {
  epochSlider.addEventListener("input", () => {
    updateTrainingUi(Number(epochSlider.value) - 1);
  });
}

lensButtons.forEach((button) => {
  button.addEventListener("click", () => setLens(button.dataset.lens));
});

historyButtons.forEach((button) => {
  button.addEventListener("click", () => setHistoryMode(button.dataset.history));
});

sceneButtons.forEach((button, index) => {
  button.addEventListener("click", () => setScene(index));
});

setLens(currentLens);
updateOrbitalReadout();
setHistoryMode(currentHistoryMode);
setScene(currentSceneIndex);
initializeMnistUi();
renderDrawCanvas();

if (mnistState) {
  setPixels(rawSampleToPixels(mnistState.digitExamples["8"]));
} else {
  clearDrawing();
}
