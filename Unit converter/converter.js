const category = document.getElementById("category");
const inputValue = document.getElementById("inputValue");
const resultValue = document.getElementById("resultValue");
const fromUnit = document.getElementById("fromUnit");
const toUnit = document.getElementById("toUnit");
const fullResult = document.getElementById("fullResult");
const conversionDetails = document.getElementById("conversionDetails");
const conversionFormula = document.getElementById("conversionFormula");
const swapButton = document.getElementById("swapButton");
const copyResultButton = document.getElementById("copyResultButton");
const copyStatus = document.getElementById("copyStatus");
const precisionSelect = document.getElementById("precisionSelect");
const allUnitsPanel = document.getElementById("allUnitsPanel");
const allUnitsBody = document.getElementById("allUnitsBody");
const historyList = document.getElementById("historyList");
const clearHistoryButton = document.getElementById("clearHistoryButton");

const units = {
  length: {
    mm: { name: "Millimeter", symbol: "mm", factor: 0.001 },
    cm: { name: "Centimeter", symbol: "cm", factor: 0.01 },
    m: { name: "Meter", symbol: "m", factor: 1 },
    km: { name: "Kilometer", symbol: "km", factor: 1000 },
    in: { name: "Inch", symbol: "in", factor: 0.0254 },
    ft: { name: "Foot", symbol: "ft", factor: 0.3048 },
    yd: { name: "Yard", symbol: "yd", factor: 0.9144 },
    mi: { name: "Mile", symbol: "mi", factor: 1609.344 }
  },
  area: {
    mm2: { name: "Square Millimeter", symbol: "mm²", factor: 0.000001 },
    cm2: { name: "Square Centimeter", symbol: "cm²", factor: 0.0001 },
    m2: { name: "Square Meter", symbol: "m²", factor: 1 },
    km2: { name: "Square Kilometer", symbol: "km²", factor: 1000000 },
    in2: { name: "Square Inch", symbol: "in²", factor: 0.00064516 },
    ft2: { name: "Square Foot", symbol: "ft²", factor: 0.09290304 }
  },
  mass: {
    mg: { name: "Milligram", symbol: "mg", factor: 0.000001 },
    g: { name: "Gram", symbol: "g", factor: 0.001 },
    kg: { name: "Kilogram", symbol: "kg", factor: 1 },
    oz: { name: "Ounce", symbol: "oz", factor: 0.028349523125 },
    lb: { name: "Pound", symbol: "lb", factor: 0.45359237 }
  },
  temperature: {
    C: { name: "Celsius", symbol: "°C" },
    F: { name: "Fahrenheit", symbol: "°F" },
    K: { name: "Kelvin", symbol: "K" }
  },
  pressure: {
    Pa: { name: "Pascal", symbol: "Pa", factor: 1 },
    kPa: { name: "Kilopascal", symbol: "kPa", factor: 1000 },
    MPa: { name: "Megapascal", symbol: "MPa", factor: 1000000 },
    psi: { name: "Pounds per Square Inch", symbol: "psi", factor: 6894.757293168 },
    bar: { name: "Bar", symbol: "bar", factor: 100000 }
  },
  energy: {
    J: { name: "Joule", symbol: "J", factor: 1 },
    kJ: { name: "Kilojoule", symbol: "kJ", factor: 1000 },
    Wh: { name: "Watt-hour", symbol: "Wh", factor: 3600 },
    kWh: { name: "Kilowatt-hour", symbol: "kWh", factor: 3600000 }
  },
  power: {
    W: { name: "Watt", symbol: "W", factor: 1 },
    kW: { name: "Kilowatt", symbol: "kW", factor: 1000 },
    hp: { name: "Horsepower (mechanical)", symbol: "hp (mechanical)", factor: 745.6998715822702 }
  },
  force: {
    N: { name: "Newton", symbol: "N", factor: 1 },
    kN: { name: "Kilonewton", symbol: "kN", factor: 1000 },
    lbf: { name: "Pound-force", symbol: "lbf", factor: 4.4482216152605 }
  },
  volume: {
    mL: { name: "Milliliter", symbol: "mL", factor: 0.000001 },
    L: { name: "Liter", symbol: "L", factor: 0.001 },
    m3: { name: "Cubic Meter", symbol: "m³", factor: 1 },
    in3: { name: "Cubic Inch", symbol: "in³", factor: 0.000016387064 },
    ft3: { name: "Cubic Foot", symbol: "ft³", factor: 0.028316846592 },
    galUS: { name: "US Gallon", symbol: "gal US", factor: 0.003785411784 }
  },
  speed: {
    ms: { name: "Meters per Second", symbol: "m/s", factor: 1 },
    kmh: { name: "Kilometers per Hour", symbol: "km/h", factor: 1 / 3.6 },
    mph: { name: "Miles per Hour", symbol: "mph", factor: 0.44704 },
    fts: { name: "Feet per Second", symbol: "ft/s", factor: 0.3048 }
  },
  torque: {
    Nm: { name: "Newton-meter", symbol: "N·m", factor: 1 },
    lbfft: { name: "Pound-force Foot", symbol: "lbf·ft", factor: 1.3558179483314004 }
  },
  angle: {
    deg: { name: "Degree", symbol: "deg", factor: Math.PI / 180 },
    rad: { name: "Radian", symbol: "rad", factor: 1 }
  }
};

