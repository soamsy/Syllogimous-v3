class IncorrectDirections {
    createIncorrectConclusionCoords(usedCoords, correctCoord, diffCoord, hardModeDimensions) {
        let opposite = correctCoord.map(dir => -dir)
        if (usedCoords.length <= 2) {
            return [opposite]; // Few premises == anything that isn't the opposite tends to be easy.
        }
        const dirCoords = removeDuplicateArrays(usedCoords);

        let validDirections = {}
        for (const coord of dirCoords) {
            validDirections[JSON.stringify(coord)] = true;
            validDirections[JSON.stringify(coord.map(x => -x))] = true;
        }

        const dimensionPool = correctCoord.map((c, i) => i);
        const highest = diffCoord.map(x => Math.abs(x)).reduce((a, b) => Math.max(a, b));
        const allShiftedEqually = diffCoord.every(x => Math.abs(x) === highest);
        const shifts = allShiftedEqually ? [-1, 1] : [-2, -1, 1, 2];
        let bannedDimensionShifts = new Set();
        if (hardModeDimensions && hardModeDimensions.length > 0) {
            bannedDimensionShifts.add.apply(bannedDimensionShifts, dimensionPool.filter(d => !hardModeDimensions.some(h => h === d)));
        } else if (!allShiftedEqually) {
            bannedDimensionShifts.add.apply(bannedDimensionShifts, dimensionPool.filter(d => diffCoord[d] === highest));
        }
        let combinations = [];
        for (const d of dimensionPool) {
            if (bannedDimensionShifts.has(d)) {
                continue;
            }

            for (const shift of shifts) {
                let newCombo = correctCoord.slice();
                newCombo[d] += shift;
                if (validDirections[JSON.stringify(newCombo)]) {
                    combinations.push(newCombo);
                    combinations.push(newCombo);
                    if (Math.abs(shift) == 1) {
                        combinations.push(newCombo);
                        combinations.push(newCombo);
                    }
                }
            }
        }
        combinations.push.apply(combinations, structuredClone(combinations));
        combinations.push(opposite);
        return combinations;
    }

    chooseIncorrectCoord(usedCoords, correctCoord, diffCoord, hardModeDimensions) {
        const incorrectCoords = this.createIncorrectConclusionCoords(usedCoords, correctCoord, diffCoord, hardModeDimensions);
        const picked = pickRandomItems(incorrectCoords, 1).picked[0];
        return picked;
    }
}
