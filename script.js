/* =========================================================
   PANDE-CALC
   Pandesal Recipe & Batch Calculator
========================================================= */

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
const LEAVENING_STORAGE_KEY = "pandeCalc.leavening.v1";
const INSTANT_YEAST_GRAMS_PER_TSP = 3.1;

const DEFAULT_LEAVENING_SETTINGS = {
  method: "sourdough",
  starterPercent: { same: 20, overnight: 10 },
  instantYeastPercent: { same: 1.25, overnight: 0.30 },
  instantYeastGrams: 0,
  instantInputMode: "manual",
  instantUnit: "g",
  activeDryYeastPercent: { same: 1.55, overnight: 0.38 },
  activeDryYeastGrams: 0,
  activeDryInputMode: "manual",
  activeDryUnit: "g"
};

let ingredients = loadIngredients();
let inputMode = "grams";
let currentPlan = "same";
let leaveningSettings = loadLeaveningSettings();

/* =========================================================
   ELEMENTS
========================================================= */
const rows = document.getElementById("ingredientRows");
const bakerRows = document.getElementById("bakerRows");
const gramsMode = document.getElementById("gramsMode");
const bakersMode = document.getElementById("bakersMode");
const gramsModeBtn = document.getElementById("gramsModeBtn");
const bakersModeBtn = document.getElementById("bakersModeBtn");
const totalFlour = document.getElementById("totalFlour");
const percentageSlider = document.getElementById("starterPercentage");
const percentageValue = document.getElementById("percentageValue");
const starterResult = document.getElementById("starterResult");
const pieceCount = document.getElementById("pieceCount");
const pieceWeight = document.getElementById("pieceWeight");
const wastagePercent = document.getElementById("wastagePercent");
const bakersFlourWeight = document.getElementById("bakersFlourWeight");
const installBtn = document.getElementById("installBtn");

const leaveningMethod = document.getElementById("leaveningMethod");
const starterSettingsPanel = document.getElementById("starterSettings");
const instantSettingsPanel = document.getElementById("instantSettings");
const instantInputMode = document.getElementById("instantInputMode");
const instantUnit = document.getElementById("instantUnit");
const instantUnitCard = document.getElementById("instantUnitCard");
const instantManualAmount = document.getElementById("instantManualAmount");
const instantManualUnit = document.getElementById("instantManualUnit");
const instantManualSettings = document.getElementById("instantManualSettings");
const instantAutomaticSettings = document.getElementById("instantAutomaticSettings");
const instantPercentage = document.getElementById("instantPercentage");
const instantPercentageValue = document.getElementById("instantPercentageValue");
const instantEquivalent = document.getElementById("instantEquivalent");

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
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ingredients));
  } catch (error) {
    console.warn("Could not save recipe locally.", error);
  }
}

function loadLeaveningSettings() {
  const defaults = JSON.parse(JSON.stringify(DEFAULT_LEAVENING_SETTINGS));
  try {
    const saved = localStorage.getItem(LEAVENING_STORAGE_KEY);
    if (!saved) return defaults;

    const parsed = JSON.parse(saved);
    const oldMethod = parsed.method;
    const method = ["instant", "sourdough", "activeDry"].includes(oldMethod) ? oldMethod : defaults.method;

    const planPercent = (source, fallback) => ({
      same: Number.isFinite(Number(source?.same)) && Number(source.same) >= 0 ? Number(source.same) : fallback.same,
      overnight: Number.isFinite(Number(source?.overnight)) && Number(source.overnight) >= 0 ? Number(source.overnight) : fallback.overnight
    });

    const legacyInstantPercent = parsed.instantYeastPercent;
    const migratedPercent = planPercent(legacyInstantPercent, defaults.instantYeastPercent);

    return {
      method,
      starterPercent: planPercent(parsed.starterPercent, defaults.starterPercent),
      instantYeastPercent: migratedPercent,
      instantYeastGrams: Number.isFinite(Number(parsed.instantYeastGrams)) && Number(parsed.instantYeastGrams) >= 0
        ? Number(parsed.instantYeastGrams)
        : 0,
      instantInputMode: parsed.instantInputMode === "automatic" ? "automatic" : "manual",
      instantUnit: parsed.instantUnit === "tsp" ? "tsp" : "g",
      activeDryYeastPercent: planPercent(parsed.activeDryYeastPercent, defaults.activeDryYeastPercent),
      activeDryYeastGrams: Math.max(0, Number(parsed.activeDryYeastGrams) || 0),
      activeDryInputMode: parsed.activeDryInputMode === "automatic" ? "automatic" : "manual",
      activeDryUnit: parsed.activeDryUnit === "tsp" ? "tsp" : "g"
    };
  } catch (error) {
    console.warn("Could not load saved leavening settings.", error);
    return defaults;
  }
}
function saveLeaveningSettings() {
  try {
    localStorage.setItem(LEAVENING_STORAGE_KEY, JSON.stringify(leaveningSettings));
  } catch (error) {
    console.warn("Could not save leavening settings locally.", error);
  }
}

