function diffCoords(a, b) {
    return b.map((c, i) => c - a[i]);
}

function addCoords(a, b) {
    return a.map((c, i) => c + b[i]);
}

function normalize(a) {
    return a.map(c => c/Math.abs(c) || 0);
}

function findDirection(a, b) {
    return normalize(diffCoords(a, b));
}

function getConclusionCoords(wordCoordMap, startWord, endWord) {
    const [start, end] = [wordCoordMap[startWord], wordCoordMap[endWord]];
    const diffCoord = diffCoords(start, end);
    const conclusionCoord = normalize(diffCoord);
    return [diffCoord, conclusionCoord];
}

function createDirectionTemplate(source, target, direction, isNegated, decorator='') {
    let directionElement = direction;
    if (isNegated) {
        directionElement = '<span class="is-negated">' + directionElement + '</span>';
    }
    directionElement = decorator + directionElement;
    return `<span class="subject">${target}</span> ${directionElement} of <span class="subject">${source}</span>`;
}

function taxicabDistance(a, b) {
    return a.map((v,i) => Math.abs(b[i] - v)).reduce((left,right) => left + right)
}

function pickWeightedRandomDirection(dirCoords, baseWord, neighbors, wordCoordMap) {
    const badTargets = (neighbors[baseWord] ?? []).map(word => wordCoordMap[word]);
    const base = wordCoordMap[baseWord];
    let pool = [];
    for (const dirCoord of dirCoords) {
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

class Direction2D {
    constructor(enableHardMode=true) {
        this.enableHardMode = enableHardMode;
    }

    pickDirection(baseWord, neighbors, wordCoordMap) {
        return pickWeightedRandomDirection(dirCoords.slice(1), baseWord, neighbors, wordCoordMap);
    }

    createDirectionStatement(a, b, dirCoord) {
        const dirName = dirStringFromCoord(dirCoord);
        return this._pickDirectionStatement(a, b, dirName, nameInverseDir[dirName])
    }

    _pickDirectionStatement(a, b, direction, reverseDirection) {
        return pickRandomItems([
            pickNegatable([createDirectionTemplate(a, b, direction, false, 'is at '), createDirectionTemplate(a, b, reverseDirection, true, 'is at ')]),
            pickNegatable([createDirectionTemplate(b, a, reverseDirection, false, 'is at '), createDirectionTemplate(b, a, direction, true, 'is at ')])
        ], 1).picked[0];
    }

    initialCoord() {
        return [0, 0];
    }

    getName() {
        return "Space Two D";
    }

    hardModeAllowed() {
        return this.enableHardMode;
    }

    hardModeLevel() {
        return savedata.space2DHardModeLevel;
    }

    getCountdown(offset=0) {
        return savedata.overrideDirectionTime ? savedata.overrideDirectionTime + offset : null;
    }
}

class Direction3D {
    constructor(enableHardMode=true) {
        this.enableHardMode = enableHardMode;
    }

    pickDirection(baseWord, neighbors, wordCoordMap) {
        return pickWeightedRandomDirection(dirCoords3D, baseWord, neighbors, wordCoordMap);
    }

    createDirectionStatement(a, b, dirCoord) {
        const dirName = dirStringFromCoord(dirCoord);
        return this._pickDirectionStatement(a, b, dirName, nameInverseDir3D[dirName])
    }

    _pickDirectionStatement(a, b, direction, reverseDirection) {
        return pickRandomItems([
            pickNegatable([createDirectionTemplate(a, b, direction, false, 'is '), createDirectionTemplate(a, b, reverseDirection, true, 'is ')]),
            pickNegatable([createDirectionTemplate(b, a, reverseDirection, false, 'is '), createDirectionTemplate(b, a, direction, true, 'is ')])
        ], 1).picked[0];
    }

    initialCoord() {
        return [0, 0, 0];
    }

    getName() {
        return "Space Three D";
    }

    hardModeAllowed() {
        return this.enableHardMode;
    }

    hardModeLevel() {
        return savedata.space3DHardModeLevel;
    }

    getCountdown(offset=0) {
        return savedata.overrideDirection3DTime ? savedata.overrideDirection3DTime + offset : null;
    }
}

class Direction4D {
    pickDirection(baseWord, neighbors, wordCoordMap) {
        let dirCoord
        do {
            dirCoord = pickWeightedRandomDirection(dirCoords4D, baseWord, neighbors, wordCoordMap);
        } while (dirCoord.slice(0, 3).every(c => c === 0))
        return dirCoord
    }

    createDirectionStatement(a, b, dirCoord) {
        const dirName = dirStringFromCoord(dirCoord);
        const timeName = timeMapping[dirCoord[3]];
        return this._pickDirectionStatement(a, b, dirName, nameInverseDir3D[dirName], timeName, reverseTimeNames[timeName])
    }

    _pickDirectionStatement(a, b, direction, reverseDirection, timeName, reverseTimeName) {
        return pickRandomItems([
            pickNegatable([createDirectionTemplate(a, b, direction, false, timeName + ' '), createDirectionTemplate(a, b, reverseDirection, true, reverseTimeName + ' ')]),
            pickNegatable([createDirectionTemplate(b, a, reverseDirection, false, reverseTimeName + ' '), createDirectionTemplate(b, a, direction, true, timeName + ' ')])
        ], 1).picked[0];
    }

    initialCoord() {
        return [0, 0, 0, 0];
    }

    getName() {
        return "Space Time";
    }

    hardModeAllowed() {
        return false;
    }

    getCountdown(offset=0) {
        return savedata.overrideDirection4DTime ? savedata.overrideDirection4DTime + offset : null;
    }
}

function pickBaseWord(neighbors, branchesAllowed) {
    if (savedata.enableConnectionBranching === false) {
        branchesAllowed = false;
    }
    const options = Object.keys(neighbors);
    const neighborLimit = (!branchesAllowed || options.length <= 3) ? 1 : 2;
    let pool = [];
    for (const word of options) {
        if (neighbors[word] && neighbors[word].length > neighborLimit) {
            continue;
        }

        pool.push(word);
        pool.push(word);
        pool.push(word);
        if (neighbors[word] && neighbors[word].length == 1) {
            pool.push(word);
            pool.push(word);
        }
    }
    const baseWord = pickRandomItems(pool, 1).picked[0];
    return baseWord;
}

class DirectionQuestion {
    constructor(directionGenerator) {
        this.generator = directionGenerator;
        this.pairChooser = new DirectionPairChooser();
        this.incorrectDirections = new IncorrectDirections();
        this.spaceHardMode = new SpaceHardMode(directionGenerator);
    }

    createQuestion(length) {
        let startWord;
        let endWord;

        let conclusion;
        let conclusionCoord;
        let diffCoord;
        let [wordCoordMap, neighbors, premises, usedDirCoords] = [];
        const branchesAllowed = Math.random() > 0.33;
        while (true) {
            [wordCoordMap, neighbors, premises, usedDirCoords] = this.createWordMap(length, branchesAllowed);
            [startWord, endWord] = this.pairChooser.pickTwoDistantWords(neighbors);
            [diffCoord, conclusionCoord] = getConclusionCoords(wordCoordMap, startWord, endWord);
            if (conclusionCoord.slice(0, 3).some(c => c !== 0)) {
                break;
            }
        }

        let operations;
        let hardModeDimensions;
        if (this.generator.hardModeAllowed() && this.generator.hardModeLevel() > 0) {
            [wordCoordMap, operations, diffCoord, conclusionCoord, hardModeDimensions] = this.spaceHardMode.basicHardMode(wordCoordMap, startWord, endWord, conclusionCoord);
        }

        let isValid;
        if (coinFlip()) { // correct
            isValid = true;
            conclusion = this.generator.createDirectionStatement(startWord, endWord, conclusionCoord);
        }
        else {            // wrong
            isValid = false;
            const incorrectCoord = this.incorrectDirections.chooseIncorrectCoord(usedDirCoords, conclusionCoord, diffCoord, hardModeDimensions);
            conclusion = this.generator.createDirectionStatement(startWord, endWord, incorrectCoord);
        }

        premises = scramble(premises);
        const countdown = this.generator.getCountdown();
        return {
            category: this.generator.getName(),
            startedAt: new Date().getTime(),
            wordCoordMap,
            isValid,
            premises,
            operations,
            conclusion,
            ...(countdown && { countdown }),
        }
    }

    createAnalogy(length, timeOffset) {
        let isValid;
        let isValidSame;
        let [wordCoordMap, neighbors, premises, usedDirCoords, operations] = [];
        let [a, b, c, d] = [];
        const branchesAllowed = Math.random() > 0.2;
        const flip = coinFlip();
        while (flip !== isValidSame) {
            [wordCoordMap, neighbors, premises, usedDirCoords] = this.createWordMap(length, branchesAllowed);
            [a, b, c, d] = pickRandomItems(Object.keys(wordCoordMap), 4).picked;
            if (this.generator.hardModeAllowed() && this.generator.hardModeLevel() > 0) {
                const [startWord, endWord] = pickRandomItems([a, b, c, d], 2).picked;
                const [diffCoord, conclusionCoord] = getConclusionCoords(wordCoordMap, startWord, endWord);
                let [_x, _y, _z] = [];
                [wordCoordMap, operations, _x, _y, _z] = this.spaceHardMode.basicHardMode(wordCoordMap, startWord, endWord, conclusionCoord);
            }
            isValidSame = arraysEqual(findDirection(wordCoordMap[a], wordCoordMap[b]), findDirection(wordCoordMap[c], wordCoordMap[d]));
        }
        let conclusion = analogyTo(a, b);
        if (coinFlip()) {
            conclusion += pickAnalogyStatementSame();
            isValid = isValidSame;
        } else {
            conclusion += pickAnalogyStatementDifferent();
            isValid = !isValidSame;
        }
        conclusion += analogyTo(c, d);

        const countdown = this.generator.getCountdown(timeOffset);
        return {
            category: 'Analogy: ' + this.generator.getName(),
            startedAt: new Date().getTime(),
            wordCoordMap,
            isValid,
            premises,
            operations,
            conclusion,
            ...(countdown && { countdown }),
        }
    }

    createWordMap(length, branchesAllowed) {
        const words = createStimuli(length + 1);
        let wordCoordMap = {[words[0]]: this.generator.initialCoord() };
        let neighbors = {[words[0]]: []};
        let premiseMap = {};
        let usedDirCoords = [];

        for (let i = 0; i < words.length - 1; i++) {
            const baseWord = pickBaseWord(neighbors, branchesAllowed);
            const dirCoord = this.generator.pickDirection(baseWord, neighbors, wordCoordMap);
            const nextWord = words[i+1];
            wordCoordMap[nextWord] = addCoords(wordCoordMap[baseWord], dirCoord);
            premiseMap[premiseKey(baseWord, nextWord)] = this.generator.createDirectionStatement(baseWord, nextWord, dirCoord);
            usedDirCoords.push(dirCoord);
            neighbors[baseWord] = neighbors[baseWord] ?? [];
            neighbors[baseWord].push(nextWord);
            neighbors[nextWord] = neighbors[nextWord] ?? [];
            neighbors[nextWord].push(baseWord);
        }

        const premises = orderPremises(premiseMap, neighbors);

        return [wordCoordMap, neighbors, premises, usedDirCoords];
    }
}

function createDirectionQuestion(length) {
    return new DirectionQuestion(new Direction2D()).createQuestion(length);
}

function createDirectionQuestion3D(length) {
    return new DirectionQuestion(new Direction3D()).createQuestion(length);
}

function createDirectionQuestion4D(length) {
    return new DirectionQuestion(new Direction4D()).createQuestion(length);
}