const nonNegativeCategories = new Set([
  "length",
  "area",
  "mass",
  "pressure",
  "energy",
  "power",
  "volume",
  "speed"
]);

const sessionHistory = [];

function loadUnits(selectedFrom, selectedTo) {
  const availableUnits = units[category.value];
  fromUnit.replaceChildren();
  toUnit.replaceChildren();

  Object.entries(availableUnits).forEach(([key, unit]) => {
    const fromOption = new Option(`${unit.name} (${unit.symbol})`, key);
    const toOption = new Option(`${unit.name} (${unit.symbol})`, key);
    fromUnit.add(fromOption);
    toUnit.add(toOption);
  });

  fromUnit.value = selectedFrom && availableUnits[selectedFrom]
    ? selectedFrom
    : fromUnit.options[0].value;
  toUnit.value = selectedTo && availableUnits[selectedTo]
    ? selectedTo
    : toUnit.options[Math.min(1, toUnit.options.length - 1)].value;

  convert({ record: false });
}

function standardConversion(value, from, to, selectedCategory = category.value) {
  const fromFactor = units[selectedCategory][from].factor;
  const toFactor = units[selectedCategory][to].factor;
  return (value * fromFactor) / toFactor;
}

function temperatureConversion(value, from, to) {
  let celsius;

  if (from === "C") celsius = value;
  if (from === "F") celsius = (value - 32) * 5 / 9;
  if (from === "K") celsius = value - 273.15;

  if (to === "C") return celsius;
  if (to === "F") return (celsius * 9 / 5) + 32;
  return celsius + 273.15;
}

function convertValue(value, selectedCategory, from, to) {
  return selectedCategory === "temperature"
    ? temperatureConversion(value, from, to)
    : standardConversion(value, from, to, selectedCategory);
}

function getPrecision() {
  return precisionSelect.value === "auto"
    ? null
    : Number(precisionSelect.value);
}

function formatNumber(value) {
  if (!Number.isFinite(value)) return "";

  const precision = getPrecision();
  const absoluteValue = Math.abs(value);
  const digits = precision === null ? 6 : precision;

  if (absoluteValue > 0 && (absoluteValue >= 1000000000 || absoluteValue < 0.000001)) {
    return value.toExponential(digits);
  }

  if (precision !== null) {
    return value.toLocaleString("en-US", {
      minimumFractionDigits: precision,
      maximumFractionDigits: precision
    });
  }

  return Number(value.toFixed(6)).toLocaleString("en-US", {
    maximumFractionDigits: 6
  });
}