/* =========================================================
   NUMBER HELPERS
========================================================= */
function number(value) {
  const result = Number(value);
  return Number.isFinite(result) ? result : 0;
}

function positiveNumber(value) {
  const result = number(value);
  return result > 0 ? result : 0;
}

function formatNumber(value, maximumFractionDigits = 1) {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits }).format(value);
}

function getCurrentStarterPercent() {
  return positiveNumber(leaveningSettings.starterPercent[currentPlan]);
}

function getCurrentInstantYeastPercent() {
  const key = leaveningSettings.method === "activeDry" ? "activeDryYeastPercent" : "instantYeastPercent";
  return positiveNumber(leaveningSettings[key][currentPlan]);
}
function getCurrentYeastMode() {
  return leaveningSettings.method === "activeDry" ? leaveningSettings.activeDryInputMode : leaveningSettings.instantInputMode;
}
function getCurrentYeastUnit() {
  return leaveningSettings.method === "activeDry" ? leaveningSettings.activeDryUnit : leaveningSettings.instantUnit;
}
function getCurrentYeastGrams() {
  return leaveningSettings.method === "activeDry" ? leaveningSettings.activeDryYeastGrams : leaveningSettings.instantYeastGrams;
}
function yeastName() { return leaveningSettings.method === "activeDry" ? "Active dry yeast" : "Instant yeast"; }

function getInstantYeastDisplayAmount() {
  return getCurrentYeastUnit() === "tsp" ? getCurrentYeastGrams() / INSTANT_YEAST_GRAMS_PER_TSP : getCurrentYeastGrams();
}

function formatInstantAmount(value) {
  return formatNumber(value, getCurrentYeastUnit() === "tsp" ? 2 : 1);
}

/* =========================================================
   REMOVE BUTTON
========================================================= */
function createRemoveButton(index) {
  const remove = document.createElement("button");
  remove.className = "remove";
  remove.type = "button";
  remove.textContent = "×";
  remove.title = "Remove ingredient";
  remove.setAttribute("aria-label", `Remove ${ingredients[index]?.name || "ingredient"}`);

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
    input.setAttribute("aria-label", `${item.name} amount in grams`);

    input.addEventListener("input", () => {
      ingredients[index].amount = input.value;
      saveIngredients();
      calculate();
    });

    row.append(name, input, createRemoveButton(index));
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
    input.placeholder = "0";
    input.className = "baker-percent";
    input.value = item.bakerPercent || "";

    input.addEventListener("input", () => {
      ingredients[index].bakerPercent = input.value;
      saveIngredients();
      calculate();
    });

    row.append(name, input, createRemoveButton(index));
    bakerRows.appendChild(row);
  });
}

/* =========================================================
   INPUT MODE
========================================================= */
function setInputMode(mode) {
  inputMode = mode;
  const isGrams = mode === "grams";

  gramsMode.classList.toggle("hidden", !isGrams);
  bakersMode.classList.toggle("hidden", isGrams);
  gramsModeBtn.classList.toggle("active", isGrams);
  bakersModeBtn.classList.toggle("active", !isGrams);

  calculate();
}

gramsModeBtn.addEventListener("click", () => setInputMode("grams"));
bakersModeBtn.addEventListener("click", () => setInputMode("bakers"));

/* =========================================================
   FLOUR
========================================================= */
function getTotalFlourFromGrams() {
  return ingredients
    .filter(item => item.role === "flour")
    .reduce((sum, item) => sum + positiveNumber(item.amount), 0);
}

