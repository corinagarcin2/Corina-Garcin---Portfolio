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

// ===============================
// CREATE LUNAR TERRAIN
// ===============================

function generateObstacles() {

  obstacles = [];

  const numberOfObstacles = 38;

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
}

// ===============================
// DRAW GAME
// ===============================

function drawGame() {

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawBackground();
  drawGrid();
  drawPath();
  drawObstacles();
  drawRegolithZone();
  drawDumpZone();
  drawRover();

}

// ===============================
// BACKGROUND
// ===============================

function drawBackground() {

  const terrain = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  terrain.addColorStop(0, "#d0d4dc");
  terrain.addColorStop(0.52, "#b6bdc8");
  terrain.addColorStop(1, "#9da7b5");
  ctx.fillStyle = terrain;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let i = 0; i < 105; i++) {
    const x = (i * 73 + 19) % canvas.width;
    const y = (i * 137 + 41) % canvas.height;
    const radius = 0.7 + (i % 4) * 0.45;
    ctx.fillStyle = i % 3 === 0
      ? "rgba(72, 83, 99, 0.13)"
      : "rgba(255, 255, 255, 0.2)";
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  for (let i = 0; i < 14; i++) {
    const x = (i * 181 + 70) % canvas.width;
    const y = (i * 97 + 56) % canvas.height;
    const radius = 8 + (i % 3) * 4;
    ctx.fillStyle = "rgba(91, 104, 121, 0.045)";
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ===============================
// GRID
// ===============================

function drawGrid() {

  ctx.strokeStyle = "rgba(48, 63, 82, 0.12)";
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

// ===============================
// OBSTACLES
// ===============================

function drawObstacles() {

  obstacles.forEach(obstacle => {

    const centerX = obstacle.x * GRID_SIZE + GRID_SIZE / 2;
    const centerY = obstacle.y * GRID_SIZE + GRID_SIZE / 2;
    const radius = GRID_SIZE * 0.34;

    ctx.save();
    ctx.shadowColor = "rgba(38, 48, 65, 0.28)";
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 3;

    const rim = ctx.createRadialGradient(
      centerX - 4, centerY - 5, radius * 0.18,
      centerX, centerY, radius
    );
    rim.addColorStop(0, "#465262");
    rim.addColorStop(0.58, "#596577");
    rim.addColorStop(0.78, "#929dab");
    rim.addColorStop(1, "#788493");

    ctx.fillStyle = rim;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.strokeStyle = "rgba(243, 247, 251, 0.52)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(centerX - 1, centerY - 1, radius * 0.78, Math.PI * 1.04, Math.PI * 1.9);
    ctx.stroke();

    ctx.fillStyle = "rgba(24, 34, 49, 0.45)";
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

  ctx.fillStyle = "rgba(255, 204, 102, 0.18)";
  ctx.fillRect(x + 2, y + 2, GRID_SIZE - 4, GRID_SIZE - 4);
  ctx.strokeStyle = "rgba(181, 119, 47, 0.88)";
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x + 3, y + 3, GRID_SIZE - 6, GRID_SIZE - 6);

  ctx.save();
  ctx.shadowColor = "rgba(255, 190, 78, 0.5)";
  ctx.shadowBlur = 7 + pulse * 5;
  ctx.strokeStyle = `rgba(255, 204, 102, ${0.45 + pulse * 0.35})`;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(centerX, centerY, 8 + pulse * 3, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  ctx.fillStyle = "#75522d";
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

  ctx.fillStyle = "rgba(78, 185, 207, 0.12)";
  ctx.fillRect(x + 3, y + 3, GRID_SIZE - 6, GRID_SIZE - 6);
  ctx.strokeStyle = "rgba(37, 130, 154, 0.95)";
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 5, y + 5, GRID_SIZE - 10, GRID_SIZE - 10);

  ctx.save();
  ctx.shadowColor = "rgba(107, 231, 255, 0.6)";
  ctx.shadowBlur = 5 + pulse * 5;
  ctx.strokeStyle = `rgba(61, 185, 211, ${0.52 + pulse * 0.35})`;
  ctx.beginPath();
  ctx.arc(centerX, centerY, 7 + pulse * 3, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  ctx.fillStyle = "#245d6c";
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

  ctx.fillStyle = "rgba(34, 54, 78, 0.28)";
  ctx.beginPath();
  ctx.ellipse(1, 4, 14, 12, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.shadowColor = "rgba(72, 206, 236, 0.72)";
  ctx.shadowBlur = 12;
  ctx.fillStyle = "#293849";
  ctx.fillRect(-13, -11, 5, 9);
  ctx.fillRect(8, -11, 5, 9);
  ctx.fillRect(-13, 3, 5, 9);
  ctx.fillRect(8, 3, 5, 9);
  ctx.shadowBlur = 0;

  ctx.fillStyle = "#eef5fb";
  ctx.fillRect(-9, -12, 18, 24);
  ctx.strokeStyle = "#5c7187";
  ctx.lineWidth = 1;
  ctx.strokeRect(-9, -12, 18, 24);

  ctx.fillStyle = "#6389a8";
  ctx.fillRect(-6, -7, 12, 8);
  ctx.fillStyle = "#6be7ff";
  ctx.fillRect(-4, -5, 3, 3);
  ctx.fillRect(2, -5, 3, 3);

  ctx.strokeStyle = "#344c61";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, -12);
  ctx.lineTo(0, -17);
  ctx.stroke();
  ctx.fillStyle = "#ffcc66";
  ctx.beginPath();
  ctx.arc(0, -18, 2, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#1a2938";
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

  if (mode !== "MANUAL") {
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

  rover.x = newX;
  rover.y = newY;
  animateRoverTo(newX, newY, dx, dy);

  battery = Math.max(0, battery - 1);

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

  if (path.length === 0) {
    return;
  }

  const points = [
    { x: rover.x + 0.5, y: rover.y + 0.5 },
    ...path.map(step => ({ x: step.x + 0.5, y: step.y + 0.5 }))
  ];

  ctx.save();
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.strokeStyle = "rgba(40, 177, 211, 0.78)";
  ctx.lineWidth = 3;
  ctx.shadowColor = "rgba(34, 187, 224, 0.68)";
  ctx.shadowBlur = 8;
  ctx.beginPath();
  ctx.moveTo(points[0].x * GRID_SIZE, points[0].y * GRID_SIZE);

  points.slice(1).forEach(point => {
    ctx.lineTo(point.x * GRID_SIZE, point.y * GRID_SIZE);
  });

  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.fillStyle = "#e8fbff";

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

// ===============================
// AUTO MODE
// ===============================

function startAuto() {

  stopAuto();

  mode = "AUTO";

  controlDisplay.textContent = "AUTONOMOUS";
  modeDisplay.textContent = "AUTO";
  updateDisplays();

  const goal =
    carryingRegolith
      ? dumpZone
      : regolithZone;

  path = findPath(rover, goal);

  if (path.length === 0) {

    statusDisplay.textContent = "NO ROUTE";

    routeDisplay.textContent = "BLOCKED";

    missionStatus.textContent =
      "Autonomous navigation could not find a safe route.";

    setManual();

    return;
  }

  routeDisplay.textContent =
    `${path.length} STEPS`;

  statusDisplay.textContent =
    "NAVIGATING";

  missionStatus.textContent =
    carryingRegolith
      ? "Autonomous route calculated to berm zone."
      : "Autonomous route calculated to regolith zone.";

  drawGame();

  autoTimer = setInterval(() => {

    if (path.length === 0) {

      stopAuto();

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
    animateRoverTo(nextStep.x, nextStep.y, dx, dy);

    battery =
      Math.max(0, battery - 1);

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

  }, 250);
}

// ===============================
// MANUAL MODE
// ===============================

function setManual() {

  stopAuto();

  mode = "MANUAL";
  path = [];

  modeDisplay.textContent = "MANUAL";
  controlDisplay.textContent = "MANUAL";
  routeDisplay.textContent = "NONE";

  updateDisplays();
  drawGame();
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

// ===============================
// RESET MISSION
// ===============================

function resetMission() {

  stopAuto();

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

  generateObstacles();

  statusDisplay.textContent = "READY";
  controlDisplay.textContent = "MANUAL";
  routeDisplay.textContent = "NONE";

  missionStatus.textContent =
    "Navigate to the regolith collection zone.";
  missionStatus.classList.remove("is-highlighted");

  updateDisplays();

  drawGame();
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
      : carryingRegolith
        ? "BERM / DUMP ZONE"
        : "REGOLITH ZONE";

}

// ===============================
// START GAME
// ===============================

generateObstacles();

updateDisplays();

drawGame();

if (!reducedMotion) {
  requestAnimationFrame(renderFrame);
}