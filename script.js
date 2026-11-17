const DEFAULT_INGREDIENTS = [
  { name: "Bread flour", role: "flour", amount: "", bakerPercent: 0 },
  { name: "All-purpose flour", role: "flour", amount: "", bakerPercent: 0 },
  { name: "Water", role: "other", amount: "", bakerPercent: 0 },
  { name: "Milk", role: "other", amount: "", bakerPercent: 0 },
  { name: "Sugar", role: "other", amount: "", bakerPercent: 0 },
  { name: "Salt", role: "other", amount: "", bakerPercent: 0 },
  { name: "Butter", role: "other", amount: "", bakerPercent: 0 },
  { name: "Oil", role: "other", amount: "", bakerPercent: 0 }
];

const STORAGE_KEY = "pandeCalc.recipe.v1";

let ingredients = loadIngredients();

let inputMode = "grams";
let currentPlan = "same";

const rows = document.getElementById("ingredientRows");
const bakerRows = document.getElementById("bakerRows");

const gramsMode = document.getElementById("gramsMode");
const bakersMode = document.getElementById("bakersMode");

const gramsModeBtn = document.getElementById("gramsModeBtn");
const bakersModeBtn = document.getElementById("bakersModeBtn");

const totalFlour = document.getElementById("totalFlour");
const starterResult = document.getElementById("starterResult");

const percentageSlider =
  document.getElementById("starterPercentage");

const percentageValue =
  document.getElementById("percentageValue");

const pieceCount =
  document.getElementById("pieceCount");

const pieceWeight =
  document.getElementById("pieceWeight");

const wastagePercent =
  document.getElementById("wastagePercent");

const bakersFlourWeight =
  document.getElementById("bakersFlourWeight");


/* =========================================================
   LOAD / SAVE
========================================================= */

function loadIngredients() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (saved) {
      const parsed = JSON.parse(saved);

      if (Array.isArray(parsed)) {
        return parsed.map(item => ({
          name: item.name || "Ingredient",
          role: item.role === "flour" ? "flour" : "other",
          amount: item.amount ?? "",
          bakerPercent: Number(item.bakerPercent) || 0
        }));
      }
    }

  } catch (error) {
    console.warn("Could not load saved recipe.", error);
  }

  return DEFAULT_INGREDIENTS.map(item => ({ ...item }));
}


function saveIngredients() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(ingredients)
  );
}


/* =========================================================
   NUMBER HELPERS
========================================================= */

function number(value) {
  const result = Number(value);

  return Number.isFinite(result)
    ? result
    : 0;
}


function positiveNumber(value) {
  const result = number(value);

  return result > 0 ? result : 0;
}


function formatNumber(value) {
  return new Intl.NumberFormat(undefined, {
    maximumFractionDigits: 1
  }).format(value);
}


/* =========================================================
   GRAMS MODE
========================================================= */

function renderIngredients() {

  rows.innerHTML = "";

  ingredients.forEach((item, index) => {

    const row = document.createElement("div");
    row.className = "ingredient-row";

    const name = document.createElement("div");
    name.className = "ingredient-name";
    name.textContent = item.name;

    const input = document.createElement("input");

    input.type = "number";
    input.min = "0";
    input.step = "any";
    input.placeholder = "0";
    input.className = "amount";
    input.value = item.amount ?? "";

    input.setAttribute(
      "aria-label",
      item.name + " amount in grams"
    );

    input.addEventListener("input", () => {

      ingredients[index].amount = input.value;

      saveIngredients();
      calculate();

    });


    const remove = createRemoveButton(index);

    row.append(name, input, remove);

    rows.appendChild(row);

  });
}


/* =========================================================
   BAKER'S % MODE
========================================================= */

function renderBakerRows() {

  bakerRows.innerHTML = "";

  ingredients.forEach((item, index) => {

    const row = document.createElement("div");

    row.className = "baker-row";

    const name = document.createElement("div");

    name.className = "ingredient-name";

    name.textContent = item.name;


    const input = document.createElement("input");

    input.type = "number";
    input.min = "0";
    input.step = "any";
    input.placeholder =
      item.role === "flour" ? "0" : "0";

    input.className = "baker-percent";

    /*
      Flour percentages are editable too.
      This allows recipes with multiple flour types.
    */
    input.value =
      item.bakerPercent || "";


    input.addEventListener("input", () => {

      ingredients[index].bakerPercent =
        input.value;

      saveIngredients();
      calculate();

    });


    const remove = createRemoveButton(index);

    row.append(name, input, remove);

    bakerRows.appendChild(row);

  });
}