function getTotalFlourFromBakers() {
  return positiveNumber(bakersFlourWeight.value);
}

function getTotalFlour() {
  return inputMode === "grams" ? getTotalFlourFromGrams() : getTotalFlourFromBakers();
}

/* =========================================================
   BAKER'S PERCENT
========================================================= */
function getBakerTotalPercent() {
  return ingredients.reduce((sum, item) => sum + positiveNumber(item.bakerPercent), 0);
}

function getBakerIngredientWeight(item) {
  return getTotalFlourFromBakers() * positiveNumber(item.bakerPercent) / 100;
}

function getAutomaticBakerPercent(item) {
  const flour = getTotalFlourFromGrams();
  if (flour <= 0) return 0;
  return positiveNumber(item.amount) / flour * 100;
}

/* =========================================================
   BASE RECIPE
========================================================= */
function getBaseRecipeIngredients() {
  return ingredients.map(item => {
    let grams = 0;
    let bakerPercent = 0;

    if (inputMode === "grams") {
      grams = positiveNumber(item.amount);
      bakerPercent = getAutomaticBakerPercent(item);
    } else {
      grams = getBakerIngredientWeight(item);
      bakerPercent = positiveNumber(item.bakerPercent);
    }

    return { name: item.name, role: item.role, grams, bakerPercent };
  });
}

function getBaseRecipeWeight() {
  return getBaseRecipeIngredients().reduce((sum, item) => sum + item.grams, 0);
}

/* =========================================================
   BATCH TARGET
========================================================= */
function getBatchTargetWeight() {
  const pieces = positiveNumber(pieceCount.value);
  const weight = positiveNumber(pieceWeight.value);
  const allowance = positiveNumber(wastagePercent.value);

  if (pieces <= 0 || weight <= 0) return 0;
  return pieces * weight * (1 + allowance / 100);
}

/* =========================================================
   LEAVENING STATE / UI
========================================================= */
function updatePlanCards() {
  const samePercentage = document.getElementById("samePlanPercentage");
  const overnightPercentage = document.getElementById("overnightPlanPercentage");
  const sameDescription = document.getElementById("samePlanDescription");
  const overnightDescription = document.getElementById("overnightPlanDescription");

  if (leaveningSettings.method === "sourdough") {
    samePercentage.textContent = `${formatNumber(leaveningSettings.starterPercent.same)}%`;
    overnightPercentage.textContent = `${formatNumber(leaveningSettings.starterPercent.overnight)}%`;
    sameDescription.textContent = "Starter percentage · suggested starting point";
    overnightDescription.textContent = "Starter percentage · suggested starting point";
  } else if (getCurrentYeastMode() === "automatic") {
    const percentages = leaveningSettings.method === "activeDry" ? leaveningSettings.activeDryYeastPercent : leaveningSettings.instantYeastPercent;
    samePercentage.textContent = `${formatNumber(percentages.same, 3)}%`;
    overnightPercentage.textContent = `${formatNumber(percentages.overnight, 3)}%`;
    sameDescription.textContent = `${yeastName()} · suggested starting point`;
    overnightDescription.textContent = `${yeastName()} · suggested starting point`;
  } else {
    samePercentage.textContent = "Manual amount";
    overnightPercentage.textContent = "Manual amount";
    sameDescription.textContent = "Your entered amount is used for either plan";
    overnightDescription.textContent = "Your entered amount is used for either plan";
  }
}