function getTemperatureInCelsius(value, from) {
  return temperatureConversion(value, from, "C");
}

function getValidationMessage(value, selectedCategory, from) {
  if (!Number.isFinite(value)) {
    return "Enter a finite numeric value to convert.";
  }

  if (selectedCategory === "temperature" && getTemperatureInCelsius(value, from) < -273.15) {
    return "Temperature cannot be below absolute zero.";
  }

  if (value < 0 && nonNegativeCategories.has(selectedCategory)) {
    return `Negative ${selectedCategory} values are not supported.`;
  }

  return "";
}

function setEmptyState(message, details) {
  resultValue.value = "";
  resultValue.removeAttribute("data-raw-value");
  fullResult.textContent = message;
  conversionDetails.textContent = details;
  conversionFormula.textContent = "The conversion formula will appear here.";
  allUnitsPanel.hidden = true;
  allUnitsBody.replaceChildren();
}

function getTemperatureFormula(from, to) {
  const formulas = {
    "C-F": "°F = °C × 9/5 + 32",
    "F-C": "°C = (°F − 32) × 5/9",
    "C-K": "K = °C + 273.15",
    "K-C": "°C = K − 273.15",
    "F-K": "K = (°F − 32) × 5/9 + 273.15",
    "K-F": "°F = (K − 273.15) × 9/5 + 32"
  };

  return from === to
    ? "The selected temperature units are the same."
    : formulas[`${from}-${to}`];
}

function getFormula(selectedCategory, from, to) {
  if (selectedCategory === "temperature") {
    return getTemperatureFormula(from, to);
  }

  const factor = units[selectedCategory][from].factor / units[selectedCategory][to].factor;
  return `1 ${units[selectedCategory][from].symbol} = ${formatNumber(factor)} ${units[selectedCategory][to].symbol}`;
}

function renderAllUnits(value, selectedCategory, from) {
  const availableUnits = units[selectedCategory];
  allUnitsBody.replaceChildren();

  Object.entries(availableUnits).forEach(([key, unit]) => {
    if (key === from) return;

    const row = document.createElement("tr");
    row.tabIndex = 0;
    row.setAttribute("role", "button");
    row.setAttribute("aria-label", `Set ${unit.name} as the destination unit`);
    row.dataset.unit = key;

    const unitCell = document.createElement("td");
    unitCell.textContent = `${unit.name} (${unit.symbol})`;
    const valueCell = document.createElement("td");
    valueCell.textContent = `${formatNumber(convertValue(value, selectedCategory, from, key))} ${unit.symbol}`;

    row.append(unitCell, valueCell);
    allUnitsBody.append(row);
  });

  allUnitsPanel.hidden = false;
}

function addHistory(record) {
  const previous = sessionHistory[0];
  const isDuplicate = previous &&
    previous.category === record.category &&
    previous.value === record.value &&
    previous.from === record.from &&
    previous.to === record.to;

  if (!isDuplicate) {
    sessionHistory.unshift(record);
    sessionHistory.splice(5);
  }

  renderHistory();
}

function renderHistory() {
  historyList.replaceChildren();

  sessionHistory.forEach(record => {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.category = record.category;
    button.dataset.value = record.value;
    button.dataset.from = record.from;
    button.dataset.to = record.to;
    button.textContent = `${formatNumber(record.value)} ${units[record.category][record.from].symbol} → ${formatNumber(record.result)} ${units[record.category][record.to].symbol}`;

    const item = document.createElement("li");
    item.append(button);
    historyList.append(item);
  });
}

