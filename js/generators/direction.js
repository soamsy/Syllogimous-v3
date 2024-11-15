function findDiff2D(aCoord, bCoord) {
    const [x, y] = aCoord;
    const [x2, y2] = bCoord;
    return [x2 - x, y2 - y];
}

function findDiff3D(aCoord, bCoord) {
    const [x, y, z] = aCoord;
    const [x2, y2, z2] = bCoord;
    return [x2 - x, y2 - y, z2 - z];
}

function findDiff4D(aCoord, bCoord) {
    const [x, y, z, time] = aCoord;
    const [x2, y2, z2, time2] = bCoord;
    return [x2 - x, y2 - y, z2 - z, time2 - time];
}

function findDirectionCoord(aCoord, bCoord) {
    return findDiff2D(aCoord, bCoord).map(c => c/Math.abs(c) || 0);
}

function findDirection(aCoord, bCoord) {
    return dirStringFromCoord(findDirectionCoord(aCoord, bCoord));
}

function findDirectionCoord3D(aCoord, bCoord) {
    return findDiff3D(aCoord, bCoord).map(c => c/Math.abs(c) || 0);
}

function findDirection3D(aCoord, bCoord) {
    return dirStringFromCoord(findDirectionCoord3D(aCoord, bCoord));
}

function findDirectionCoord4D(aCoord, bCoord) {
    return findDiff4D(aCoord, bCoord).map(c => c/Math.abs(c) || 0);
}

function createDirectionTemplate(source, target, direction, isNegated, decorator='') {
    let directionElement = direction;
    if (isNegated) {
        directionElement = '<span class="is-negated">' + directionElement + '</span>';
    }
    directionElement = decorator + directionElement;
    return `<span class="subject">${target}</span> ${directionElement} of <span class="subject">${source}</span>`;
}

function pickStatement(statements) {
    if (!savedata.enableNegation) {
        return statements[0]
    } else {
        return pickRandomItems(statements, 1).picked[0];
    }
}

function createDirectionStatement(source, target, direction, reverseDirection) {
    return pickStatement([
        createDirectionTemplate(source, target, direction, false, 'is at '), 
        createDirectionTemplate(source, target, reverseDirection, true, 'is at '),
        createDirectionTemplate(target, source, reverseDirection, false, 'is at '), 
        createDirectionTemplate(target, source, direction, true, 'is at ')
    ]);
}

function createDirection3DStatement(source, target, direction, reverseDirection) {
    return pickStatement([
        createDirectionTemplate(source, target, direction, false, 'is '), 
        createDirectionTemplate(source, target, reverseDirection, true, 'is '),
        createDirectionTemplate(target, source, reverseDirection, false, 'is '), 
        createDirectionTemplate(target, source, direction, true, 'is ')
    ]);
}

function createDirection4DStatement(source, target, direction, reverseDirection, timeName, reverseTimeName) {
    return pickStatement([
        createDirectionTemplate(source, target, direction, false, timeName + ' '), 
        createDirectionTemplate(source, target, reverseDirection, true, reverseTimeName + ' '),
        createDirectionTemplate(target, source, reverseDirection, false, reverseTimeName + ' '), 
        createDirectionTemplate(target, source, direction, true, timeName + ' ')
    ]);
}