function createRemoveButton(index) {

  const remove = document.createElement("button");

  remove.className = "remove";
  remove.type = "button";
  remove.textContent = "×";
  remove.title = "Remove ingredient";

  remove.addEventListener("click", () => {

    ingredients.splice(index, 1);

    saveIngredients();

    renderIngredients();
    renderBakerRows();

    calculate();

  });

  return remove;
}


/* =========================================================
   MODE
========================================================= */

function setInputMode(mode) {

  inputMode = mode;

  const grams =
    mode === "grams";

  gramsMode.classList.toggle(
    "hidden",
    !grams
  );

  bakersMode.classList.toggle(
    "hidden",
    grams
  );

  gramsModeBtn.classList.toggle(
    "active",
    grams
  );

  bakersModeBtn.classList.toggle(
    "active",
    !grams
  );

  calculate();
}


gramsModeBtn.addEventListener(
  "click",
  () => setInputMode("grams")
);


bakersModeBtn.addEventListener(
  "click",
  () => setInputMode("bakers")
);


/* =========================================================
   FLOUR CALCULATIONS
========================================================= */

function getTotalFlourFromGrams() {

  return ingredients
    .filter(item => item.role === "flour")
    .reduce((sum, item) => {

      const amount =
        positiveNumber(item.amount);

      return sum + amount;

    }, 0);
}


function getTotalFlourFromBakers() {

  return positiveNumber(
    bakersFlourWeight.value
  );
}


function getTotalFlour() {

  if (inputMode === "grams") {
    return getTotalFlourFromGrams();
  }

  return getTotalFlourFromBakers();
}


/* =========================================================
   BAKER'S PERCENTAGE
========================================================= */

function getBakerTotalPercent() {

  return ingredients.reduce(
    (sum, item) => {

      return sum +
        positiveNumber(item.bakerPercent);

    },
    0
  );
}


function getBakerIngredientWeight(item) {

  const flour =
    getTotalFlourFromBakers();

  const percent =
    positiveNumber(item.bakerPercent);

  return flour * percent / 100;
}


/*
  In grams mode, calculate Baker's % automatically.
*/
function getAutomaticBakerPercent(item) {

  const totalFlour =
    getTotalFlourFromGrams();

  if (totalFlour <= 0) {
    return 0;
  }

  const grams =
    positiveNumber(item.amount);

  return grams / totalFlour * 100;
}


/* =========================================================
   BASE RECIPE
========================================================= */

/*
  Returns the recipe ingredients excluding starter.

  In grams mode:
      ingredient weight = entered grams

  In Baker's % mode:
      ingredient weight =
      total flour × baker's percentage
*/

function getBaseRecipeIngredients() {

  return ingredients.map(item => {

    let grams = 0;
    let bakerPercent = 0;

    if (inputMode === "grams") {

      grams =
        positiveNumber(item.amount);

      bakerPercent =
        getAutomaticBakerPercent(item);

    } else {

      grams =
        getBakerIngredientWeight(item);

      bakerPercent =
        positiveNumber(item.bakerPercent);

    }

    return {
      name: item.name,
      role: item.role,
      grams,
      bakerPercent
    };

  });
}


function getBaseRecipeWeight() {

  return getBaseRecipeIngredients()
    .reduce(
      (sum, item) => sum + item.grams,
      0
    );
}


/* =========================================================
   BATCH CALCULATION
========================================================= */

function getBatchTargetWeight() {

  const pieces =
    positiveNumber(pieceCount.value);

  const weight =
    positiveNumber(pieceWeight.value);

  const allowance =
    positiveNumber(wastagePercent.value);

  if (pieces <= 0 || weight <= 0) {
    return 0;
  }

  const base =
    pieces * weight;

  return base * (1 + allowance / 100);
}


