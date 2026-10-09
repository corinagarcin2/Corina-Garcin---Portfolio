const canvas = document.getElementById("roverCanvas");
const ctx = canvas.getContext("2d");

// ===============================
// GAME SETTINGS
// ===============================

const GRID_SIZE = 40;
const COLS = canvas.width / GRID_SIZE;
const ROWS = canvas.height / GRID_SIZE;

let mode = "MANUAL";
let battery = 100;
let regolith = 0;
let carryingRegolith = false;

let rover = {
  x: 1,
  y: 1
};

let visualRover = { x: rover.x, y: rover.y };
let roverMotion = null;
let roverHeading = 0;
const reducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)"
).matches;

let regolithZone = {
  x: COLS - 3,
  y: ROWS - 3
};

let dumpZone = {
  x: 2,
  y: ROWS - 3
};

let obstacles = [];
let path = [];
let autoTimer = null;
let exploredCells = [];
let showRoute = true;
let showExplored = false;
let batteryLowLogged = false;
let batteryEmptyLogged = false;
let isPaused = false;
let speedMultiplier = 1;
let missionStartedAt = null;
let pauseStartedAt = null;
let pausedDuration = 0;
let distanceTraveled = 0;
let customDestination = null;

// ===============================
// HTML ELEMENTS
// ===============================

const modeDisplay = document.getElementById("modeDisplay");
const modeIndicator = document.getElementById("modeIndicator");
const batteryDisplay = document.getElementById("batteryDisplay");
const batteryMeter = document.getElementById("batteryMeter");
const batteryBar = document.getElementById("batteryBar");
const regolithDisplay = document.getElementById("regolithDisplay");

const statusDisplay = document.getElementById("statusDisplay");
const controlDisplay = document.getElementById("controlDisplay");
const routeDisplay = document.getElementById("routeDisplay");
const missionStatus = document.getElementById("missionStatus");
const targetDisplay = document.getElementById("targetDisplay");
const positionDisplay = document.getElementById("positionDisplay");

const manualButton = document.getElementById("manualButton");
const autoButton = document.getElementById("autoButton");
const resetButton = document.getElementById("resetButton");
const routeToggle = document.getElementById("routeToggle");
const exploredToggle = document.getElementById("exploredToggle");
const missionLogEntries = document.getElementById("missionLogEntries");
const clearLogButton = document.getElementById("clearLogButton");
const pauseButton = document.getElementById("pauseButton");
const speedSelect = document.getElementById("speedSelect");
const newMapButton = document.getElementById("newMapButton");
const missionSummary = document.getElementById("missionSummary");
const summaryElapsed = document.getElementById("summaryElapsed");
const summaryDistance = document.getElementById("summaryDistance");
const summarySamples = document.getElementById("summarySamples");
const summaryBattery = document.getElementById("summaryBattery");
const runAgainButton = document.getElementById("runAgainButton");

// ===============================
// CREATE LUNAR TERRAIN
// ===============================

function generateObstacles() {

  const numberOfObstacles = 38;

  do {
    obstacles = [];

    while (obstacles.length < numberOfObstacles) {

      const x = Math.floor(Math.random() * COLS);
      const y = Math.floor(Math.random() * ROWS);

      const blockedImportantArea =
        (x === rover.x && y === rover.y) ||
        (x === regolithZone.x && y === regolithZone.y) ||
        (x === dumpZone.x && y === dumpZone.y);

      const alreadyExists = obstacles.some(
        obstacle => obstacle.x === x && obstacle.y === y
      );

      if (!blockedImportantArea && !alreadyExists) {
        obstacles.push({ x, y });
      }
    }
  } while (!hasValidMissionPaths());

  exploredCells = [];
}

function hasValidMissionPaths() {

  const routeToSample = findPath(rover, regolithZone);
  const routeToBerm = findPath(regolithZone, dumpZone);
  const routeFromRoverToBerm = findPath(rover, dumpZone);

  return (
    routeToSample.length > 0 &&
    routeToBerm.length > 0 &&
    routeFromRoverToBerm.length > 0
  );
}

// ===============================
// DRAW GAME
// ===============================

function drawGame() {

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawBackground();
  drawGrid();
  drawExploredCells();
  drawPath();
  drawObstacles();
  drawRegolithZone();
  drawDumpZone();
  drawRover();
  drawMapPolish();

}

// ===============================
// BACKGROUND
// ===============================

