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
const batteryDisplay = document.getElementById("batteryDisplay");
const regolithDisplay = document.getElementById("regolithDisplay");

const statusDisplay = document.getElementById("statusDisplay");
const controlDisplay = document.getElementById("controlDisplay");
const routeDisplay = document.getElementById("routeDisplay");
const missionStatus = document.getElementById("missionStatus");

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

  ctx.fillStyle = "#181b1f";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // small lunar surface dots

  ctx.fillStyle = "#25292e";

  for (let x = 15; x < canvas.width; x += 65) {
    for (let y = 20; y < canvas.height; y += 70) {

      ctx.beginPath();
      ctx.arc(x, y, 2, 0, Math.PI * 2);
      ctx.fill();

    }
  }
}

// ===============================
// GRID
// ===============================

function drawGrid() {

  ctx.strokeStyle = "#22262b";
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

    ctx.fillStyle = "#555b63";

    ctx.beginPath();
    ctx.arc(
      centerX,
      centerY,
      GRID_SIZE * 0.28,
      0,
      Math.PI * 2
    );

    ctx.fill();

    ctx.strokeStyle = "#777e87";
    ctx.lineWidth = 2;
    ctx.stroke();

  });
}

// ===============================
// REGOLITH ZONE
// ===============================

function drawRegolithZone() {

  const x = regolithZone.x * GRID_SIZE;
  const y = regolithZone.y * GRID_SIZE;

  ctx.fillStyle = "#8b7755";
  ctx.fillRect(
    x + 4,
    y + 4,
    GRID_SIZE - 8,
    GRID_SIZE - 8
  );

  ctx.fillStyle = "#ffffff";
  ctx.font = "8px Manrope";
  ctx.textAlign = "center";

  ctx.fillText(
    "REGOLITH",
    x + GRID_SIZE / 2,
    y + GRID_SIZE / 2 + 3
  );
}

// ===============================
// DUMP / BERM ZONE
// ===============================

function drawDumpZone() {

  const x = dumpZone.x * GRID_SIZE;
  const y = dumpZone.y * GRID_SIZE;

  ctx.strokeStyle = "#d2d5d9";
  ctx.lineWidth = 3;

  ctx.strokeRect(
    x + 5,
    y + 5,
    GRID_SIZE - 10,
    GRID_SIZE - 10
  );

  ctx.fillStyle = "#ffffff";
  ctx.font = "8px Manrope";
  ctx.textAlign = "center";

  ctx.fillText(
    "BERM",
    x + GRID_SIZE / 2,
    y + GRID_SIZE / 2 + 3
  );
}

// ===============================
// ROVER
// ===============================

function drawRover() {

  const x = rover.x * GRID_SIZE;
  const y = rover.y * GRID_SIZE;

  // Rover body

  ctx.fillStyle = "#f4f4f4";

  ctx.fillRect(
    x + 8,
    y + 10,
    GRID_SIZE - 16,
    GRID_SIZE - 20
  );

  // Wheels

  ctx.fillStyle = "#777";

  ctx.fillRect(x + 4, y + 7, 6, 10);
  ctx.fillRect(x + GRID_SIZE - 10, y + 7, 6, 10);

  ctx.fillRect(x + 4, y + GRID_SIZE - 17, 6, 10);
  ctx.fillRect(
    x + GRID_SIZE - 10,
    y + GRID_SIZE - 17,
    6,
    10
  );

  // Center

  ctx.fillStyle = "#111";

  ctx.beginPath();
  ctx.arc(
    x + GRID_SIZE / 2,
    y + GRID_SIZE / 2,
    4,
    0,
    Math.PI * 2
  );

  ctx.fill();

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

  rover.x = newX;
  rover.y = newY;

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

  ctx.fillStyle =
    "rgba(255, 255, 255, 0.15)";

  path.forEach(step => {

    ctx.fillRect(
      step.x * GRID_SIZE + 14,
      step.y * GRID_SIZE + 14,
      12,
      12
    );

  });
}

// ===============================
// AUTO MODE
// ===============================

function startAuto() {

  stopAuto();

  mode = "AUTO";

  controlDisplay.textContent = "AUTONOMOUS";
  modeDisplay.textContent = "AUTO";

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

    rover.x = nextStep.x;
    rover.y = nextStep.y;

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

  }, 180);
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

  updateDisplays();

  drawGame();
}

// ===============================
// UPDATE SCREEN INFORMATION
// ===============================

function updateDisplays() {

  modeDisplay.textContent = mode;

  batteryDisplay.textContent =
    `${battery}%`;

  regolithDisplay.textContent =
    regolith;

}

// ===============================
// START GAME
// ===============================

generateObstacles();

updateDisplays();

drawGame();