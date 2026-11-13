export function calculateStarterRequirement({
    totalFlourGrams,
    method = "pff",
    percentage,
    hydrationPercent = 100,
    reservePercent = 0
}) {
    const flour = Number(totalFlourGrams);
    const percent = Number(percentage);
    const hydration = Number(hydrationPercent);
    const reserve = Number(reservePercent);

    if (
        !Number.isFinite(flour) || flour <= 0 ||
        !Number.isFinite(percent) || percent <= 0 ||
        !Number.isFinite(hydration) || hydration < 0 ||
        !Number.isFinite(reserve) || reserve < 0
    ) {
        throw new Error("Please enter valid positive values.");
    }

    const hydrationRatio = hydration / 100;
    let prefermentedFlour;
    let starterWater;
    let starterWeight;

    if (method === "pff") {
        if (percent > 100) throw new Error("PFF cannot exceed 100%.");
        prefermentedFlour = flour * percent / 100;
        starterWater = prefermentedFlour * hydrationRatio;
        starterWeight = prefermentedFlour + starterWater;
    } else if (method === "starter-weight") {
        starterWeight = flour * percent / 100;
        prefermentedFlour = starterWeight / (1 + hydrationRatio);
        starterWater = starterWeight - prefermentedFlour;
        if (prefermentedFlour > flour) throw new Error("Starter flour exceeds total flour.");
    } else {
        throw new Error("Invalid starter calculation method.");
    }

    return {
        totalFlourGrams: flour,
        prefermentedFlourGrams: prefermentedFlour,
        starterWaterGrams: starterWater,
        starterRequiredGrams: starterWeight,
        starterToPrepareGrams: starterWeight * (1 + reserve / 100),
        freshFlourGrams: flour - prefermentedFlour
    };
}