/*
  Starter is included in the final dough weight.

  Let:
      B = base recipe ingredients
      S = starter
      F = flour in base recipe
      p = starter %

  Starter weight:
      S = F × p / 100

  We scale the complete formula so that:
      B + S = target dough

  Scale factor:
      target / (B + S)
*/
function calculateScaledFormula() {

  const baseIngredients =
    getBaseRecipeIngredients();

  const baseWeight =
    baseIngredients.reduce(
      (sum, item) => sum + item.grams,
      0
    );

  const flourWeight =
    baseIngredients
      .filter(item => item.role === "flour")
      .reduce(
        (sum, item) => sum + item.grams,
        0
      );

  const starterPercent =
    positiveNumber(
      percentageSlider.value
    );

  const starterAtBaseScale =
    flourWeight *
    starterPercent /
    100;

  const completeBaseWeight =
    baseWeight +
    starterAtBaseScale;

  const targetWeight =
    getBatchTargetWeight();

  if (
    completeBaseWeight <= 0 ||
    targetWeight <= 0
  ) {

    return {
      scale: 0,
      flour: 0,
      starter: 0,
      total: 0,
      ingredients: []
    };

  }

  const scale =
    targetWeight /
    completeBaseWeight;


  const scaledIngredients =
    baseIngredients.map(item => ({
      name: item.name,
      role: item.role,
      bakerPercent: item.bakerPercent,
      grams: item.grams * scale
    }));


  const starterWeight =
    starterAtBaseScale * scale;


  const scaledFlour =
    flourWeight * scale;


  return {
    scale,
    flour: scaledFlour,
    starter: starterWeight,
    total: targetWeight,
    ingredients: scaledIngredients
  };
}


/* =========================================================
   BATCH SUMMARY
========================================================= */

function updateBatchSummary() {

  const pieces =
    positiveNumber(pieceCount.value);

  const weight =
    positiveNumber(pieceWeight.value);

  const allowance =
    positiveNumber(wastagePercent.value);


  const baseDough =
    pieces * weight;


  const allowanceWeight =
    baseDough *
    allowance /
    100;


  const total =
    baseDough +
    allowanceWeight;


  document.getElementById(
    "orderSummary"
  ).textContent =
    pieces > 0
      ? formatNumber(pieces) +
        " × " +
        formatNumber(weight) +
        " g"
      : "—";


  document.getElementById(
    "baseDoughRequired"
  ).textContent =
    baseDough > 0
      ? formatNumber(baseDough) + " g"
      : "—";


  document.getElementById(
    "allowanceDough"
  ).textContent =
    allowanceWeight > 0
      ? formatNumber(allowanceWeight) + " g"
      : "0 g";


  document.getElementById(
    "totalDoughRequired"
  ).textContent =
    total > 0
      ? formatNumber(total) + " g"
      : "—";


  document.getElementById(
    "resultDough"
  ).textContent =
    total > 0
      ? formatNumber(total) + " g"
      : "—";


  document.getElementById(
    "resultPieces"
  ).textContent =
    pieces > 0
      ? formatNumber(pieces)
      : "—";


  document.getElementById(
    "resultPieceWeight"
  ).textContent =
    weight > 0
      ? formatNumber(weight) + " g"
      : "—";
}


/* =========================================================
   STARTER RESULT
========================================================= */

function updateStarterResult(result) {

  if (result.total <= 0) {

    starterResult.innerHTML =
      '— <small>g</small>';

    document.getElementById(
      "resultFlour"
    ).textContent = "—";

    document.getElementById(
      "resultDescription"
    ).textContent =
      "Enter your recipe and batch size to calculate.";

    return;
  }


  starterResult.innerHTML =
    formatNumber(result.starter) +
    " <small>g</small>";


  document.getElementById(
    "resultFlour"
  ).textContent =
    formatNumber(result.flour) +
    " g";


  document.getElementById(
    "resultDescription"
  ).textContent =
    "Fully active sourdough starter to add to this batch.";
}


/* =========================================================
   SCALED INGREDIENT TABLE
========================================================= */

