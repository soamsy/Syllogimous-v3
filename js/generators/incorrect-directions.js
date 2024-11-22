class IncorrectDirections {
    createIncorrectConclusionCoords(usedCoords, correctCoord, diffCoord) {
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

        const allZeroes = correctCoord.map(x => 0);
        const highest = diffCoord.map(x => Math.abs(x)).reduce((a, b) => Math.max(a, b));
        const allShiftedEqually = diffCoord.every(x => Math.abs(x) === highest);
        const shifts = allShiftedEqually ? [-1, 1] : [-2, -1, 1, 2];
        let combinations = [];
        for (const i in correctCoord) {
            if (!allShiftedEqually && Math.abs(diffCoord[i]) === highest) {
                continue;
            }

            for (const shift of shifts) {
                let newCombo = structuredClone(correctCoord);
                newCombo[i] += shift;
                if (validDirections[JSON.stringify(newCombo)]) {
                    combinations.push(newCombo);
                }
            }
        }
        combinations.push.apply(combinations, structuredClone(combinations));
        combinations.push(opposite);
        return combinations;
    }

    chooseIncorrectCoord(usedCoords, correctCoord, diffCoord) {
        const incorrectCoords = this.createIncorrectConclusionCoords(usedCoords, correctCoord, diffCoord);
        return pickRandomItems(incorrectCoords, 1).picked[0];
    }
}
