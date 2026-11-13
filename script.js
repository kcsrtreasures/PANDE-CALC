
const DEFAULT_INGREDIENTS = [
  { name: "Bread flour", role: "flour", amount: "" },
  { name: "All-purpose flour", role: "flour", amount: "" },
  { name: "Water", role: "other", amount: "" },
  { name: "Milk", role: "other", amount: "" },
  { name: "Sugar", role: "other", amount: "" },
  { name: "Salt", role: "other", amount: "" },
  { name: "Butter", role: "other", amount: "" },
  { name: "Oil", role: "other", amount: "" }
];

const STORAGE_KEY = "pandeCalc.recipe.v1";

let ingredients = loadIngredients();

const rows = document.getElementById("ingredientRows");
const totalFlour = document.getElementById("totalFlour");
const starterResult = document.getElementById("starterResult");
const percentageSlider = document.getElementById("starterPercentage");
const percentageValue = document.getElementById("percentageValue");

let deferredInstallPrompt = null;

// ----------------------------------------
// LOAD AND SAVE INGREDIENTS
// ----------------------------------------

function loadIngredients() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (saved) {
      const parsed = JSON.parse(saved);

      if (Array.isArray(parsed)) {
        return parsed.map(item => ({
          name: String(item.name || "Ingredient"),
          role: item.role === "flour" ? "flour" : "other",
          amount: item.amount ?? ""
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
    console.warn("Could not save recipe.", error);
  }
}

// ----------------------------------------
// RENDER INGREDIENTS
// ----------------------------------------

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

    const remove = document.createElement("button");
    remove.className = "remove";
    remove.type = "button";
    remove.textContent = "×";
    remove.title = "Remove ingredient";
    remove.setAttribute(
      "aria-label",
      "Remove " + item.name
    );

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

// ----------------------------------------
// CALCULATIONS
// ----------------------------------------

function getTotalFlour() {
  return ingredients
    .filter(item => item.role === "flour")
    .reduce((sum, item) => {
      const amount = Number(item.amount);

      return sum + (
        Number.isFinite(amount) && amount > 0
          ? amount
          : 0
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
    "Your " + formatNumber(flour) +
    " g of total flour at " + percentage +
    "% starter weight requires " +
    formatNumber(starterGrams) +
    " g of fully active sourdough starter.";
}

// ----------------------------------------
// FERMENTATION PLAN
// ----------------------------------------

function selectPlan(plan) {
  document.getElementById("sameCard")
    .classList.toggle("selected", plan === "same");

  document.getElementById("overnightCard")
    .classList.toggle("selected", plan === "overnight");

  // Same-day: 20%
  // Overnight refrigerated: 10%

  percentageSlider.value = plan === "same" ? 20 : 10;

  calculate();
}

document.querySelectorAll('input[name="plan"]').forEach(input => {
  input.addEventListener("change", () => {
    selectPlan(input.value);
  });
});

percentageSlider.addEventListener("input", calculate);

// ----------------------------------------
// ADD INGREDIENT
// ----------------------------------------

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
    amount: ""
  });

  saveIngredients();
  renderIngredients();
  calculate();
});

// ----------------------------------------
// RESET
// ----------------------------------------

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

// ----------------------------------------
// ONLINE / OFFLINE STATUS
// ----------------------------------------

function updateConnectionStatus() {
  const status = document.getElementById("connectionStatus");

  if (navigator.onLine) {
    status.textContent = "● Online";
    status.classList.remove("offline");
  } else {
    status.textContent = "● Offline mode";
    status.classList.add("offline");
  }
}

window.addEventListener("online", updateConnectionStatus);
window.addEventListener("offline", updateConnectionStatus);

updateConnectionStatus();

// ----------------------------------------
// ANDROID INSTALL PROMPT
// ----------------------------------------

const installBtn = document.getElementById("installBtn");

window.addEventListener("beforeinstallprompt", event => {
  event.preventDefault();

  deferredInstallPrompt = event;
  installBtn.hidden = false;
});

installBtn.addEventListener("click", async () => {
  if (!deferredInstallPrompt) return;

  deferredInstallPrompt.prompt();

  await deferredInstallPrompt.userChoice;

  deferredInstallPrompt = null;
  installBtn.hidden = true;
});

window.addEventListener("appinstalled", () => {
  installBtn.hidden = true;
  deferredInstallPrompt = null;
});

// ----------------------------------------
// IPHONE INSTALL GUIDANCE
// ----------------------------------------

const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
const isStandalone =
  window.matchMedia("(display-mode: standalone)").matches ||
  window.navigator.standalone === true;

if (isIOS && !isStandalone) {
  document.getElementById("iosInstallNote").style.display = "block";
}

// ----------------------------------------
// REGISTER SERVICE WORKER
// ----------------------------------------

if ("serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    try {
      await navigator.serviceWorker.register("./service-worker.js");

      console.log("PANDE-CALC offline support is ready.");
    } catch (error) {
      console.error("Service worker registration failed:", error);
    }
  });
}

// ----------------------------------------
// START APP
// ----------------------------------------

renderIngredients();
calculate();
