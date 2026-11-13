import assert from "node:assert/strict";

import {
    calculateStarterRequirement
} from "../engine/starter-calculator.js";

import {
    calculateStarterBuild
} from "../engine/starter-builder.js";

const starter = calculateStarterRequirement({
    totalFlourGrams: 500,
    method: "pff",
    percentage: 10,
    hydrationPercent: 100
});

assert.equal(starter.prefermentedFlourGrams, 50);
assert.equal(starter.starterWaterGrams, 50);
assert.equal(starter.starterRequiredGrams, 100);
assert.equal(starter.freshFlourGrams, 450);

const build = calculateStarterBuild({
    existingStarterGrams: 20,
    existingHydrationPercent: 100,
    targetStarterGrams: 100,
    targetHydrationPercent: 100
});

assert.equal(build.flourToAddGrams, 40);
assert.equal(build.waterToAddGrams, 40);

console.log("All PANDE-CALC tests passed!");
