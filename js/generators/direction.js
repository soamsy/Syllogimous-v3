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
    constructor() {
        this.diagonals = [];
        for (let x = -1; x <= 1; x++) {
            for (let y = -1; y <= 1; y++) {
                if (x == 0 && y == 0) {
                    continue;
                }
                if (Math.abs(x) + Math.abs(y) >= 2) {
                    this.diagonals.push([x, y]);
                }
            }
        }
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
        return true;
    }

    pickDiagonalDirection() {
        return pickRandomItems(this.diagonals, 1).picked[0];
    }
}

class Direction3D {
    constructor() {
        this.diagonals = []
        for (let x = -1; x <= 1; x++) {
            for (let y = -1; y <= 1; y++) {
                for (let z = -1; z <= 1; z++) {
                    if (x === 0 && y === 0 && z === 0) {
                        continue;
                    }
                    if (Math.abs(x) + Math.abs(y) >= 2) {
                        this.diagonals.push([x, y, z]);
                    }
                }
            }
        }
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
        return true;
    }

    pickDiagonalDirection() {
        return pickRandomItems(this.diagonals, 1).picked[0];
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
}

class DirectionQuestion {
    constructor(directionGenerator) {
        this.generator = directionGenerator;
        this.pairChooser = new DirectionPairChooser();
        this.incorrectDirections = new IncorrectDirections();
    }

    getConclusion(wordCoordMap, startWord, endWord) {
        const [start, end] = [wordCoordMap[startWord], wordCoordMap[endWord]];
        const diffCoord = diffCoords(start, end);
        const conclusionCoord = normalize(diffCoord);
        return [diffCoord, conclusionCoord];
    }

    generate(length) {
        let startWord;
        let endWord;

        let conclusion;
        let conclusionCoord;
        let diffCoord;
        let [wordCoordMap, neighbors, premises, usedDirCoords] = [];
        const branchesAllowed = Math.random() > 0.33;
        while (true) {
            [wordCoordMap, neighbors, premises, usedDirCoords] = this.createWordMap(length, branchesAllowed);
            [startWord, endWord] = this.pairChooser.pickTwoDistantWords(wordCoordMap, neighbors);
            [diffCoord, conclusionCoord] = this.getConclusion(wordCoordMap, startWord, endWord);
            if (conclusionCoord.slice(0, 3).some(c => c !== 0)) {
                break;
            }
        }

        let operations;
        const level = savedata.spaceHardModeLevel;
        if (level && level > 0 && this.generator.hardModeAllowed()) {
            let newWordMap;
            let newDiffCoord;
            let newConclusionCoord;
            const demandClose = Math.random() > 0.3;
            const demandChange = Math.random() > 0.3;
            let closeTries = 10;
            let changeTries = 10;
            while (true) {
                newWordMap = structuredClone(wordCoordMap)
                operations = this.applyHardMode(level, newWordMap, neighbors, startWord, endWord);
                [newDiffCoord, newConclusionCoord] = this.getConclusion(newWordMap, startWord, endWord);
                if (newConclusionCoord.slice(0, 3).every(c => c === 0)) {
                    continue;
                }
                const distanceFromNeighbor = newDiffCoord.map((v, i) => Math.abs(v - newConclusionCoord[i])).reduce((a, b) => a + b);
                const distanceLimit = Math.max(2, Math.floor(Object.keys(newWordMap).length / 3));
                const isClose = distanceFromNeighbor < distanceLimit;
                if (demandClose && !isClose && closeTries > 0) {
                    closeTries--;
                    continue;
                }
                const isChanged = !arraysEqual(conclusionCoord, newConclusionCoord);
                if (demandChange && !isChanged && changeTries > 0) {
                    changeTries--;
                    continue;
                }
                break;
            }
            wordCoordMap = newWordMap;
            diffCoord = newDiffCoord;
            conclusionCoord = newConclusionCoord;
        }

        let isValid;
        if (coinFlip()) { // correct
            isValid = true;
            conclusion = this.generator.createDirectionStatement(startWord, endWord, conclusionCoord);
        }
        else {            // wrong
            isValid = false;
            const incorrectCoord = this.incorrectDirections.chooseIncorrectCoord(usedDirCoords, conclusionCoord, diffCoord);
            conclusion = this.generator.createDirectionStatement(startWord, endWord, incorrectCoord);
        }

        shuffle(premises);
        this.wordCoordMap = wordCoordMap;
        this.isValid = isValid;
        this.premises = premises;
        this.operations = operations;
        this.conclusion = conclusion;
    }

