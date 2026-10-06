// ==========================================
// ENGINEERING UNIT CONVERTER
// Corina Garcin
// ==========================================

const category = document.getElementById("category");
const inputValue = document.getElementById("inputValue");
const resultValue = document.getElementById("resultValue");
const fromUnit = document.getElementById("fromUnit");
const toUnit = document.getElementById("toUnit");

const fullResult = document.getElementById("fullResult");
const conversionDetails = document.getElementById("conversionDetails");

const swapButton = document.getElementById("swapButton");


// ==========================================
// UNIT INFORMATION
// ==========================================

const units = {

  length: {
    mm: { name: "Millimeter", symbol: "mm", factor: 0.001 },
    cm: { name: "Centimeter", symbol: "cm", factor: 0.01 },
    m:  { name: "Meter", symbol: "m", factor: 1 },
    km: { name: "Kilometer", symbol: "km", factor: 1000 },

    in: { name: "Inch", symbol: "in", factor: 0.0254 },
    ft: { name: "Foot", symbol: "ft", factor: 0.3048 },
    yd: { name: "Yard", symbol: "yd", factor: 0.9144 },
    mi: { name: "Mile", symbol: "mi", factor: 1609.344 }
  },


  area: {
    mm2: {
      name: "Square Millimeter",
      symbol: "mm²",
      factor: 0.000001
    },

    cm2: {
      name: "Square Centimeter",
      symbol: "cm²",
      factor: 0.0001
    },

    m2: {
      name: "Square Meter",
      symbol: "m²",
      factor: 1
    },

    km2: {
      name: "Square Kilometer",
      symbol: "km²",
      factor: 1000000
    },

    in2: {
      name: "Square Inch",
      symbol: "in²",
      factor: 0.00064516
    },

    ft2: {
      name: "Square Foot",
      symbol: "ft²",
      factor: 0.09290304
    }
  },


  mass: {
    mg: {
      name: "Milligram",
      symbol: "mg",
      factor: 0.000001
    },

    g: {
      name: "Gram",
      symbol: "g",
      factor: 0.001
    },

    kg: {
      name: "Kilogram",
      symbol: "kg",
      factor: 1
    },

    oz: {
      name: "Ounce",
      symbol: "oz",
      factor: 0.028349523125
    },

    lb: {
      name: "Pound",
      symbol: "lb",
      factor: 0.45359237
    }
  },


  pressure: {
    Pa: {
      name: "Pascal",
      symbol: "Pa",
      factor: 1
    },

    kPa: {
      name: "Kilopascal",
      symbol: "kPa",
      factor: 1000
    },

    MPa: {
      name: "Megapascal",
      symbol: "MPa",
      factor: 1000000
    },

    psi: {
      name: "Pounds per Square Inch",
      symbol: "psi",
      factor: 6894.757293
    },

    bar: {
      name: "Bar",
      symbol: "bar",
      factor: 100000
    }
  },


  energy: {
    J: {
      name: "Joule",
      symbol: "J",
      factor: 1
    },

    kJ: {
      name: "Kilojoule",
      symbol: "kJ",
      factor: 1000
    },

    Wh: {
      name: "Watt-hour",
      symbol: "Wh",
      factor: 3600
    },

    kWh: {
      name: "Kilowatt-hour",
      symbol: "kWh",
      factor: 3600000
    }
  },


  power: {
    W: {
      name: "Watt",
      symbol: "W",
      factor: 1
    },

    kW: {
      name: "Kilowatt",
      symbol: "kW",
      factor: 1000
    },

    hp: {
      name: "Horsepower",
      symbol: "hp",
      factor: 745.699872
    }
  },


  temperature: {
    C: {
      name: "Celsius",
      symbol: "°C"
    },

    F: {
      name: "Fahrenheit",
      symbol: "°F"
    },

    K: {
      name: "Kelvin",
      symbol: "K"
    }
  }

};


// ==========================================
// LOAD UNITS INTO DROPDOWNS
// ==========================================

function loadUnits() {

  const selectedCategory = category.value;

  fromUnit.innerHTML = "";
  toUnit.innerHTML = "";

  const availableUnits = units[selectedCategory];

  Object.keys(availableUnits).forEach((key) => {

    const unit = availableUnits[key];

    const fromOption = document.createElement("option");
    fromOption.value = key;
    fromOption.textContent =
      `${unit.name} (${unit.symbol})`;

    const toOption = document.createElement("option");
    toOption.value = key;
    toOption.textContent =
      `${unit.name} (${unit.symbol})`;

    fromUnit.appendChild(fromOption);
    toUnit.appendChild(toOption);

  });


  // Automatically choose different units

  if (toUnit.options.length > 1) {
    toUnit.selectedIndex = 1;
  }

  convert();

}