function syncLeaveningControls() {
  leaveningMethod.value = leaveningSettings.method;
  percentageSlider.value = String(leaveningSettings.starterPercent[currentPlan]);
  percentageValue.textContent = `${formatNumber(leaveningSettings.starterPercent[currentPlan])}%`;

  instantInputMode.value = getCurrentYeastMode();
  instantUnit.value = getCurrentYeastUnit();
  instantManualUnit.textContent = getCurrentYeastUnit();

  const displayAmount = getInstantYeastDisplayAmount();
  instantManualAmount.value = displayAmount === 0 ? "" : String(Number(displayAmount.toFixed(4)));

  const equivalentGrams = getCurrentYeastUnit() === "tsp"
    ? displayAmount * INSTANT_YEAST_GRAMS_PER_TSP
    : displayAmount;
  const equivalentTsp = equivalentGrams / INSTANT_YEAST_GRAMS_PER_TSP;
  instantEquivalent.textContent = `Equivalent: ${formatNumber(equivalentGrams, 2)} g · about ${formatNumber(equivalentTsp, 2)} tsp`;

  instantPercentage.value = String(getCurrentInstantYeastPercent());
  instantPercentageValue.textContent = `${formatNumber(getCurrentInstantYeastPercent(), 3)}%`;

  const isManual = getCurrentYeastMode() === "manual";
  instantManualSettings.classList.toggle("hidden", !isManual);
  instantAutomaticSettings.classList.toggle("hidden", isManual);
  instantUnitCard.classList.toggle("hidden", !isManual);

  starterSettingsPanel.classList.toggle("hidden", leaveningSettings.method !== "sourdough");
  instantSettingsPanel.classList.toggle("hidden", !["instant", "activeDry"].includes(leaveningSettings.method));
  document.querySelector("label[for='instantManualAmount']").textContent = `${yeastName().toUpperCase()} FOR YOUR BASE RECIPE`;
  document.querySelector("label[for='instantPercentage']").textContent = `${yeastName().toUpperCase()} PERCENTAGE`;

  updatePlanCards();
}
function setLeaveningMethod(method) {
  if (!["sourdough", "instant", "activeDry"].includes(method)) return;
  leaveningSettings.method = method;
  saveLeaveningSettings();
  syncLeaveningControls();
  calculate();
}

leaveningMethod.addEventListener("change", () => setLeaveningMethod(leaveningMethod.value));

percentageSlider.addEventListener("input", () => {
  leaveningSettings.starterPercent[currentPlan] = positiveNumber(percentageSlider.value);
  saveLeaveningSettings();
  percentageValue.textContent = `${formatNumber(getCurrentStarterPercent())}%`;
  updatePlanCards();
  calculate();
});

instantPercentage.addEventListener("input", () => {
  const value = Math.min(3, positiveNumber(instantPercentage.value));
  leaveningSettings[leaveningSettings.method === "activeDry" ? "activeDryYeastPercent" : "instantYeastPercent"][currentPlan] = value;
  saveLeaveningSettings();
  instantPercentageValue.textContent = `${formatNumber(value, 3)}%`;
  updatePlanCards();
  calculate();
});

instantInputMode.addEventListener("change", () => {
  leaveningSettings[leaveningSettings.method === "activeDry" ? "activeDryInputMode" : "instantInputMode"] = instantInputMode.value === "automatic" ? "automatic" : "manual";
  saveLeaveningSettings();
  syncLeaveningControls();
  calculate();
});

instantUnit.addEventListener("change", () => {
  leaveningSettings[leaveningSettings.method === "activeDry" ? "activeDryUnit" : "instantUnit"] = instantUnit.value === "tsp" ? "tsp" : "g";
  saveLeaveningSettings();
  syncLeaveningControls();
  calculate();
});

function updateInstantYeastFromDisplay(value) {
  const displayValue = positiveNumber(value);
  leaveningSettings[leaveningSettings.method === "activeDry" ? "activeDryYeastGrams" : "instantYeastGrams"] = getCurrentYeastUnit() === "tsp" ? displayValue * INSTANT_YEAST_GRAMS_PER_TSP : displayValue;
  saveLeaveningSettings();

  const equivalentGrams = getCurrentYeastGrams();
  const equivalentTsp = equivalentGrams / INSTANT_YEAST_GRAMS_PER_TSP;
  instantEquivalent.textContent = `Equivalent: ${formatNumber(equivalentGrams, 2)} g · about ${formatNumber(equivalentTsp, 2)} tsp`;
  updatePlanCards();
  calculate();
}

instantManualAmount.addEventListener("input", () => updateInstantYeastFromDisplay(instantManualAmount.value));