    createAnalogy(length) {
        let isValid;
        let isValidSame;
        let [wordCoordMap, neighbors, premises, usedDirCoords] = [];
        let [a, b, c, d] = [];
        const branchesAllowed = Math.random() > 0.2;
        const flip = coinFlip();
        while (flip !== isValidSame) {
            [wordCoordMap, neighbors, premises, usedDirCoords] = this.createWordMap(length, branchesAllowed);
            [a, b, c, d] = pickRandomItems(Object.keys(wordCoordMap), 4).picked;
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

        return {
            category: 'Analogy: ' + this.generator.getName(),
            startedAt: new Date().getTime(),
            wordCoordMap,
            isValid,
            premises,
            conclusion,
        }
    }

    createWordMap(length, branchesAllowed) {
        const words = createStimuli(length + 1);
        let wordCoordMap = {[words[0]]: this.generator.initialCoord() };
        let neighbors = {};
        let premises = [];
        let usedDirCoords = [];

        for (let i = 0; i < words.length - 1; i++) {
            const baseWord = this._pickBaseWord(wordCoordMap, neighbors, branchesAllowed);
            const dirCoord = this.generator.pickDirection(baseWord, neighbors, wordCoordMap);
            const nextWord = words[i+1];
            wordCoordMap[nextWord] = addCoords(wordCoordMap[baseWord], dirCoord);
            premises.push(this.generator.createDirectionStatement(baseWord, nextWord, dirCoord));
            usedDirCoords.push(dirCoord);
            neighbors[baseWord] = neighbors[baseWord] ?? [];
            neighbors[baseWord].push(nextWord);
            neighbors[nextWord] = neighbors[nextWord] ?? [];
            neighbors[nextWord].push(baseWord);
        }

        return [wordCoordMap, neighbors, premises, usedDirCoords];
    }

    applyHardMode(level, wordCoordMap, neighbors, leftStart, rightStart) {
        const findDimension = (lastDimension, lastUsed, words) => {
            let dimensions = wordCoordMap[leftStart].map(w => 0);
            pairwise(words, (a, b) => {
                dimensions = addCoords(dimensions, normalize(diffCoords(wordCoordMap[a], wordCoordMap[b])).map(c => Math.abs(c)));
            })
            let dimension = (lastUsed + 1) % dimensions.length;
            let best = dimensions[dimension];
            dimensions.forEach((v, i) => {
                if (v > best) {
                    best = v;
                    dimension = i;
                }
            });
            if (dimension === lastDimension) {
                dimension = (dimension + 1) % dimensions.length;
            }
            return dimension;
        }
        const bannedFromPool = new Set([leftStart, rightStart]);
        const pool = Object.keys(wordCoordMap).filter(word => !bannedFromPool.has(word));
        let leftChains = []
        let rightChains = []
        let lastUsed = -1;
        let remaining = level;
        let wordSequence = repeatArrayUntil(shuffle(pool.slice()), level);
        while (remaining > 0) {
            let chainSize = Math.min(remaining, pickRandomItems([1, 1, 2, 2, 2, 3], 1).picked[0]);
            if (chainSize == remaining && leftChains.length == 0 && rightChains.length == 0)
                chainSize = 1;
            let words = wordSequence.splice(0, chainSize);
            let dimension;
            if (coinFlip()) {
                words.push(leftStart);
                let lastDimension;
                if (leftChains.length > 0) {
                    lastDimension = leftChains[leftChains.length-1][1];
                }
                dimension = findDimension(lastDimension, lastUsed, words);
                lastUsed = dimension;
                leftChains.push([words, dimension]);
            } else {
                words.push(rightStart);
                let lastDimension;
                if (rightChains.length > 0) {
                    lastDimension = rightChains[rightChains.length-1][1];
                }
                dimension = findDimension(lastDimension, lastUsed, words);
                lastUsed = dimension;
                rightChains.push([words, dimension]);
            }

            remaining -= chainSize;
        }

        // const firstExp = createExplanation({wordCoordMap});

        const leftOperations = this.applyChain(wordCoordMap, leftChains, leftStart);
        const rightOperations = this.applyChain(wordCoordMap, rightChains, rightStart);
        // return [firstExp, ...leftOperations, ...rightOperations];
        return [...leftOperations, ...rightOperations];
    }

    applyChain(wordCoordMap, chains, refWord) {
        if (chains.length === 0) {
            return [];
        }
        let operations = [];
        const mirror = (a, b, index) => {
            const p1 = wordCoordMap[a];
            const p2 = wordCoordMap[b];
            const diff = p2[index] - p1[index];
            const newPoint = p2.slice();
            newPoint[index] = p1[index] - diff;
            operations.push(createMirrorTemplate(a, b, dimensionNames[index]));
            return newPoint;
        }

        const set = (a, b, index) => {
            const p1 = wordCoordMap[a];
            const p2 = wordCoordMap[b];
            const newPoint = p2.slice();
            newPoint[index] = p1[index];
            operations.push(createSetTemplate(a, b, dimensionNames[index]));
            return newPoint;
        }

        const scale = (a, b, index) => {
            const p1 = wordCoordMap[a];
            const p2 = wordCoordMap[b];
            const diff = p2[index] - p1[index];
            const newPoint = p2.slice();
            const magnifier = 2;
            operations.push(createScaleTemplate(a, b, dimensionNames[index], magnifier));
            newPoint[index] = p1[index] + magnifier * diff;
            return newPoint;
        }

        let commandPool = [mirror, mirror, mirror, scale, scale];
        let starterCommandPool = [set, mirror, scale];
        let usedCommands = [];

        let count = 0;
        for (const [chain, dimension] of chains) {
            for (let i = 1; i < chain.length; i++) {
                const a = chain[i-1];
                const b = chain[i];
                let cpool = (i === 1 ? starterCommandPool : commandPool).slice();
                if (usedCommands.length > 1) {
                    cpool = cpool.filter(c => c !== usedCommands[usedCommands.length - 1]);
                }

                const command = pickRandomItems(cpool, 1).picked[0];
                wordCoordMap[b] = command.call(null, a, b, dimension);
                usedCommands.push(command);
                // operations.push(createExplanation({wordCoordMap}));
            }
            count += 1;
        }
        return operations;
    }

    _pickBaseWord(wordCoordMap, neighbors, branchesAllowed) {
        const options = Object.keys(wordCoordMap);
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

    createQuestion(length) {
        this.generate(length);
        return {
            category: this.generator.getName(),
            startedAt: new Date().getTime(),
            wordCoordMap: this.wordCoordMap,
            isValid: this.isValid,
            premises: this.premises,
            operations: this.operations,
            conclusion: this.conclusion,
        }
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

function createMirrorTemplate(a, b, dimension) {
    return `<span class="subject">${b}</span> is <span class="highlight">${dimension}</span>-mirrored across <span class="subject">${a}</span>`;
}
function createScaleTemplate(a, b, dimension, scale) {
    return ` <span class="subject">${b}</span> is <span class="highlight">${dimension}</span>-scaled <span class="highlight">${scale}×</span> from <span class="subject">${a}</span>`;
}
function createSetTemplate(a, b, dimension) {
    return `<span class="highlight">${dimension}</span> of <span class="subject">${b}</span> is set to <span class="highlight">${dimension}</span> of <span class="subject">${a}</span>`;
}
function createShiftTemplate(word, direction, shift) {
    return `<span class="subject">${word}</span> is moved ${direction} by <span class="highlight">${shift}</span>`;
}

function repeatArrayUntil(arr, n) {
    const result = [];
    while (result.length < n) {
        result.push(...arr); // Spread the array and append it to the result
    }
    return result.slice(0, n); // Trim the array to exactly 'n' elements
}

function interleaveArrays(arr1, arr2) {
    const maxLength = Math.max(arr1.length, arr2.length); // Get the longer array's length
    const result = [];

    for (let i = 0; i < maxLength; i++) {
        if (i < arr1.length) {
            result.push(arr1[i]); // Add element from the first array if it exists
        }
        if (i < arr2.length) {
            result.push(arr2[i]); // Add element from the second array if it exists
        }
    }

    return result;
}

function pairwise(arr, callback) {
    for (let i = 0; i < arr.length - 1; i++) {
        callback(arr[i], arr[i + 1], i, arr);
    }
}
