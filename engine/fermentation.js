export function createFermentationPlan({
    schedule,
    roomTemperatureC = 28,
    fridgeTemperatureC = 4,
    roomTemperatureStartHours = 1,
    roomTemperatureBulkHours = 3,
    fridgeHours = 10,
    finalProofHours = 2
}) {
    const stages = [];

    if (schedule === "same-day") {
        stages.push({
            stage: "Room-temperature bulk fermentation",
            hours: Number(roomTemperatureBulkHours),
            temperatureC: Number(roomTemperatureC)
        });

    } else if (schedule === "overnight") {
        stages.push({
            stage: "Initial room-temperature fermentation",
            hours: Number(roomTemperatureStartHours),
            temperatureC: Number(roomTemperatureC)
        });

        stages.push({
            stage: "Refrigerated fermentation",
            hours: Number(fridgeHours),
            temperatureC: Number(fridgeTemperatureC)
        });

    } else if (schedule === "hybrid") {
        stages.push({
            stage: "Room-temperature bulk fermentation",
            hours: Number(roomTemperatureBulkHours),
            temperatureC: Number(roomTemperatureC)
        });

        stages.push({
            stage: "Refrigerated fermentation",
            hours: Number(fridgeHours),
            temperatureC: Number(fridgeTemperatureC)
        });

    } else {
        throw new Error("Invalid fermentation schedule.");
    }

    stages.push({
        stage: "Final proof",
        hours: Number(finalProofHours),
        temperatureC: Number(roomTemperatureC)
    });

    if (stages.some(stage =>
        !Number.isFinite(stage.hours) || stage.hours <= 0
    )) {
        throw new Error("Fermentation durations must be positive.");
    }

    return {
        schedule,
        stages,
        totalPlannedHours: stages.reduce(
            (sum, stage) => sum + stage.hours, 0
        )
    };
}