function renderScaledIngredients(result) {

  const container =
    document.getElementById(
      "scaledIngredientRows"
    );

  container.innerHTML = "";


  if (result.total <= 0) {

    document.getElementById(
      "scaledTotal"
    ).textContent = "—";

    return;
  }


  result.ingredients.forEach(item => {

    const row =
      document.createElement("div");

    row.className =
      "scaled-row";


    const name =
      document.createElement("div");

    name.className =
      "ingredient-name";

    name.textContent =
      item.name;


    const percent =
      document.createElement("div");

    percent.className =
      "scaled-percent";

    percent.textContent =
      formatNumber(item.bakerPercent) +
      "%";


    const weight =
      document.createElement("div");

    weight.className =
      "scaled-weight";

    weight.textContent =
      formatNumber(item.grams) +
      " g";


    row.append(
      name,
      percent,
      weight
    );


    container.appendChild(row);

  });


  /*
    Starter is deliberately shown separately because it is
    calculated from flour percentage rather than entered
    as one of the user's normal recipe ingredients.
  */

  const starterRow =
    document.createElement("div");

  starterRow.className =
    "scaled-row starter-row";


  const starterName =
    document.createElement("div");

  starterName.className =
    "ingredient-name";

  starterName.textContent =
    "Fully active sourdough starter";


  const starterPercent =
    document.createElement("div");

  starterPercent.className =
    "scaled-percent";

  starterPercent.textContent =
    formatNumber(
      positiveNumber(
        percentageSlider.value
      )
    ) + "%";


  const starterWeight =
    document.createElement("div");

  starterWeight.className =
    "scaled-weight";

  starterWeight.textContent =
    formatNumber(result.starter) +
    " g";


  starterRow.append(
    starterName,
    starterPercent,
    starterWeight
  );


  container.appendChild(
    starterRow
  );


  document.getElementById(
    "scaledTotal"
  ).textContent =
    formatNumber(result.total) +
    " g";
}


/* =========================================================
   MAIN CALCULATION
========================================================= */

function calculate() {

  const percentage =
    positiveNumber(
      percentageSlider.value
    );


  percentageValue.textContent =
    percentage + "%";


  if (inputMode === "grams") {

    const flour =
      getTotalFlourFromGrams();

    totalFlour.textContent =
      formatNumber(flour) +
      " g";

  } else {

    const flour =
      getTotalFlourFromBakers();

    document.getElementById(
      "bakerTotalFlour"
    ).textContent =
      formatNumber(flour) +
      " g";


    document.getElementById(
      "formulaTotalPercent"
    ).textContent =
      formatNumber(
        getBakerTotalPercent()
      ) + "%";

  }


  updateBatchSummary();


  const result =
    calculateScaledFormula();


  updateStarterResult(
    result
  );


  renderScaledIngredients(
    result
  );


  document.getElementById(
    "resultModeLabel"
  ).textContent =
    inputMode === "grams"
      ? "GRAM INPUT"
      : "BAKER'S % INPUT";


  updateExplanation(
    result
  );
}


/* =========================================================
   EXPLANATION
========================================================= */

function updateExplanation(result) {

  const pieces =
    positiveNumber(
      pieceCount.value
    );

  const piece =
    positiveNumber(
      pieceWeight.value
    );

  const percentage =
    positiveNumber(
      percentageSlider.value
    );


  const calculationText =
    document.getElementById(
      "calculationText"
    );

  const explanation =
    document.getElementById(
      "explanation"
    );


  if (
    result.total <= 0
  ) {

    calculationText.textContent =
      "Waiting for your recipe and batch size";

    explanation.textContent =
      "Enter your ingredient formula, number of pieces, and target piece weight to calculate the production batch.";

    return;
  }


  calculationText.textContent =
    formatNumber(pieces) +
    " pieces × " +
    formatNumber(piece) +
    " g";


  explanation.textContent =
    "PANDE-CALC scales your recipe to " +
    formatNumber(result.total) +
    " g of total dough, including " +
    formatNumber(result.starter) +
    " g of fully active sourdough starter at " +
    percentage +
    "%.";
}


/* =========================================================
   PLAN SELECTION
========================================================= */