/* =========================================================
   SCALE FORMULA

   Base formula mass includes the manually entered ingredients.
   Base leavener is then added to that mass before calculating
   the scale factor. This makes the complete dough, including
   the selected leavener, equal the requested dough target.
========================================================= */
function getBaseLeavener(flourWeight) {
  if (leaveningSettings.method === "sourdough") {
    const percent = getCurrentStarterPercent();
    return {
      grams: flourWeight * percent / 100,
      percent,
      name: "Fully active sourdough starter",
      label: "FULLY ACTIVE SOURDOUGH STARTER",
      description: "Fully active sourdough starter to add to this batch.",
      tablePercent: `${formatNumber(percent)}%`
    };
  }

  if (getCurrentYeastMode() === "automatic") {
    const percent = getCurrentInstantYeastPercent();
    const name = yeastName();
    return {
      grams: flourWeight * percent / 100,
      percent,
      name,
      label: name.toUpperCase(),
      description: `${name} calculated at ${formatNumber(percent, 3)}% of total flour.`,
      tablePercent: `${formatNumber(percent, 3)}%`
    };
  }

  const grams = getCurrentYeastGrams();
  const name = yeastName();
  const percent = flourWeight > 0 ? grams / flourWeight * 100 : 0;
  return {
    grams,
    percent,
    name,
    label: name.toUpperCase(),
    description: `${name} scaled proportionally from the amount entered for your base recipe.`,
    tablePercent: `${formatNumber(percent, 3)}%`
  };
}
function calculateScaledFormula() {
  const baseIngredients = getBaseRecipeIngredients();
  const baseWeight = baseIngredients.reduce((sum, item) => sum + item.grams, 0);
  const flourWeight = baseIngredients
    .filter(item => item.role === "flour")
    .reduce((sum, item) => sum + item.grams, 0);
  const leavener = getBaseLeavener(flourWeight);
  const completeBaseWeight = baseWeight + leavener.grams;
  const targetWeight = getBatchTargetWeight();

  if (baseWeight <= 0 || flourWeight <= 0 || completeBaseWeight <= 0 || targetWeight <= 0) {
    return { scale: 0, flour: 0, leavener: 0, leavenerBase: leavener.grams,
      leavenerPercent: leavener.percent, leavenerName: leavener.name,
      leavenerLabel: leavener.label, leavenerDescription: leavener.description,
      leavenerTablePercent: leavener.tablePercent, total: 0, ingredients: [] };
  }

  const scale = targetWeight / completeBaseWeight;
  const scaledIngredients = baseIngredients.map(item => ({
    name: item.name,
    role: item.role,
    bakerPercent: item.bakerPercent,
    grams: item.grams * scale
  }));

  return {
    scale,
    flour: flourWeight * scale,
    leavener: leavener.grams * scale,
    leavenerBase: leavener.grams,
    leavenerPercent: leavener.percent,
    leavenerName: leavener.name,
    leavenerLabel: leavener.label,
    leavenerDescription: leavener.description,
    leavenerTablePercent: leavener.tablePercent,
    total: targetWeight,
    ingredients: scaledIngredients
  };
}

/* =========================================================
   BATCH SUMMARY
========================================================= */
function updateBatchSummary() {
  const pieces = positiveNumber(pieceCount.value);
  const weight = positiveNumber(pieceWeight.value);
  const allowance = positiveNumber(wastagePercent.value);
  const baseDough = pieces * weight;
  const allowanceWeight = baseDough * allowance / 100;
  const total = baseDough + allowanceWeight;

  document.getElementById("orderSummary").textContent = pieces > 0
    ? `${formatNumber(pieces)} × ${formatNumber(weight)} g` : "—";
  document.getElementById("baseDoughRequired").textContent = baseDough > 0
    ? `${formatNumber(baseDough)} g` : "—";
  document.getElementById("allowanceDough").textContent = allowanceWeight > 0
    ? `${formatNumber(allowanceWeight)} g` : "0 g";
  document.getElementById("totalDoughRequired").textContent = total > 0
    ? `${formatNumber(total)} g` : "—";
  document.getElementById("resultDough").textContent = total > 0
    ? `${formatNumber(total)} g` : "—";
  document.getElementById("resultPieces").textContent = pieces > 0
    ? formatNumber(pieces) : "—";
  document.getElementById("resultPieceWeight").textContent = weight > 0
    ? `${formatNumber(weight)} g` : "—";
}