function createIncorrectConclusionCoords(usedCoords, correctCoord, diffCoord) {
    let opposite = correctCoord.map(dir => -dir)
    if (usedCoords.length <= 2) {
        return [opposite]; // Few premises == anything that isn't the opposite tends to be easy.
    }
    const dirCoords = removeDuplicateArrays(usedCoords);

    let low = structuredClone(dirCoords[0]);
    let high = structuredClone(dirCoords[0]);
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

function chooseIncorrectCoord(usedCoords, correctCoord, diffCoord) {
    const incorrectCoords = createIncorrectConclusionCoords(usedCoords, correctCoord, diffCoord);
    const incorrectDirections = incorrectCoords.map(dirStringFromCoord).filter(dirName => dirName);
    return pickRandomItems(incorrectCoords, 1).picked[0];
}

function chooseIncorrectDirection(usedCoords, correctCoord, diffCoord) {
    const chosen = chooseIncorrectCoord(usedCoords, correctCoord, diffCoord);
    return dirStringFromCoord(chosen);
}

function removeZeroCoords(dirCoords) {
    return dirCoords.slice(1);
}

function pickRandomDirection(dirCoords) {
    return pickRandomItems(removeZeroCoords(dirCoords), 1).picked[0];
}

function taxicabDistance(a, b) {
    return a.map((v,i) => Math.abs(b[i] - v)).reduce((left,right) => left + right)
}

function pickWeightedRandomDirection(dirCoords, baseWord, neighbors, wordCoordMap) {
    const badTargets = (neighbors[baseWord] ?? []).map(word => wordCoordMap[word]);
    const base = wordCoordMap[baseWord];
    const options = removeZeroCoords(dirCoords);
    let pool = [];
    for (const dirCoord of options) {
        const endLocation = dirCoord.map((d,i) => d + base[i]);
        const distanceToClosest = badTargets
            .map(badTarget => taxicabDistance(badTarget, endLocation))
            .reduce((a,b) => Math.min(a,b), 999);
        if (distanceToClosest == 0) {
            pool.push(dirCoord)
        } else if (distanceToClosest == 1) {
            pool.push(dirCoord);
            pool.push(dirCoord);
            pool.push(dirCoord);
            pool.push(dirCoord);
            pool.push(dirCoord);
            pool.push(dirCoord);
        } else if (distanceToClosest == 2) {
            pool.push(dirCoord);
            pool.push(dirCoord);
            pool.push(dirCoord);
            pool.push(dirCoord);
        } else if (distanceToClosest == 3) {
            pool.push(dirCoord);
            pool.push(dirCoord);
        } else {
            pool.push(dirCoord);
        }
    }

    return pickRandomItems(pool, 1).picked[0];
}

function pickDirection(dirCoords, baseWord, neighbors, wordCoordMap) {
    return pickWeightedRandomDirection(dirCoords, baseWord, neighbors, wordCoordMap);
}

function distanceBetween(start, end, neighbors) {
    let distance = 0;
    let layer = [start];
    let found = {[start]: true};
    while (layer.length > 0) {
        distance++;
        let newLayer = [];
        for (const node of layer) {
            for (const neighbor of neighbors[node]) {
                if (found[neighbor]) {
                    continue;
                }
                if (neighbor === end) {
                    return distance;
                }
                newLayer.push(neighbor);
                found[neighbor] = true;
            }
        }
        layer = newLayer;
    }
    return distance;
}

function isNeighborTooClose(start, end, neighbors) {
    if (neighbors[start].indexOf(end) !== -1) {
        return true;
    }

    let leaf;
    for (const key in neighbors) {
        if (neighbors[key].length < 2) {
            leaf = key;
            break;
        }
    }

    const distance = distanceBetween(start, end, neighbors);
    const endToEnd = distanceBetween(leaf, null, neighbors);
    const halfway = endToEnd / 2;

    return distance <= halfway;
}

function pickBaseWord(wordCoordMap, neighbors) {
    const options = Object.keys(wordCoordMap);
    const neighborLimit = options.length <= 3 ? 1 : 2;
    let pool = [];
    for (const word of options) {
        if (neighbors[word] && neighbors[word].length > neighborLimit) {
            continue;
        }

        pool.push(word);
        pool.push(word);
        if (neighbors[word] && neighbors[word].length == 1) {
            pool.push(word);
        }
    }
    const baseWord = pickRandomItems(pool, 1).picked[0];
    return baseWord;
}

function pickTwoDistantWords(wordCoordMap, neighbors) {
    let options = Object.keys(wordCoordMap);
    if (coinFlip()) {
        options = options.filter(word => neighbors[word].length == 1); // Only pick edges in the graph
    }
    let [startWord, endWord] = pickRandomItems(options, 2).picked;
    while (isNeighborTooClose(startWord, endWord, neighbors)) {
        [startWord, endWord] = pickRandomItems(options, 2).picked;
    }

    return [startWord, endWord];
}

function createDirectionQuestion(length) {
    length++;

    const words = createStimuli(length);
    let startWord;
    let endWord;

    let wordCoordMap = {};
    let premises = [];
    let conclusion;
    let conclusionCoord;
    let conclusionDirName;
    let diffCoord;
    let usedDirCoords;
    let neighbors;
    while (true) {
        wordCoordMap = {[words[0]]: [0, 0]};
        neighbors = {};
        premises = [];
        usedDirCoords = [];

        for (let i = 0; i < words.length - 1; i++) {
            const baseWord = pickBaseWord(wordCoordMap, neighbors);
            const dirCoord = pickDirection(dirCoords, baseWord, neighbors, wordCoordMap);
            const dirName = dirStringFromCoord(dirCoord);
            const nextWord = words[i+1];
            wordCoordMap[nextWord] = [
                wordCoordMap[baseWord][0] + dirCoord[0], // x
                wordCoordMap[baseWord][1] + dirCoord[1]  // y
            ];
            premises.push(createDirectionStatement(baseWord, nextWord, dirName, nameInverseDir[dirName]));
            usedDirCoords.push(dirCoord);
            neighbors[baseWord] = neighbors[baseWord] ?? [];
            neighbors[baseWord].push(nextWord);
            neighbors[nextWord] = neighbors[nextWord] ?? [];
            neighbors[nextWord].push(baseWord);
        }

        [startWord, endWord] = pickTwoDistantWords(wordCoordMap, neighbors);
        const [start, end] = [wordCoordMap[startWord], wordCoordMap[endWord]];
        diffCoord = findDiff2D(start, end);
        conclusionCoord = findDirectionCoord(start, end);
        conclusionDirName = dirStringFromCoord(conclusionCoord);
        if (conclusionDirName) {
            break;
        }
    }

    let isValid;
    if (coinFlip()) { // correct
        isValid = true;
        conclusion = createDirectionStatement(startWord, endWord, conclusionDirName, nameInverseDir[conclusionDirName]);
    }
    else {            // wrong
        isValid = false;
        const incorrectDirName = chooseIncorrectDirection(usedDirCoords, conclusionCoord, diffCoord);
        conclusion = createDirectionStatement(startWord, endWord, incorrectDirName, nameInverseDir[incorrectDirName]);
    }

    shuffle(premises);
    
    return {
        category: "Space Two D",
        startedAt: new Date().getTime(),
        wordCoordMap,
        isValid,
        premises,
        conclusion
    }
}

function createDirectionQuestion3D(length) {
    length++;

    const words = createStimuli(length);
    let startWord;
    let endWord;

    let wordCoordMap = {};
    let premises = [];
    let conclusion;
    let conclusionCoord;
    let conclusionDirName;
    let diffCoord;
    let usedDirCoords;
    let neighbors;
    while (true) {
        wordCoordMap = {[words[0]]: [0, 0, 0]};
        premises = [];
        neighbors = {};
        usedDirCoords = [];

        for (let i = 0; i < words.length - 1; i++) {
            const baseWord = pickBaseWord(wordCoordMap, neighbors);
            const dirCoord = pickDirection(dirCoords3D, baseWord, neighbors, wordCoordMap);
            const dirName = dirStringFromCoord(dirCoord);
            const nextWord = words[i+1];
            wordCoordMap[nextWord] = [
                wordCoordMap[baseWord][0] + dirCoord[0], // x
                wordCoordMap[baseWord][1] + dirCoord[1],  // y
                wordCoordMap[baseWord][2] + dirCoord[2]  // y
            ];
            premises.push(createDirection3DStatement(baseWord, nextWord, dirName, nameInverseDir3D[dirName]));
            usedDirCoords.push(dirCoord);
            neighbors[baseWord] = neighbors[baseWord] ?? [];
            neighbors[baseWord].push(nextWord);
            neighbors[nextWord] = neighbors[nextWord] ?? [];
            neighbors[nextWord].push(baseWord);
        }

        [startWord, endWord] = pickTwoDistantWords(wordCoordMap, neighbors);
        const [start, end] = [wordCoordMap[startWord], wordCoordMap[endWord]];
        diffCoord = findDiff4D(start, end);
        conclusionCoord = findDirectionCoord3D(start, end);
        conclusionDirName = dirStringFromCoord(conclusionCoord);
        if (conclusionDirName) {
            break;
        }
    }

    let isValid;
    if (coinFlip()) { // correct
        isValid = true;
        conclusion = createDirection3DStatement(startWord, endWord, conclusionDirName, nameInverseDir3D[conclusionDirName]);
    }
    else {            // wrong
        isValid = false;
        const incorrectDirName = chooseIncorrectDirection(usedDirCoords, conclusionCoord, diffCoord);
        conclusion = createDirection3DStatement(startWord, endWord, incorrectDirName, nameInverseDir3D[incorrectDirName]);
    }

    shuffle(premises);
    
    return {
        category: "Space Three D",
        startedAt: new Date().getTime(),
        wordCoordMap,
        isValid,
        premises,
        conclusion
    }
}

function createDirectionQuestion4D(length) {
    length++;

    const words = createStimuli(length);
    let startWord;
    let endWord;

    let wordCoordMap = {};
    let premises = [];
    let conclusion;
    let conclusionCoord;
    let conclusionDirName;
    let conclusionTimeName;
    let diffCoord;
    let usedDirCoords;
    let neighbors;
    while (true) {
        wordCoordMap = {[words[0]]: [0, 0, 0, 0]};
        premises = [];
        neighbors = {};
        usedDirCoords = [];

        for (let i = 0; i < words.length - 1; i++) {
            const baseWord = pickBaseWord(wordCoordMap, neighbors);
            const dirCoord = pickDirection(dirCoords4D, baseWord, neighbors, wordCoordMap);
            const dirName = dirStringFromCoord(dirCoord);
            const timeName = timeMapping[dirCoord[3]];
            const nextWord = words[i+1];
            wordCoordMap[nextWord] = [
                wordCoordMap[baseWord][0] + dirCoord[0], // x
                wordCoordMap[baseWord][1] + dirCoord[1],  // y
                wordCoordMap[baseWord][2] + dirCoord[2],  // y
                wordCoordMap[baseWord][3] + dirCoord[3]  // time
            ];
            premises.push(createDirection4DStatement(baseWord, nextWord, dirName, nameInverseDir3D[dirName], timeName, reverseTimeNames[timeName]));
            usedDirCoords.push(dirCoord);
            neighbors[baseWord] = neighbors[baseWord] ?? [];
            neighbors[baseWord].push(nextWord);
            neighbors[nextWord] = neighbors[nextWord] ?? [];
            neighbors[nextWord].push(baseWord);
        }

        [startWord, endWord] = pickTwoDistantWords(wordCoordMap, neighbors);
        const [start, end] = [wordCoordMap[startWord], wordCoordMap[endWord]];
        diffCoord = findDiff4D(start, end);
        conclusionCoord = findDirectionCoord4D(start, end);
        conclusionDirName = dirStringFromCoord(conclusionCoord);
        conclusionTimeName = timeMapping[conclusionCoord[3]]
        if (conclusionDirName) {
            break;
        }
    }

    let isValid;
    if (coinFlip()) { // correct
        isValid = true;
        conclusion = createDirection4DStatement(startWord, endWord, conclusionDirName, nameInverseDir3D[conclusionDirName], conclusionTimeName, reverseTimeNames[conclusionTimeName]);
    }
    else {            // wrong
        isValid = false;
        const incorrectCoord = chooseIncorrectCoord(usedDirCoords, conclusionCoord, diffCoord);
        const incorrectDirName = dirStringFromCoord(incorrectCoord);
        const incorrectTimeName = timeMapping[incorrectCoord[3]];
        conclusion = createDirection4DStatement(startWord, endWord, incorrectDirName, nameInverseDir3D[incorrectDirName], incorrectTimeName, reverseTimeNames[incorrectTimeName]);
    }

    shuffle(premises);
    
    return {
        category: "Space Time",
        startedAt: new Date().getTime(),
        wordCoordMap,
        isValid,
        premises,
        conclusion
    }
}
