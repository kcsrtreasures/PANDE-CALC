export function calculateStarterBuild({
    existingStarterGrams,
    existingHydrationPercent,
    targetStarterGrams,
    targetHydrationPercent
}) {
    const existing = Number(existingStarterGrams);
    const existingH = Number(existingHydrationPercent) / 100;
    const target = Number(targetStarterGrams);
    const targetH = Number(targetHydrationPercent) / 100;

    if (
        !Number.isFinite(existing) || existing < 0 ||
        !Number.isFinite(existingH) || existingH < 0 ||
        !Number.isFinite(target) || target <= 0 ||
        !Number.isFinite(targetH) || targetH < 0
    ) {
        throw new Error("Please enter valid starter values.");
    }

    const existingFlour = existing / (1 + existingH);
    const existingWater = existing - existingFlour;

    const targetFlour = target / (1 + targetH);
    const targetWater = target - targetFlour;

    const flourToAdd = targetFlour - existingFlour;
    const waterToAdd = targetWater - existingWater;

    if (flourToAdd < -0.001 || waterToAdd < -0.001) {
        throw new Error(
            "Target cannot be reached by adding only flour and water."
        );
    }

    return {
        flourToAddGrams: Math.max(0, flourToAdd),
        waterToAddGrams: Math.max(0, waterToAdd),
        totalStarterGrams: target
    };
}
