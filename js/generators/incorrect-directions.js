class IncorrectDirections {
    findUnused(combinations, correctCoord) {
        let unused = [];
        let permutation = correctCoord.map(d => 0);
        let permutate = (i) => {
            if (i >= permutation.length) {
                if (!arraysEqual(permutation, correctCoord) && 
                    !arraysEqual(permutation, correctCoord.slice(0, 3).map(d => 0)) &&
                    combinations.findIndex(combo => arraysEqual(permutation, combo)) === -1) {
                    unused.push(permutation.slice());
                }
                return;
            }
            for (let direction of [-1, 0, 1]) {
                permutation[i] = direction;
                permutate(i+1);
            }
        }
        permutate(0);
        return unused;
    }

    createIncorrectConclusionCoords(usedCoords, correctCoord, diffCoord, hardModeDimensions) {
        let opposite = correctCoord.map(dir => -dir)
        if (usedCoords.length <= 2) {
            return [opposite]; // Few premises == anything that isn't the opposite tends to be easy.
        } else if (usedCoords.length <= 3 && Math.random() < 0.5) {
            return [opposite];
        } else if (usedCoords.length <= 4 && Math.random() < 0.23) {
            return [opposite];
        }
        const dirCoords = removeDuplicateArrays(usedCoords);

        const dimensionPool = correctCoord.map((c, i) => i);
        let bannedDimensionShifts = new Set();
        for (const dimension of dimensionPool) {
            if (dirCoords.every(coord => coord[dimension] === 0)) {
                bannedDimensionShifts.add(dimension);
            }
        }

        const highest = diffCoord.map(x => Math.abs(x)).reduce((a, b) => Math.max(a, b));
        const allShiftedEqually = diffCoord.every(x => Math.abs(x) === highest);
        const shifts = allShiftedEqually ? [-1, 1] : [-2, -1, 1, 2];
        if (hardModeDimensions && hardModeDimensions.length > 0) {
            bannedDimensionShifts.add.apply(bannedDimensionShifts, dimensionPool.filter(d => !hardModeDimensions.some(h => h === d)));
        } else if (!allShiftedEqually) {
            bannedDimensionShifts.add.apply(bannedDimensionShifts, dimensionPool.filter(d => Math.abs(diffCoord[d]) === highest));
        }

        let combinations = [];
        for (const d of dimensionPool) {
            if (bannedDimensionShifts.has(d)) {
                continue;
            }

            for (const shift of shifts) {
                let newCombo = correctCoord.slice();
                newCombo[d] += shift;
                if (newCombo.some(d => Math.abs(d) > 1)) {
                    continue;
                }
                if (newCombo.slice(0, 3).every(d => d === 0)) {
                    continue;
                }
                combinations.push(newCombo);
                if (Math.abs(shift) == 1) {
                    combinations.push(newCombo);
                }
            }
        }

        let backupPool = this.findUnused(combinations, correctCoord);
        backupPool.push(opposite);
        backupPool.push(opposite);
        backupPool.push(opposite);
        if (combinations.length !== 0 && Math.random() < 0.885) {
            return combinations;
        } else {
            return backupPool;
        }
    }

    chooseIncorrectCoord(usedCoords, correctCoord, diffCoord, hardModeDimensions) {
        const incorrectCoords = this.createIncorrectConclusionCoords(usedCoords, correctCoord, diffCoord, hardModeDimensions);
        const picked = pickRandomItems(incorrectCoords, 1).picked[0];
        return picked;
    }
}