function selectPlan(plan) {

  currentPlan = plan;


  document.getElementById(
    "sameCard"
  ).classList.toggle(
    "selected",
    plan === "same"
  );


  document.getElementById(
    "overnightCard"
  ).classList.toggle(
    "selected",
    plan === "overnight"
  );


  /*
    Suggested starting percentages.

    Same-day = 20%
    Overnight = 10%

    The slider remains adjustable after selection.
  */

  percentageSlider.value =
    plan === "same"
      ? 20
      : 10;


  calculate();
}


document
  .querySelectorAll(
    'input[name="plan"]'
  )
  .forEach(input => {

    input.addEventListener(
      "change",
      () => {
        selectPlan(
          input.value
        );
      }
    );

  });


/* =========================================================
   INPUT EVENTS
========================================================= */

percentageSlider.addEventListener(
  "input",
  calculate
);


pieceCount.addEventListener(
  "input",
  calculate
);


pieceWeight.addEventListener(
  "input",
  calculate
);


wastagePercent.addEventListener(
  "input",
  calculate
);


bakersFlourWeight.addEventListener(
  "input",
  calculate
);


/* =========================================================
   ADD INGREDIENT — GRAMS
========================================================= */

document
  .getElementById("addBtn")
  .addEventListener("click", () => {

    const name =
      prompt("Enter the ingredient name:");

    if (
      !name ||
      !name.trim()
    ) {
      return;
    }


    const isFlour =
      confirm(
        "Should this ingredient count toward your total flour?\n\n" +
        "Choose OK for flour, or Cancel for other ingredients."
      );


    ingredients.push({
      name: name.trim(),
      role: isFlour
        ? "flour"
        : "other",
      amount: "",
      bakerPercent: 0
    });


    saveIngredients();

    renderIngredients();
    renderBakerRows();

    calculate();

  });


/* =========================================================
   ADD INGREDIENT — BAKER'S %
========================================================= */

document
  .getElementById("addBakerBtn")
  .addEventListener("click", () => {

    const name =
      prompt("Enter the ingredient name:");

    if (
      !name ||
      !name.trim()
    ) {
      return;
    }


    const isFlour =
      confirm(
        "Should this ingredient count toward your total flour?\n\n" +
        "Choose OK for flour, or Cancel for other ingredients."
      );


    ingredients.push({
      name: name.trim(),
      role: isFlour
        ? "flour"
        : "other",
      amount: "",
      bakerPercent: 0
    });


    saveIngredients();

    renderIngredients();
    renderBakerRows();

    calculate();

  });


/* =========================================================
   RESET
========================================================= */

document
  .getElementById("resetBtn")
  .addEventListener("click", () => {

    const confirmed =
      confirm(
        "Reset all ingredient quantities and restore the original ingredient list?"
      );


    if (!confirmed) {
      return;
    }


    ingredients =
      DEFAULT_INGREDIENTS.map(
        item => ({ ...item })
      );


    saveIngredients();

    renderIngredients();
    renderBakerRows();

    pieceCount.value = "";
    pieceWeight.value = "";
    wastagePercent.value = "0";

    bakersFlourWeight.value = "";

    setInputMode("grams");

    selectPlan("same");

    calculate();

  });


/* =========================================================
   INITIALIZE
========================================================= */

renderIngredients();
renderBakerRows();

calculate();


/* =========================================================
   SERVICE WORKER
========================================================= */

if (
  "serviceWorker" in navigator
) {

  window.addEventListener(
    "load",
    () => {

      navigator.serviceWorker
        .register("./service-worker.js")
        .then(() => {
          console.log(
            "PANDE-CALC service worker registered."
          );
        })
        .catch(error => {
          console.warn(
            "Service worker registration failed:",
            error
          );
        });

    }
  );

}


/* =========================================================
   ONLINE / OFFLINE STATUS
========================================================= */

function updateOnlineStatus() {

  const status =
    document.getElementById(
      "offlineStatus"
    );

  if (navigator.onLine) {

    status.textContent =
      "Online";

  } else {

    status.textContent =
      "Offline-ready";

  }
}


window.addEventListener(
  "online",
  updateOnlineStatus
);

window.addEventListener(
  "offline",
  updateOnlineStatus
);

updateOnlineStatus();