/* =========================================================
   LEAVENER RESULT
========================================================= */
function updateStarterResult(result) {
  document.getElementById("resultLeavenerLabel").textContent = result.leavenerLabel;

  if (result.total <= 0) {
    starterResult.innerHTML = "— <small>g</small>";
    document.getElementById("resultFlour").textContent = "—";
    document.getElementById("resultDescription").textContent = "Enter your recipe and batch size to calculate.";
    return;
  }

  starterResult.innerHTML = `${formatNumber(result.leavener)} <small>g</small>`;
  document.getElementById("resultFlour").textContent = `${formatNumber(result.flour)} g`;

  let description = result.leavenerDescription;
  if (["instant", "activeDry"].includes(leaveningSettings.method)) {
    const teaspoons = result.leavener / INSTANT_YEAST_GRAMS_PER_TSP;
    description += ` Approximately ${formatNumber(teaspoons, 2)} tsp.`;
  }
  document.getElementById("resultDescription").textContent = description;
}

/* =========================================================
   SCALED INGREDIENT TABLE
========================================================= */
function renderScaledIngredients(result) {
  const container = document.getElementById("scaledIngredientRows");
  container.innerHTML = "";

  if (result.total <= 0) {
    document.getElementById("scaledTotal").textContent = "—";
    return;
  }

  result.ingredients.forEach(item => {
    const row = document.createElement("div");
    row.className = "scaled-row";

    const name = document.createElement("div");
    name.className = "ingredient-name";
    name.textContent = item.name;

    const percent = document.createElement("div");
    percent.className = "scaled-percent";
    percent.textContent = `${formatNumber(item.bakerPercent)}%`;

    const weight = document.createElement("div");
    weight.className = "scaled-weight";
    weight.textContent = `${formatNumber(item.grams)} g`;

    row.append(name, percent, weight);
    container.appendChild(row);
  });

  const leavenerRow = document.createElement("div");
  leavenerRow.className = "scaled-row starter-row";

  const leavenerName = document.createElement("div");
  leavenerName.className = "ingredient-name";
  leavenerName.textContent = result.leavenerName;

  const leavenerPercent = document.createElement("div");
  leavenerPercent.className = "scaled-percent";
  leavenerPercent.textContent = result.leavenerTablePercent;

  const leavenerWeight = document.createElement("div");
  leavenerWeight.className = "scaled-weight";
  leavenerWeight.textContent = `${formatNumber(result.leavener)} g`;

  leavenerRow.append(leavenerName, leavenerPercent, leavenerWeight);
  container.appendChild(leavenerRow);

  document.getElementById("scaledTotal").textContent = `${formatNumber(result.total)} g`;
}

/* =========================================================
   EXPLANATION
========================================================= */
function updateExplanation(result) {
  const pieces = positiveNumber(pieceCount.value);
  const piece = positiveNumber(pieceWeight.value);
  const calculationText = document.getElementById("calculationText");
  const explanation = document.getElementById("explanation");

  if (result.total <= 0) {
    calculationText.textContent = "Waiting for your recipe and batch size";
    explanation.textContent = "Enter your ingredient formula, number of pieces, and target piece weight to calculate the production batch.";
    return;
  }

  calculationText.textContent = `${formatNumber(pieces)} pieces × ${formatNumber(piece)} g`;
  explanation.textContent = `PANDE-CALC scales your recipe to ${formatNumber(result.total)} g of total dough, including ${formatNumber(result.leavener)} g of ${result.leavenerName.toLowerCase()}. The leavener is included in—not added on top of—the target dough weight.`;
}

/* =========================================================
   MAIN CALCULATION
========================================================= */
function calculate() {
  const starterPercent = getCurrentStarterPercent();
  percentageValue.textContent = `${formatNumber(starterPercent)}%`;

  if (inputMode === "grams") {
    totalFlour.textContent = `${formatNumber(getTotalFlourFromGrams())} g`;
  } else {
    document.getElementById("bakerTotalFlour").textContent = `${formatNumber(getTotalFlourFromBakers())} g`;
    document.getElementById("formulaTotalPercent").textContent = `${formatNumber(getBakerTotalPercent())}%`;
  }

  updateBatchSummary();
  const result = calculateScaledFormula();
  updateStarterResult(result);
  renderScaledIngredients(result);

  document.getElementById("resultModeLabel").textContent = inputMode === "grams"
    ? "GRAM INPUT" : "BAKER'S % INPUT";

  updateExplanation(result);
}

