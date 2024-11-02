function findDirectionCoord(aCoord, bCoord) {
    const x = aCoord[0];
    const y = aCoord[1];
    const x2 = bCoord[0];
    const y2 = bCoord[1];
    const dx = ((x - x2)/Math.abs(x - x2)) || 0;
    const dy = ((y - y2)/Math.abs(y - y2)) || 0;
    return [dx, dy];
}

function findDirection(aCoord, bCoord) {
    return dirStringFromCoord(findDirectionCoord(aCoord, bCoord));
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

function createDirection4DStatement(source, target, direction, reverseDirection, timeName) {
    return pickStatement([
        createDirectionTemplate(source, target, direction, false, timeName + ' '), 
        createDirectionTemplate(source, target, reverseDirection, true, timeName + ' '),
        createDirectionTemplate(target, source, reverseDirection, false, timeName + ' '), 
        createDirectionTemplate(target, source, direction, true, timeName + ' ')
    ]);
}

function createIncorrectConclusionCoords(usedCoords, correctCoord) {
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
    let combinations = [];
    for (const i in correctCoord) {
        for (const shift of [-2, -1, 1, 2]) {
            let newCombo = structuredClone(correctCoord);
            newCombo[i] += shift;
            if (validDirections[JSON.stringify(newCombo)]) {
                combinations.push(newCombo);
            }
        }
    }
    combinations.push(opposite);
    return combinations;
}

function chooseIncorrectDirection(usedCoords, correctCoord) {
    const incorrectCoords = createIncorrectConclusionCoords(usedCoords, correctCoord);
    const incorrectDirections = incorrectCoords.map(dirStringFromCoord).filter(dirName => dirName);
    return pickRandomItems(incorrectDirections, 1).picked[0];
}

function pickRandomDirection(dirNames, dirCoords) {
    const dirIndex = 1 + Math.floor(Math.random()*(dirNames.length - 1));
    const dirName = dirNames[dirIndex];
    const dirCoord = dirCoords[dirIndex];
    return [dirName, dirCoord];
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

function createDirectionQuestion(length) {
    length++;

    const words = createStimuli(length);
    const [startWord, endWord] = findTwoWords(words);

    let wordCoordMap = {};
    let premises = [];
    let conclusion;
    let conclusionCoord;
    let conclusionDirName;
    let usedDirCoords;
    let neighbors;
    while (true) {
        wordCoordMap = {[words[0]]: [0, 0]};
        neighbors = {};
        premises = [];
        usedDirCoords = [];

        for (let i = 0; i < words.length - 1; i++) {
            const [dirName, dirCoord] = pickRandomDirection(dirNames, dirCoords);
            const baseWord = pickRandomItems(Object.keys(wordCoordMap), 1).picked[0];
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

        conclusionCoord = findDirectionCoord(
            wordCoordMap[startWord],
            wordCoordMap[endWord]
        );

        if (isNeighborTooClose(startWord, endWord, neighbors)) {
            continue;
        }

        conclusionDirName = dirStringFromCoord(conclusionCoord);
        if (conclusionDirName) {
            break;
        }
    }

    let isValid;
    if (coinFlip()) { // correct
        isValid = true;
        conclusion = createDirectionStatement(endWord, startWord, conclusionDirName, nameInverseDir[conclusionDirName]);
    }
    else {            // wrong
        isValid = false;
        const incorrectDirName = chooseIncorrectDirection(usedDirCoords, conclusionCoord);
        conclusion = createDirectionStatement(endWord, startWord, incorrectDirName, nameInverseDir[incorrectDirName]);
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

function findDirectionCoord3D(aCoord, bCoord) {
    const x = aCoord[0];
    const y = aCoord[1];
    const z = aCoord[2];
    const x2 = bCoord[0];
    const y2 = bCoord[1];
    const z2 = bCoord[2];
    const dx = ((x - x2)/Math.abs(x - x2)) || 0;
    const dy = ((y - y2)/Math.abs(y - y2)) || 0;
    const dz = ((z - z2)/Math.abs(z - z2)) || 0;
    return [dx, dy, dz];
}

function findDirection3D(aCoord, bCoord) {
    return dirStringFromCoord(findDirectionCoord3D(aCoord, bCoord));
}

function createDirectionQuestion3D(length) {
    length++;

    const words = createStimuli(length);
    const [startWord, endWord] = findTwoWords(words);

    let wordCoordMap = {};
    let premises = [];
    let conclusion;
    let conclusionCoord;
    let conclusionDirName;
    let usedDirCoords;
    let neighbors;
    while (true) {
        wordCoordMap = {[words[0]]: [0, 0, 0]};
        premises = [];
        neighbors = {};
        usedDirCoords = [];

        for (let i = 0; i < words.length - 1; i++) {
            const [dirName, dirCoord] = pickRandomDirection(dirNames3D, dirCoords3D);
            const baseWord = pickRandomItems(Object.keys(wordCoordMap), 1).picked[0];
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

        if (isNeighborTooClose(startWord, endWord, neighbors)) {
            continue;
        }

        conclusionCoord = findDirectionCoord3D(
            wordCoordMap[startWord],
            wordCoordMap[endWord]
        );

        conclusionDirName = dirStringFromCoord(conclusionCoord);
        if (conclusionDirName) {
            break;
        }
    }

    let isValid;
    if (coinFlip()) { // correct
        isValid = true;
        conclusion = createDirection3DStatement(endWord, startWord, conclusionDirName, nameInverseDir3D[conclusionDirName]);
    }
    else {            // wrong
        isValid = false;
        const incorrectDirName = chooseIncorrectDirection(usedDirCoords, conclusionCoord);
        conclusion = createDirection3DStatement(endWord, startWord, incorrectDirName, nameInverseDir3D[incorrectDirName]);
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

function findDirection4D(aCoord, bCoord) {
    const dirName = findDirection3D(aCoord, bCoord);

    const a = aCoord[3];
    const a2 = bCoord[3];

    return { spatial: dirName, temporal: timeNames[Math.sign(a-a2) + 1] };
}

function createDirectionQuestion4D(length) {
    length++;

    const words = createStimuli(length);
    const [startWord, endWord] = findTwoWords(words);

    let wordCoordMap = {};
    let premises = [];
    let conclusion;
    let conclusionCoord;
    let conclusionDirName = { spatial: null };
    let usedDirCoords = [];
    while (!conclusionDirName.spatial) {

        wordCoordMap = {[[words[0]]]: [0, 0, 0, 0]};
        premises = [];

        for (let i = 0; i < words.length - 1; i++) {
            const timeIndex =  pickRandomItems([-1,0,1], 1).picked[0];
            const timeName = timeNames[timeIndex + 1];
            const [dirName, dirCoord] = pickRandomDirection(dirNames3D, dirCoords3D);
            wordCoordMap[words[i+1]] = [
                wordCoordMap[words[i]][0] + dirCoord[0], // x
                wordCoordMap[words[i]][1] + dirCoord[1], // y
                wordCoordMap[words[i]][2] + dirCoord[2], // z
                wordCoordMap[words[i]][3] + timeIndex,   // time
            ];
            premises.push(createDirection4DStatement(words[i], words[i+1], dirName, nameInverseDir3D[dirName], timeName));
        }

        conclusionDirName = findDirection4D(
            wordCoordMap[startWord],
            wordCoordMap[endWord]
        );
    }

    let isValid;
    if (coinFlip()) { // correct
        isValid = true;
        conclusion = createDirection4DStatement(endWord, startWord, conclusionDirName.spatial, nameInverseDir3D[conclusionDirName.spatial], conclusionDirName.temporal);
    }
    else {            // wrong
        isValid = false;
        let oppositeDirection = findDirection4D(
            wordCoordMap[endWord],
            wordCoordMap[startWord]
        );
        conclusion = createDirection4DStatement(endWord, startWord, oppositeDirection.spatial, nameInverseDir3D[oppositeDirection.spatial], conclusionDirName.temporal);
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