function drawBackground() {

  ctx.fillStyle = "#f7efe9";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let i = 0; i < 105; i++) {
    const x = (i * 73 + 19) % canvas.width;
    const y = (i * 137 + 41) % canvas.height;
    const radius = 0.7 + (i % 4) * 0.45;
    ctx.fillStyle = i % 3 === 0
      ? "rgba(79, 2, 39, 0.12)"
      : "rgba(255, 255, 255, 0.45)";
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  for (let i = 0; i < 14; i++) {
    const x = (i * 181 + 70) % canvas.width;
    const y = (i * 97 + 56) % canvas.height;
    const radius = 8 + (i % 3) * 4;
    ctx.fillStyle = "rgba(138, 18, 80, 0.07)";
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ===============================
// GRID
// ===============================

function drawGrid() {

  ctx.strokeStyle = "rgba(79, 2, 39, 0.16)";
  ctx.lineWidth = 1;

  for (let x = 0; x <= canvas.width; x += GRID_SIZE) {

    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();

  }

  for (let y = 0; y <= canvas.height; y += GRID_SIZE) {

    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();

  }

}

function drawMapPolish() {

    ctx.save();
    ctx.fillStyle = "#8a1250";
    ctx.font = "800 7px Manrope, sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";

    for (let column = 0; column < COLS; column++) {
      ctx.fillText(String(column + 1), column * GRID_SIZE + 3, 3);
    }

    for (let row = 0; row < ROWS; row++) {
      ctx.fillText(String(row + 1), 3, row * GRID_SIZE + 3);
    }

    const compassX = canvas.width - 28;
    const compassY = canvas.height - 28;
    ctx.strokeStyle = "#4f0227";
    ctx.fillStyle = "#ff9fe6";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(compassX, compassY, 12, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(compassX, compassY - 9);
    ctx.lineTo(compassX - 4, compassY + 4);
    ctx.lineTo(compassX + 4, compassY + 4);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#4f0227";
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    ctx.fillText("N", compassX, compassY - 14);

    const scaleX = 16;
    const scaleY = canvas.height - 16;
    const scaleWidth = GRID_SIZE * 3;
    ctx.strokeStyle = "#4f0227";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(scaleX, scaleY);
    ctx.lineTo(scaleX + scaleWidth, scaleY);
    ctx.moveTo(scaleX, scaleY - 4);
    ctx.lineTo(scaleX, scaleY + 4);
    ctx.moveTo(scaleX + scaleWidth, scaleY - 4);
    ctx.lineTo(scaleX + scaleWidth, scaleY + 4);
    ctx.stroke();
    ctx.textAlign = "left";
    ctx.textBaseline = "bottom";
    ctx.fillText("3 CELLS", scaleX, scaleY - 5);
    ctx.restore();
}

// ===============================
// OBSTACLES
// ===============================

function drawObstacles() {

  obstacles.forEach(obstacle => {

    const centerX = obstacle.x * GRID_SIZE + GRID_SIZE / 2;
    const centerY = obstacle.y * GRID_SIZE + GRID_SIZE / 2;
    const radius = GRID_SIZE * 0.34;

    ctx.save();
    ctx.fillStyle = "#8a1250";
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.strokeStyle = "#4f0227";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(centerX - 1, centerY - 1, radius * 0.78, Math.PI * 1.04, Math.PI * 1.9);
    ctx.stroke();

    ctx.fillStyle = "rgba(79, 2, 39, 0.42)";
    ctx.beginPath();
    ctx.ellipse(centerX + 1, centerY + 2, radius * 0.47, radius * 0.35, -0.25, 0, Math.PI * 2);
    ctx.fill();

  });
}

// ===============================
// REGOLITH ZONE
// ===============================

function drawRegolithZone() {

  const x = regolithZone.x * GRID_SIZE;
  const y = regolithZone.y * GRID_SIZE;
  const centerX = x + GRID_SIZE / 2;
  const centerY = y + GRID_SIZE / 2;
  const pulse = reducedMotion || carryingRegolith
    ? 0
    : (Math.sin(performance.now() / 430) + 1) / 2;

  ctx.fillStyle = "rgba(233, 240, 93, 0.58)";
  ctx.fillRect(x + 2, y + 2, GRID_SIZE - 4, GRID_SIZE - 4);
  ctx.strokeStyle = "#8a1250";
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x + 3, y + 3, GRID_SIZE - 6, GRID_SIZE - 6);

  ctx.save();
  ctx.strokeStyle = `rgba(138, 18, 80, ${0.45 + pulse * 0.35})`;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(centerX, centerY, 8 + pulse * 3, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  ctx.fillStyle = "#4f0227";
  ctx.font = "700 6px Manrope, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("SAMPLE", centerX, centerY + 12);
}

// ===============================
// DUMP / BERM ZONE
// ===============================

function drawDumpZone() {

  const x = dumpZone.x * GRID_SIZE;
  const y = dumpZone.y * GRID_SIZE;
  const centerX = x + GRID_SIZE / 2;
  const centerY = y + GRID_SIZE / 2;
  const pulse = reducedMotion || !carryingRegolith
    ? 0
    : (Math.sin(performance.now() / 520) + 1) / 2;

  ctx.fillStyle = "rgba(255, 159, 230, 0.5)";
  ctx.fillRect(x + 3, y + 3, GRID_SIZE - 6, GRID_SIZE - 6);
  ctx.strokeStyle = "#4f0227";
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 5, y + 5, GRID_SIZE - 10, GRID_SIZE - 10);

  ctx.save();
  ctx.strokeStyle = `rgba(79, 2, 39, ${0.52 + pulse * 0.35})`;
  ctx.beginPath();
  ctx.arc(centerX, centerY, 7 + pulse * 3, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  ctx.fillStyle = "#4f0227";
  ctx.font = "700 6px Manrope, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("BERM", centerX, centerY + 12);
}

// ===============================
// ROVER
// ===============================

function drawRover() {

  const position = getVisualRoverPosition(performance.now());
  const centerX = (position.x + 0.5) * GRID_SIZE;
  const centerY = (position.y + 0.5) * GRID_SIZE;

  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.rotate(roverHeading);

  ctx.fillStyle = "rgba(79, 2, 39, 0.2)";
  ctx.beginPath();
  ctx.ellipse(1, 4, 14, 12, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#4f0227";
  ctx.fillRect(-13, -11, 5, 9);
  ctx.fillRect(8, -11, 5, 9);
  ctx.fillRect(-13, 3, 5, 9);
  ctx.fillRect(8, 3, 5, 9);
  ctx.fillStyle = "#e9f05d";
  ctx.fillRect(-9, -12, 18, 24);
  ctx.strokeStyle = "#4f0227";
  ctx.lineWidth = 1;
  ctx.strokeRect(-9, -12, 18, 24);

  ctx.fillStyle = "#ff9fe6";
  ctx.fillRect(-6, -7, 12, 8);
  ctx.fillStyle = "#4f0227";
  ctx.fillRect(-4, -5, 3, 3);
  ctx.fillRect(2, -5, 3, 3);

  ctx.strokeStyle = "#4f0227";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, -12);
  ctx.lineTo(0, -17);
  ctx.stroke();
  ctx.fillStyle = "#ff9fe6";
  ctx.beginPath();
  ctx.arc(0, -18, 2, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#4f0227";
  ctx.beginPath();
  ctx.moveTo(-4, -12);
  ctx.lineTo(0, -18);
  ctx.lineTo(4, -12);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

function getVisualRoverPosition(now) {

  if (!roverMotion) {
    return visualRover;
  }

  const progress = Math.min(
    1,
    (now - roverMotion.startedAt) / roverMotion.duration
  );
  const eased = progress * progress * (3 - 2 * progress);

  visualRover = {
    x: roverMotion.fromX + (roverMotion.toX - roverMotion.fromX) * eased,
    y: roverMotion.fromY + (roverMotion.toY - roverMotion.fromY) * eased
  };

  if (progress >= 1) {
    roverMotion = null;
  }

  return visualRover;
}

function animateRoverTo(x, y, dx, dy) {

  const now = performance.now();
  const current = getVisualRoverPosition(now);

  if (dx > 0) roverHeading = Math.PI / 2;
  if (dx < 0) roverHeading = -Math.PI / 2;
  if (dy > 0) roverHeading = Math.PI;
  if (dy < 0) roverHeading = 0;

  if (reducedMotion) {
    visualRover = { x, y };
    roverMotion = null;
    return;
  }

  roverMotion = {
    fromX: current.x,
    fromY: current.y,
    toX: x,
    toY: y,
    startedAt: now,
    duration: 220
  };
}

function renderFrame() {
  drawGame();

  if (!reducedMotion) {
    requestAnimationFrame(renderFrame);
  }
}

// ===============================
// MOVEMENT
// ===============================

function moveRover(dx, dy) {

  if (mode !== "MANUAL" || isPaused) {
    return;
  }

  attemptMove(
    rover.x + dx,
    rover.y + dy
  );
}

function attemptMove(newX, newY) {

  if (battery <= 0) {
    statusDisplay.textContent = "BATTERY EMPTY";
    missionStatus.textContent =
      "Mission stopped. Start a new mission.";
    if (!batteryEmptyLogged) {
      addMissionLog("Battery depleted. Mission movement stopped.");
      batteryEmptyLogged = true;
    }
    return false;
  }

  if (
    newX < 0 ||
    newX >= COLS ||
    newY < 0 ||
    newY >= ROWS
  ) {
    return false;
  }

  const obstacle = obstacles.some(
    item => item.x === newX && item.y === newY
  );

  if (obstacle) {

    statusDisplay.textContent = "OBSTACLE";

    missionStatus.textContent =
      "Movement blocked by lunar terrain.";

    return false;
  }

  const dx = newX - rover.x;
  const dy = newY - rover.y;

  startMissionTracking();
  rover.x = newX;
  rover.y = newY;
  distanceTraveled += Math.abs(dx) + Math.abs(dy);
  animateRoverTo(newX, newY, dx, dy);

  battery = Math.max(0, battery - 1);
  logLowBattery();

  checkMission();

  updateDisplays();

  drawGame();

  return true;
}

// ===============================
// MISSION LOGIC
// ===============================

function checkMission() {

  if (
    rover.x === regolithZone.x &&
    rover.y === regolithZone.y &&
    !carryingRegolith
  ) {

    carryingRegolith = true;
    regolith++;

    statusDisplay.textContent = "COLLECTED";

    missionStatus.textContent =
      "Regolith collected! Transport it to the berm zone.";
    missionStatus.classList.remove("is-highlighted");
    void missionStatus.offsetWidth;
    missionStatus.classList.add("is-highlighted");
    addMissionLog("Regolith sample collected.");
    setTimeout(() => {
      missionStatus.classList.remove("is-highlighted");
    }, 900);

  }

  else if (
    rover.x === dumpZone.x &&
    rover.y === dumpZone.y &&
    carryingRegolith
  ) {

    carryingRegolith = false;

    statusDisplay.textContent = "MISSION COMPLETE";

    missionStatus.textContent =
      "Regolith delivered successfully. Mission complete!";
    addMissionLog("Mission complete. Regolith delivered to the berm zone.");
    showMissionSummary();

    stopAuto();

  }

  else {

    statusDisplay.textContent =
      carryingRegolith ? "TRANSPORTING" : "EXPLORING";

  }
}

// ===============================
// KEYBOARD CONTROLS
// ===============================

document.addEventListener("keydown", event => {

  const key = event.key.toLowerCase();

  if (
    ["arrowup", "arrowdown", "arrowleft", "arrowright"].includes(key)
  ) {
    event.preventDefault();
  }

  if (key === "w" || key === "arrowup") {
    moveRover(0, -1);
  }

  if (key === "s" || key === "arrowdown") {
    moveRover(0, 1);
  }

  if (key === "a" || key === "arrowleft") {
    moveRover(-1, 0);
  }

  if (key === "d" || key === "arrowright") {
    moveRover(1, 0);
  }

  if (key === "m") {

    if (mode === "MANUAL") {
      startAuto();
    }

    else {
      setManual();
    }
  }

});

// ===============================
// A* PATHFINDING
// ===============================

function findPath(start, goal) {

  const openSet = [
    {
      x: start.x,
      y: start.y,
      g: 0,
      h: heuristic(start, goal),
      parent: null
    }
  ];

  const closedSet = new Set();
  exploredCells = [];

  while (openSet.length > 0) {

    openSet.sort(
      (a, b) =>
        (a.g + a.h) - (b.g + b.h)
    );

    const current = openSet.shift();

    const key = `${current.x},${current.y}`;

    if (closedSet.has(key)) {
      continue;
    }

    closedSet.add(key);
    exploredCells.push({ x: current.x, y: current.y });

    if (
      current.x === goal.x &&
      current.y === goal.y
    ) {

      const finalPath = [];

      let node = current;

      while (node.parent) {

        finalPath.unshift({
          x: node.x,
          y: node.y
        });

        node = node.parent;
      }

      return finalPath;
    }

    const neighbors = [
      { x: current.x + 1, y: current.y },
      { x: current.x - 1, y: current.y },
      { x: current.x, y: current.y + 1 },
      { x: current.x, y: current.y - 1 }
    ];

    neighbors.forEach(neighbor => {

      if (
        neighbor.x < 0 ||
        neighbor.x >= COLS ||
        neighbor.y < 0 ||
        neighbor.y >= ROWS
      ) {
        return;
      }

      const blocked = obstacles.some(
        obstacle =>
          obstacle.x === neighbor.x &&
          obstacle.y === neighbor.y
      );

      if (blocked) {
        return;
      }

      const neighborKey =
        `${neighbor.x},${neighbor.y}`;

      if (closedSet.has(neighborKey)) {
        return;
      }

      openSet.push({
        x: neighbor.x,
        y: neighbor.y,
        g: current.g + 1,
        h: heuristic(neighbor, goal),
        parent: current
      });

    });

  }

  return [];
}

function heuristic(a, b) {

  return (
    Math.abs(a.x - b.x) +
    Math.abs(a.y - b.y)
  );
}

// ===============================
// DRAW A* ROUTE
// ===============================

function drawPath() {

  if (!showRoute || path.length === 0) {
    return;
  }

  const points = [
    { x: rover.x + 0.5, y: rover.y + 0.5 },
    ...path.map(step => ({ x: step.x + 0.5, y: step.y + 0.5 }))
  ];

  ctx.save();
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.strokeStyle = "#ff9fe6";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(points[0].x * GRID_SIZE, points[0].y * GRID_SIZE);

  points.slice(1).forEach(point => {
    ctx.lineTo(point.x * GRID_SIZE, point.y * GRID_SIZE);
  });

  ctx.stroke();
  ctx.fillStyle = "#e9f05d";

  path.forEach((step, index) => {
    const centerX = (step.x + 0.5) * GRID_SIZE;
    const centerY = (step.y + 0.5) * GRID_SIZE;
    const radius = index === path.length - 1 ? 3.5 : 2;

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.restore();
}

function drawExploredCells() {

  if (!showExplored) {
    return;
  }

  ctx.fillStyle = "rgba(255, 159, 230, 0.22)";

  exploredCells.forEach(cell => {
    ctx.fillRect(
      cell.x * GRID_SIZE + 12,
      cell.y * GRID_SIZE + 12,
      GRID_SIZE - 24,
      GRID_SIZE - 24
    );
  });
}

function addMissionLog(message) {

  const item = document.createElement("li");
  const timestamp = document.createElement("time");
  timestamp.dateTime = new Date().toISOString();
  timestamp.textContent = new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });

  item.append(timestamp, document.createTextNode(message));
  missionLogEntries.append(item);

  while (missionLogEntries.children.length > 50) {
    missionLogEntries.firstElementChild.remove();
  }

  missionLogEntries.scrollTop = missionLogEntries.scrollHeight;
}

// ===============================
// AUTO MODE
// ===============================

function startAuto() {

  stopAuto();

  mode = "AUTO";
  addMissionLog("Autonomous mode enabled.");
  startMissionTracking();

  controlDisplay.textContent = "AUTONOMOUS";
  modeDisplay.textContent = "AUTO";
  updateDisplays();

  const goal = getActiveGoal();

  path = findPath(rover, goal);

  if (path.length === 0) {

    statusDisplay.textContent = "NO ROUTE";

    routeDisplay.textContent = "BLOCKED";

    missionStatus.textContent =
      "Autonomous navigation could not find a safe route.";
    addMissionLog("No safe autonomous route is available.");
    customDestination = null;

    setManual();

    return;
  }

  routeDisplay.textContent =
    `${path.length} STEPS`;
  addMissionLog(`Route planned with ${path.length} steps.`);

  statusDisplay.textContent =
    "NAVIGATING";

  missionStatus.textContent =
    customDestination
      ? "Autonomous route calculated to the selected destination."
      : carryingRegolith
      ? "Autonomous route calculated to berm zone."
      : "Autonomous route calculated to regolith zone.";

  drawGame();

  startAutoTimer();
}

function startAutoTimer() {

  stopAuto();

  if (mode !== "AUTO" || isPaused || path.length === 0) {
    return;
  }

  autoTimer = setInterval(() => {

    if (path.length === 0) {

      stopAuto();

      if (
        customDestination &&
        rover.x === customDestination.x &&
        rover.y === customDestination.y
      ) {
        statusDisplay.textContent = "ARRIVED";
        missionStatus.textContent = "Custom destination reached.";
        addMissionLog("Custom destination reached.");
        customDestination = null;
        updateDisplays();
        drawGame();
        return;
      }

      if (carryingRegolith) {

        setTimeout(() => {
          startAuto();
        }, 500);

      }

      return;
    }

    const nextStep = path.shift();
    const dx = nextStep.x - rover.x;
    const dy = nextStep.y - rover.y;

    rover.x = nextStep.x;
    rover.y = nextStep.y;
    distanceTraveled += Math.abs(dx) + Math.abs(dy);
    animateRoverTo(nextStep.x, nextStep.y, dx, dy);

    battery =
      Math.max(0, battery - 1);
    logLowBattery();

    checkMission();

    updateDisplays();

    routeDisplay.textContent =
      path.length > 0
        ? `${path.length} STEPS`
        : "ARRIVED";

    drawGame();

    if (battery <= 0) {
      stopAuto();
    }

  }, 250 / speedMultiplier);
}

// ===============================
// MANUAL MODE
// ===============================

function setManual() {

  stopAuto();

  const modeChanged = mode !== "MANUAL";
  mode = "MANUAL";
  path = [];

  modeDisplay.textContent = "MANUAL";
  controlDisplay.textContent = "MANUAL";
  routeDisplay.textContent = "NONE";

  updateDisplays();
  drawGame();

  if (modeChanged) {
    addMissionLog("Manual mode enabled.");
  }
}

// ===============================
// STOP AUTO
// ===============================

function stopAuto() {

  if (autoTimer) {

    clearInterval(autoTimer);

    autoTimer = null;

  }
}

// ===============================
// BUTTONS
// ===============================

manualButton.addEventListener(
  "click",
  setManual
);

autoButton.addEventListener(
  "click",
  startAuto
);

resetButton.addEventListener(
  "click",
  resetMission
);

pauseButton.addEventListener("click", () => {
  isPaused = !isPaused;
  pauseButton.setAttribute("aria-pressed", String(isPaused));
  pauseButton.textContent = isPaused ? "RESUME" : "PAUSE";

  if (isPaused) {
    pauseStartedAt = performance.now();
    stopAuto();
    addMissionLog("Simulation paused.");
  } else {
    if (pauseStartedAt !== null) {
      pausedDuration += performance.now() - pauseStartedAt;
      pauseStartedAt = null;
    }
    startAutoTimer();
    addMissionLog("Simulation resumed.");
  }
});

speedSelect.addEventListener("change", () => {
  speedMultiplier = Number(speedSelect.value);
  addMissionLog(`Simulation speed set to ${speedMultiplier}x.`);
  startAutoTimer();
});

newMapButton.addEventListener("click", () => {
  resetMission();
  addMissionLog("New map generated with valid routes to both mission goals.");
});

runAgainButton.addEventListener("click", resetMission);

routeToggle.addEventListener("click", () => {
  showRoute = !showRoute;
  routeToggle.classList.toggle("is-active", showRoute);
  routeToggle.setAttribute("aria-pressed", String(showRoute));
  routeToggle.textContent = `ROUTE: ${showRoute ? "ON" : "OFF"}`;
  drawGame();
});

exploredToggle.addEventListener("click", () => {
  showExplored = !showExplored;
  exploredToggle.classList.toggle("is-active", showExplored);
  exploredToggle.setAttribute("aria-pressed", String(showExplored));
  exploredToggle.textContent = `EXPLORED: ${showExplored ? "ON" : "OFF"}`;
  drawGame();
});

canvas.addEventListener("click", event => {
  if (mode !== "AUTO") {
    missionStatus.textContent =
      "Switch to autonomous mode before setting a destination.";
    return;
  }

  const bounds = canvas.getBoundingClientRect();
  const x = Math.floor(
    ((event.clientX - bounds.left) / bounds.width) * canvas.width / GRID_SIZE
  );
  const y = Math.floor(
    ((event.clientY - bounds.top) / bounds.height) * canvas.height / GRID_SIZE
  );

  if (x < 0 || x >= COLS || y < 0 || y >= ROWS) {
    return;
  }

  const isBlocked = obstacles.some(
    obstacle => obstacle.x === x && obstacle.y === y
  );

  if (isBlocked) {
    missionStatus.textContent = "That destination is blocked by a crater.";
    addMissionLog("Blocked destination selected.");
    return;
  }

  if (x === rover.x && y === rover.y) {
    missionStatus.textContent = "The rover is already at that destination.";
    return;
  }

  customDestination = { x, y };
  addMissionLog(`Custom destination selected at X: ${x + 1}, Y: ${y + 1}.`);
  startAuto();
});

clearLogButton.addEventListener("click", () => {
  missionLogEntries.replaceChildren();
});

// ===============================
// RESET MISSION
// ===============================

function resetMission() {

  stopAuto();
  isPaused = false;
  pauseButton.setAttribute("aria-pressed", "false");
  pauseButton.textContent = "PAUSE";

  mode = "MANUAL";

  rover = {
    x: 1,
    y: 1
  };
  visualRover = { x: rover.x, y: rover.y };
  roverMotion = null;
  roverHeading = 0;

  battery = 100;
  regolith = 0;
  carryingRegolith = false;
  path = [];
  exploredCells = [];
  customDestination = null;
  batteryLowLogged = false;
  batteryEmptyLogged = false;
  missionStartedAt = null;
  pauseStartedAt = null;
  pausedDuration = 0;
  distanceTraveled = 0;
  missionSummary.hidden = true;

  generateObstacles();

  statusDisplay.textContent = "READY";
  controlDisplay.textContent = "MANUAL";
  routeDisplay.textContent = "NONE";

  missionStatus.textContent =
    "Navigate to the regolith collection zone.";
  missionStatus.classList.remove("is-highlighted");

  updateDisplays();

  drawGame();
  addMissionLog("Mission reset. New crater map generated.");
}

// ===============================
// UPDATE SCREEN INFORMATION
// ===============================

function updateDisplays() {

  modeDisplay.textContent = mode;
  modeIndicator.textContent =
    mode === "AUTO"
      ? "AUTONOMOUS NAVIGATION ACTIVE"
      : "MANUAL CONTROL";
  modeIndicator.dataset.mode = mode.toLowerCase();

  manualButton.classList.toggle("is-active", mode === "MANUAL");
  autoButton.classList.toggle("is-active", mode === "AUTO");
  manualButton.setAttribute("aria-pressed", String(mode === "MANUAL"));
  autoButton.setAttribute("aria-pressed", String(mode === "AUTO"));

  batteryDisplay.textContent =
    `${battery}%`;
  batteryBar.style.width = `${battery}%`;
  batteryMeter.setAttribute("aria-valuenow", battery);
  batteryMeter.classList.toggle("is-low", battery <= 25);

  regolithDisplay.textContent =
    regolith;
  positionDisplay.textContent =
    `X: ${rover.x + 1} · Y: ${rover.y + 1}`;
  targetDisplay.textContent =
    statusDisplay.textContent === "MISSION COMPLETE"
      ? "MISSION COMPLETE"
      : customDestination
        ? "CUSTOM DESTINATION"
      : carryingRegolith
        ? "BERM / DUMP ZONE"
        : "REGOLITH ZONE";

}

function logLowBattery() {

  if (battery <= 25 && !batteryLowLogged) {
    addMissionLog(`Battery low at ${battery}%.`);
    batteryLowLogged = true;
  }
}

function getActiveGoal() {
  return customDestination || (carryingRegolith ? dumpZone : regolithZone);
}

function startMissionTracking() {
  if (missionStartedAt === null) {
    missionStartedAt = performance.now();
  }
}

function getElapsedMissionTime() {
  if (missionStartedAt === null) {
    return 0;
  }

  const currentPause = isPaused && pauseStartedAt !== null
    ? performance.now() - pauseStartedAt
    : 0;

  return performance.now() - missionStartedAt - pausedDuration - currentPause;
}

function formatElapsedTime(milliseconds) {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function showMissionSummary() {
  summaryElapsed.textContent = formatElapsedTime(getElapsedMissionTime());
  summaryDistance.textContent = `${distanceTraveled} cells`;
  summarySamples.textContent = regolith;
  summaryBattery.textContent = `${100 - battery}%`;
  missionSummary.hidden = false;
}

// ===============================
// START GAME
// ===============================

generateObstacles();

updateDisplays();

drawGame();

addMissionLog("Mission ready.");

if (!reducedMotion) {
  requestAnimationFrame(renderFrame);
}