/* =========================================================
   FERMENTATION PLAN
========================================================= */
function selectPlan(plan) {
  if (plan !== "same" && plan !== "overnight") return;
  currentPlan = plan;

  document.getElementById("sameCard").classList.toggle("selected", plan === "same");
  document.getElementById("overnightCard").classList.toggle("selected", plan === "overnight");
  document.querySelectorAll('input[name="plan"]').forEach(input => {
    input.checked = input.value === plan;
  });

  syncLeaveningControls();
  calculate();
}

document.querySelectorAll('input[name="plan"]').forEach(input => {
  input.addEventListener("change", () => selectPlan(input.value));
});

/* =========================================================
   INPUT EVENTS
========================================================= */
pieceCount.addEventListener("input", calculate);
pieceWeight.addEventListener("input", calculate);
wastagePercent.addEventListener("input", calculate);
bakersFlourWeight.addEventListener("input", calculate);

/* =========================================================
   ADD INGREDIENT — SHARED HANDLER
========================================================= */
function addIngredient() {
  const name = prompt("Enter the ingredient name:");
  if (!name || !name.trim()) return;

  const isFlour = confirm(
    "Should this ingredient count toward your total flour?\n\n" +
    "Choose OK for flour, or Cancel for other ingredients."
  );

  ingredients.push({
    name: name.trim(),
    role: isFlour ? "flour" : "other",
    amount: "",
    bakerPercent: 0
  });

  saveIngredients();
  renderIngredients();
  renderBakerRows();
  calculate();
}

document.getElementById("addBtn").addEventListener("click", addIngredient);
document.getElementById("addBakerBtn").addEventListener("click", addIngredient);

/* =========================================================
   RESET
========================================================= */
document.getElementById("resetBtn").addEventListener("click", () => {
  const confirmed = confirm(
    "Reset the ingredient quantities, batch size, and leavening settings to their defaults?"
  );
  if (!confirmed) return;

  ingredients = DEFAULT_INGREDIENTS.map(item => ({ ...item }));
  saveIngredients();
  renderIngredients();
  renderBakerRows();

  pieceCount.value = "";
  pieceWeight.value = "";
  wastagePercent.value = "0";
  bakersFlourWeight.value = "";

  leaveningSettings = JSON.parse(JSON.stringify(DEFAULT_LEAVENING_SETTINGS));
  saveLeaveningSettings();

  setInputMode("grams");
  selectPlan("same");
  syncLeaveningControls();
  calculate();
});

/* =========================================================
   PWA INSTALL
========================================================= */
let deferredInstallPrompt = null;

window.addEventListener("beforeinstallprompt", event => {
  event.preventDefault();
  deferredInstallPrompt = event;
  installBtn.hidden = false;
});

installBtn.addEventListener("click", async () => {
  if (!deferredInstallPrompt) return;

  deferredInstallPrompt.prompt();
  const result = await deferredInstallPrompt.userChoice;
  console.log("Install choice:", result.outcome);
  deferredInstallPrompt = null;
  installBtn.hidden = true;
});

window.addEventListener("appinstalled", () => {
  console.log("PANDE-CALC was installed.");
  deferredInstallPrompt = null;
  installBtn.hidden = true;
});

/* =========================================================
   SERVICE WORKER
========================================================= */
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("./service-worker.js")
      .then(() => console.log("PANDE-CALC service worker registered."))
      .catch(error => console.warn("Service worker registration failed:", error));
  });
}

/* =========================================================
   ONLINE / OFFLINE
========================================================= */
function updateOnlineStatus() {
  const status = document.getElementById("offlineStatus");
  status.textContent = navigator.onLine ? "Online" : "Offline-ready";
}

window.addEventListener("online", updateOnlineStatus);
window.addEventListener("offline", updateOnlineStatus);
updateOnlineStatus();

/* =========================================================
   INITIALIZE
========================================================= */
function initialize() {
  renderIngredients();
  renderBakerRows();
  syncLeaveningControls();
  selectPlan("same");
  calculate();
}

initialize();
