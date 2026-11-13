export function calculateDoughTarget({
    pieceCount,
    doughWeightPerPiece,
    handlingAllowancePercent = 0
}) {
    const count = Number(pieceCount);
    const weight = Number(doughWeightPerPiece);
    const allowance = Number(handlingAllowancePercent);

    if (
        !Number.isFinite(count) || count <= 0 ||
        !Number.isFinite(weight) || weight <= 0 ||
        !Number.isFinite(allowance) || allowance < 0
    ) {
        throw new Error("Please enter valid dough quantities.");
    }

    const doughWeight = count * weight;

    return {
        pieceCount: count,
        doughWeightPerPieceGrams: weight,
        doughWeightGrams: doughWeight,
        targetDoughWeightGrams: doughWeight * (1 + allowance / 100)
    };
}