function convert({ record = true } = {}) {
  const rawValue = inputValue.value.trim();

  if (rawValue === "" || rawValue === "-") {
    setEmptyState(
      "Enter a value to begin.",
      "Select your units and the converter will calculate the result."
    );
    return;
  }

  const value = Number(rawValue);
  const selectedCategory = category.value;
  const from = fromUnit.value;
  const to = toUnit.value;
  const validationMessage = getValidationMessage(value, selectedCategory, from);

  if (validationMessage) {
    setEmptyState("Check the input value.", validationMessage);
    return;
  }

  const result = convertValue(value, selectedCategory, from, to);
  const fromInfo = units[selectedCategory][from];
  const toInfo = units[selectedCategory][to];

  if (!Number.isFinite(result)) {
    setEmptyState("That value cannot be displayed.", "Try a smaller finite number.");
    return;
  }

  const formattedInput = formatNumber(value);
  const formattedResult = formatNumber(result);
  resultValue.value = formattedResult;
  resultValue.dataset.rawValue = String(result);
  fullResult.textContent = `${formattedInput} ${fromInfo.symbol} = ${formattedResult} ${toInfo.symbol}`;
  conversionDetails.textContent =
    `${formattedInput} ${fromInfo.name.toLowerCase()} converts to ${formattedResult} ${toInfo.name.toLowerCase()}.`;
  conversionFormula.textContent = `Formula: ${getFormula(selectedCategory, from, to)}`;
  renderAllUnits(value, selectedCategory, from);

  if (record) {
    addHistory({ category: selectedCategory, value, from, to, result });
  }
}

function swapUnits() {
  const oldFrom = fromUnit.value;
  fromUnit.value = toUnit.value;
  toUnit.value = oldFrom;

  if (resultValue.dataset.rawValue) {
    inputValue.value = resultValue.dataset.rawValue;
  }

  swapButton.classList.remove("is-swapped");
  void swapButton.offsetWidth;
  swapButton.classList.add("is-swapped");
  setTimeout(() => swapButton.classList.remove("is-swapped"), 300);
  convert();
}

function reloadHistory(record) {
  category.value = record.category;
  loadUnits(record.from, record.to);
  inputValue.value = record.value;
  convert({ record: false });
}

function copyResult() {
  if (!resultValue.dataset.rawValue) {
    copyStatus.textContent = "Enter a valid value first.";
    return;
  }

  const text = `${resultValue.value} ${units[category.value][toUnit.value].symbol}`;

  if (!navigator.clipboard || !navigator.clipboard.writeText) {
    copyStatus.textContent = "Copy is unavailable. Select the result manually.";
    return;
  }

  navigator.clipboard.writeText(text).then(() => {
    copyStatus.textContent = "Copied!";
  }).catch(() => {
    copyStatus.textContent = "Copy failed. Select the result manually.";
  });
}

document.querySelectorAll(".quick-buttons button").forEach(button => {
  button.addEventListener("click", () => {
    category.value = button.dataset.category;
    loadUnits(button.dataset.from, button.dataset.to);
    inputValue.value = button.dataset.value;
    convert();
  });
});

category.addEventListener("change", () => loadUnits());
inputValue.addEventListener("input", () => convert());
fromUnit.addEventListener("change", () => convert());
toUnit.addEventListener("change", () => convert());
precisionSelect.addEventListener("change", () => convert({ record: false }));
swapButton.addEventListener("click", swapUnits);
copyResultButton.addEventListener("click", copyResult);

allUnitsBody.addEventListener("click", event => {
  const row = event.target.closest("tr[data-unit]");
  if (!row) return;
  toUnit.value = row.dataset.unit;
  convert();
});

allUnitsBody.addEventListener("keydown", event => {
  if (event.key !== "Enter" && event.key !== " ") return;
  const row = event.target.closest("tr[data-unit]");
  if (!row) return;
  event.preventDefault();
  toUnit.value = row.dataset.unit;
  convert();
});

historyList.addEventListener("click", event => {
  const button = event.target.closest("button[data-category]");
  if (!button) return;
  reloadHistory({
    category: button.dataset.category,
    value: Number(button.dataset.value),
    from: button.dataset.from,
    to: button.dataset.to
  });
});

clearHistoryButton.addEventListener("click", () => {
  sessionHistory.length = 0;
  renderHistory();
});

loadUnits();