// ==========================================
// NORMAL CONVERSIONS
// ==========================================

function standardConversion(value, from, to) {

  const selectedCategory = category.value;

  const fromFactor =
    units[selectedCategory][from].factor;

  const toFactor =
    units[selectedCategory][to].factor;

  const baseValue =
    value * fromFactor;

  return baseValue / toFactor;

}


// ==========================================
// TEMPERATURE CONVERSIONS
// ==========================================

function temperatureConversion(value, from, to) {

  let celsius;


  // Convert starting unit to Celsius

  if (from === "C") {

    celsius = value;

  }

  else if (from === "F") {

    celsius =
      (value - 32) * 5 / 9;

  }

  else if (from === "K") {

    celsius =
      value - 273.15;

  }


  // Convert Celsius to destination

  if (to === "C") {

    return celsius;

  }

  if (to === "F") {

    return (
      celsius * 9 / 5
    ) + 32;

  }

  if (to === "K") {

    return celsius + 273.15;

  }

}


// ==========================================
// FORMAT NUMBERS
// ==========================================

function formatNumber(number) {

  if (!Number.isFinite(number)) {
    return "";
  }

  if (
    Math.abs(number) > 0 &&
    Math.abs(number) < 0.000001
  ) {

    return number.toExponential(6);

  }

  return parseFloat(
    number.toFixed(6)
  ).toLocaleString("en-US", {
    maximumFractionDigits: 6
  });

}


// ==========================================
// CONVERT
// ==========================================

function convert() {

  const value =
    parseFloat(inputValue.value);

  if (Number.isNaN(value)) {

    resultValue.value = "";

    fullResult.textContent =
      "Enter a value to begin.";

    conversionDetails.textContent =
      "Select your units and the converter will calculate the result.";

    return;

  }


  const selectedCategory =
    category.value;

  const from =
    fromUnit.value;

  const to =
    toUnit.value;


  let result;


  if (selectedCategory === "temperature") {

    result =
      temperatureConversion(
        value,
        from,
        to
      );

  }

  else {

    result =
      standardConversion(
        value,
        from,
        to
      );

  }


  const formattedResult =
    formatNumber(result);

  const fromInfo =
    units[selectedCategory][from];

  const toInfo =
    units[selectedCategory][to];


  // Output box

  resultValue.value =
    formattedResult;


  // Large result

  fullResult.textContent =
    `${formatNumber(value)} ${fromInfo.symbol} = ${formattedResult} ${toInfo.symbol}`;


  // Explanation underneath

  conversionDetails.textContent =
    `${formatNumber(value)} ${fromInfo.name.toLowerCase()} converts to ${formattedResult} ${toInfo.name.toLowerCase()}.`;

}


// ==========================================
// SWAP UNITS
// ==========================================

function swapUnits() {

  const oldFrom =
    fromUnit.value;

  fromUnit.value =
    toUnit.value;

  toUnit.value =
    oldFrom;


  // Put previous answer back into input

  if (resultValue.value !== "") {

    const previousResult =
      resultValue.value.replace(/,/g, "");

    inputValue.value =
      previousResult;

  }

  convert();

}


// ==========================================
// QUICK CONVERSIONS
// ==========================================

document
  .querySelectorAll(".quick-buttons button")
  .forEach((button) => {

    button.addEventListener(
      "click",
      () => {

        const selectedCategory =
          button.dataset.category;

        const value =
          button.dataset.value;

        const from =
          button.dataset.from;

        const to =
          button.dataset.to;


        category.value =
          selectedCategory;

        loadUnits();


        inputValue.value =
          value;

        fromUnit.value =
          from;

        toUnit.value =
          to;

        convert();

      }
    );

  });


// ==========================================
// EVENT LISTENERS
// ==========================================

category.addEventListener(
  "change",
  loadUnits
);

inputValue.addEventListener(
  "input",
  convert
);

fromUnit.addEventListener(
  "change",
  convert
);

toUnit.addEventListener(
  "change",
  convert
);

swapButton.addEventListener(
  "click",
  swapUnits
);


// ==========================================
// START CONVERTER
// ==========================================

loadUnits();