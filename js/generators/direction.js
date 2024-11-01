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
        createDirectionTemplate(source, target, reverseDirection, true, 'is at ')
    ]);
}

function createDirection3DStatement(source, target, direction, reverseDirection) {
    return pickStatement([
        createDirectionTemplate(source, target, direction, false, 'is '), 
        createDirectionTemplate(source, target, reverseDirection, true, 'is ')
    ]);
}

function createDirection4DStatement(source, target, direction, reverseDirection, timeName) {
    return pickStatement([
        createDirectionTemplate(source, target, direction, false, timeName + ' '), 
        createDirectionTemplate(source, target, reverseDirection, true, timeName + ' ')
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
        for (const shift of [-1, 1]) {
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
    while (!conclusionDirName) {

        wordCoordMap = {};
        premises = [];
        usedDirCoords = [];

        for (let i = 0; i < words.length - 1; i++) {
            const dirIndex = 1 + Math.floor(Math.random()*(dirNames.length - 1));
            const dirName = dirNames[dirIndex];
            const dirCoord = dirCoords[dirIndex];
            usedDirCoords.push(dirCoord);
            if (i === 0) {
                wordCoordMap[words[i]] = [0,0];
            }
            wordCoordMap[words[i+1]] = [
                wordCoordMap[words[i]][0] + dirCoord[0], // x
                wordCoordMap[words[i]][1] + dirCoord[1]  // y
            ];
            premises.push(createDirectionStatement(words[i], words[i+1], dirName, nameInverseDir[dirName]));
        }

        conclusionCoord = findDirectionCoord(
            wordCoordMap[startWord],
            wordCoordMap[endWord]
        );

        conclusionDirName = dirStringFromCoord(conclusionCoord);
    }

    let isValid;
    if (coinFlip()) { // correct
        isValid = true;
        conclusion = createDirectionStatement(startWord, endWord, conclusionDirName, nameInverseDir[conclusionDirName]);
    }
    else {            // wrong
        isValid = false;
        const incorrectCoords = createIncorrectConclusionCoords(usedDirCoords, conclusionCoord);
        const incorrectDirections = incorrectCoords.map(dirStringFromCoord).filter(dirName => dirName);
        const incorrectDirName = pickRandomItems(incorrectDirections, 1).picked[0];
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
    while (!conclusionDirName) {

        wordCoordMap = {};
        premises = [];
        usedDirCoords = [];

        for (let i = 0; i < words.length - 1; i++) {
            const dirIndex = 1 + Math.floor(Math.random()*(dirNames3D.length - 1));
            const dirName = dirNames3D[dirIndex];
            const dirCoord = dirCoords3D[dirIndex];
            usedDirCoords.push(dirCoord);
            if (i === 0) {
                wordCoordMap[words[i]] = [0,0,0];
            }
            wordCoordMap[words[i+1]] = [
                wordCoordMap[words[i]][0] + dirCoord[0], // x
                wordCoordMap[words[i]][1] + dirCoord[1], // y
                wordCoordMap[words[i]][2] + dirCoord[2], // z
            ];
            premises.push(createDirection3DStatement(words[i], words[i+1], dirName, nameInverseDir3D[dirName]));
        }
        
        conclusionCoord = findDirectionCoord3D(
            wordCoordMap[startWord],
            wordCoordMap[endWord]
        );

        conclusionDirName = dirStringFromCoord(conclusionCoord);
    }

    let isValid;
    if (coinFlip()) { // correct
        isValid = true;
        conclusion = createDirection3DStatement(startWord, endWord, conclusionDirName, nameInverseDir3D[conclusionDirName]);
    }
    else {            // wrong
        isValid = false;
        const incorrectCoords = createIncorrectConclusionCoords(usedDirCoords, conclusionCoord);
        const incorrectDirections = incorrectCoords.map(dirStringFromCoord).filter(dirName => dirName);
        const incorrectDirName = pickRandomItems(incorrectDirections, 1).picked[0];
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

        wordCoordMap = {};
        premises = [];

        for (let i = 0; i < words.length - 1; i++) {
            const timeIndex =  pickRandomItems([-1,0,1], 1).picked[0];
            const timeName = timeNames[timeIndex + 1];
            const dirIndex = 1 + Math.floor(Math.random()*(dirNames3D.length - 1));
            const dirName = dirNames3D[dirIndex];
            const dirCoord = dirCoords3D[dirIndex];
            if (i === 0) {
                wordCoordMap[words[i]] = [0,0,0,0];
            }
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
        conclusion = createDirection4DStatement(startWord, endWord, conclusionDirName.spatial, nameInverseDir3D[conclusionDirName.spatial], conclusionDirName.temporal);
    }
    else {            // wrong
        isValid = false;
        let oppositeDirection = findDirection4D(
            wordCoordMap[endWord],
            wordCoordMap[startWord]
        );
        conclusion = createDirection4DStatement(startWord, endWord, oppositeDirection.spatial, nameInverseDir3D[oppositeDirection.spatial], conclusionDirName.temporal);
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

