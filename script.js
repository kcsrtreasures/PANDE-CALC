
const DEFAULT_INGREDIENTS = [
  { name: "Bread flour", role: "flour", optional: false, amount: "" },
  { name: "All-purpose flour", role: "flour", optional: false, amount: "" },
  { name: "Water", role: "other", optional: false, amount: "" },
  { name: "Milk", role: "other", optional: false, amount: "" },
  { name: "Sugar", role: "other", optional: false, amount: "" },
  { name: "Salt", role: "other", optional: false, amount: "" },
  { name: "Butter", role: "other", optional: false, amount: "" },
  { name: "Oil", role: "other", optional: false, amount: "" },
];

const STORAGE_KEY = "pandeCalc.recipe.v1";

let ingredients = loadIngredients();
let currentPlan = "same";

const rows = document.getElementById("ingredientRows");
const totalFlour = document.getElementById("totalFlour");
const starterResult = document.getElementById("starterResult");
const percentageSlider = document.getElementById("starterPercentage");
const percentageValue = document.getElementById("percentageValue");

function loadIngredients() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (error) {
    console.warn("Could not load saved recipe.", error);
  }

  return DEFAULT_INGREDIENTS.map(item => ({ ...item }));
}

function saveIngredients() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ingredients));
}

function renderIngredients() {
  rows.innerHTML = "";

  ingredients.forEach((item, index) => {
    const row = document.createElement("div");
    row.className = "ingredient-row";

    const name = document.createElement("div");
    name.className = "ingredient-name" +
      (item.optional ? " optional" : "");
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

    const remove = document.createElement("button");
    remove.className = "remove";
    remove.type = "button";
    remove.textContent = "×";
    remove.title = "Remove ingredient";

    remove.addEventListener("click", () => {
      ingredients.splice(index, 1);
      saveIngredients();
      renderIngredients();
      calculate();
    });

    row.append(name, input, remove);
    rows.appendChild(row);
  });
}

function getTotalFlour() {
  return ingredients
    .filter(item => item.role === "flour")
    .reduce((sum, item) => {
      const amount = Number(item.amount);

      return sum + (
        Number.isFinite(amount) && amount > 0 ? amount : 0
      );
    }, 0);
}

function formatNumber(value) {
  return new Intl.NumberFormat(undefined, {
    maximumFractionDigits: 1
  }).format(value);
}

function calculate() {
  const flour = getTotalFlour();
  const percentage = Number(percentageSlider.value);

  percentageValue.textContent = percentage + "%";
  totalFlour.textContent = formatNumber(flour) + " g";

  if (flour <= 0) {
    starterResult.innerHTML = '— <small>g</small>';

    document.getElementById("resultDescription").textContent =
      "Enter your flour quantities to calculate.";

    document.getElementById("calculationText").textContent =
      "Waiting for flour";

    document.getElementById("explanation").textContent =
      "Your starter requirement will appear here once you enter your flour quantities.";

    return;
  }

  const starterGrams = flour * percentage / 100;

  starterResult.innerHTML =
    formatNumber(starterGrams) + " <small>g</small>";

  document.getElementById("resultDescription").textContent =
    "Fully active starter to add to your recipe.";

  document.getElementById("calculationText").textContent =
    formatNumber(flour) + " g × " + percentage + "%";

  document.getElementById("explanation").textContent =
    "Your " + formatNumber(flour) + " g of total flour at " +
    percentage + "% starter weight requires " +
    formatNumber(starterGrams) +
    " g of fully active sourdough starter.";
}

function selectPlan(plan) {
  currentPlan = plan;

  document.getElementById("sameCard")
    .classList.toggle("selected", plan === "same");

  document.getElementById("overnightCard")
    .classList.toggle("selected", plan === "overnight");

  // Suggested starting percentages.
  // You can adjust the slider after selecting the plan.
  percentageSlider.value = plan === "same" ? 20 : 10;

  calculate();
}

document.querySelectorAll('input[name="plan"]').forEach(input => {
  input.addEventListener("change", () => {
    selectPlan(input.value);
  });
});

percentageSlider.addEventListener("input", calculate);

document.getElementById("addBtn").addEventListener("click", () => {
  const name = prompt("Enter the ingredient name:");

  if (!name || !name.trim()) return;

  const isFlour = confirm(
    "Should this ingredient count toward your total flour?\n\n" +
    "Choose OK for flour, or Cancel for other ingredients."
  );

  ingredients.push({
    name: name.trim(),
    role: isFlour ? "flour" : "other",
    optional: false,
    amount: ""
  });

  saveIngredients();
  renderIngredients();
  calculate();
});

document.getElementById("resetBtn").addEventListener("click", () => {
  const confirmed = confirm(
    "Reset all ingredient quantities and restore the original ingredient list?"
  );

  if (!confirmed) return;

  ingredients = DEFAULT_INGREDIENTS.map(item => ({ ...item }));

  saveIngredients();
  renderIngredients();
  calculate();
});

renderIngredients();
calculate();
