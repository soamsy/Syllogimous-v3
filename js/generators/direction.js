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
    constructor(enableHardMode=true, enableAnchor=false) {
        this.enableHardMode = enableHardMode;
        this.enableAnchor = enableAnchor;
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
            pickNegatable([createDirectionTemplate(a, b, direction, false, 'is '), createDirectionTemplate(a, b, reverseDirection, true, 'is ')]),
            pickNegatable([createDirectionTemplate(b, a, reverseDirection, false, 'is '), createDirectionTemplate(b, a, direction, true, 'is ')])
        ], 1).picked[0];
    }

    initialCoord() {
        return [0, 0];
    }

    getName() {
        if (this.enableAnchor) {
            return "Anchor Space"
        } else {
            return "Space Two D";
        }
    }

    hardModeAllowed() {
        return this.enableHardMode;
    }

    hardModeLevel() {
        return savedata.space2DHardModeLevel;
    }

    getCountdown() {
        if (this.enableAnchor) {
            return savedata.overrideAnchorSpaceTime;
        } else {
            return savedata.overrideDirectionTime;
        }
    }

    shouldUseAnchor() {
        return this.enableAnchor;
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

    getCountdown() {
        return savedata.overrideDirection3DTime;
    }

    shouldUseAnchor() {
        return false;
    }
}

class Direction4D {
    constructor(enableHardMode=true) {
        this.enableHardMode = enableHardMode;
    }

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
        return this.enableHardMode;
    }

    hardModeLevel() {
        return savedata.space4DHardModeLevel;
    }

    getCountdown() {
        return savedata.overrideDirection4DTime;
    }

    shouldUseAnchor() {
        return false;
    }
}

function pickBaseWord(neighbors, branchesAllowed, bannedFromBranching=[]) {
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

        if (bannedFromBranching.includes(word) && neighbors[word].length > 1) {
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
    }

    createQuestion(length) {
        let startWord;
        let endWord;

        let conclusion;
        let conclusionCoord;
        let diffCoord;
        let [wordCoordMap, neighbors, premises, usedDirCoords] = [];
        let [numInterleaved, numTransforms] = this.getNumTransformsSplit(length);
        const branchesAllowed = Math.random() > 0.33;
        while (true) {
            if (this.generator.shouldUseAnchor()) {
                [wordCoordMap, neighbors, premises, usedDirCoords] = this.createWordMapAnchor(length, branchesAllowed);
            } else if (numInterleaved > 0) {
                [wordCoordMap, neighbors, premises, usedDirCoords] = this.createWordMapInterleaved(length);
            } else {
                [wordCoordMap, neighbors, premises, usedDirCoords] = this.createWordMap(length, branchesAllowed);
            }
            [startWord, endWord] = this.pairChooser.pickTwoDistantWords(neighbors);
            [diffCoord, conclusionCoord] = getConclusionCoords(wordCoordMap, startWord, endWord);
            if (conclusionCoord.slice(0, 3).some(c => c !== 0)) {
                break;
            }
        }

        let operations;
        let hardModeDimensions;
        if (numTransforms > 0) {
            [wordCoordMap, operations, hardModeDimensions] = new SpaceHardMode(numTransforms).basicHardMode(wordCoordMap, startWord, endWord, conclusionCoord);
            [diffCoord, conclusionCoord] = getConclusionCoords(wordCoordMap, startWord, endWord);
            if (numInterleaved > 0) {
                premises.push(...operations);
                operations = [];
                hardModeDimensions = conclusionCoord.map((d,i) => i);
            }
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

        if (numInterleaved === 0) {
            premises = scramble(premises);
        }
        const countdown = this.generator.getCountdown();
        const totalTransforms = this.getNumTransformsSplit(length).reduce((a, b) => a + b, 0);
        let modifiers = [];
        if (totalTransforms > 0) {
            modifiers.push(`op${totalTransforms}`);
        }
        if (numInterleaved > 0) {
            modifiers.push(`interleave`);
        }
        return {
            category: this.generator.getName(),
            type: normalizeString(this.generator.getName()),
            ...(totalTransforms > 0 && { plen: length }),
            modifiers,
            startedAt: new Date().getTime(),
            wordCoordMap,
            isValid,
            premises,
            operations,
            conclusion,
            ...(countdown && { countdown }),
        }
    }

    createAnalogy(length) {
        let isValid;
        let isValidSame;
        let [wordCoordMap, neighbors, premises, usedDirCoords, operations] = [];
        let [a, b, c, d] = [];
        let [numInterleaved, numTransforms] = this.getNumTransformsSplit(length);
        const branchesAllowed = Math.random() > 0.2;
        const flip = coinFlip();
        while (flip !== isValidSame) {
            if (this.generator.shouldUseAnchor()) {
                [wordCoordMap, neighbors, premises, usedDirCoords] = this.createWordMapAnchor(length, branchesAllowed);
            } else if (numInterleaved > 0) {
                [wordCoordMap, neighbors, premises, usedDirCoords] = this.createWordMapInterleaved(length);
            } else {
                [wordCoordMap, neighbors, premises, usedDirCoords] = this.createWordMap(length, branchesAllowed);
            }
            [a, b, c, d] = pickRandomItems(Object.keys(wordCoordMap), 4).picked;
            if (numTransforms > 0) {
                const [startWord, endWord] = pickRandomItems([a, b, c, d], 2).picked;
                const [diffCoord, conclusionCoord] = getConclusionCoords(wordCoordMap, startWord, endWord);
                let _x;
                [wordCoordMap, operations, _x] = new SpaceHardMode(numTransforms).basicHardMode(wordCoordMap, startWord, endWord, conclusionCoord);
                if (numInterleaved > 0) {
                    premises.push(...operations);
                    operations = [];
                }
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

        const countdown = this.generator.getCountdown();
        const totalTransforms = this.getNumTransformsSplit(length).reduce((a, b) => a + b, 0);
        let modifiers = [];
        if (totalTransforms > 0) {
            modifiers.push(`op${totalTransforms}`);
        }
        if (numInterleaved > 0) {
            modifiers.push(`interleave`);
        }
        return {
            category: 'Analogy: ' + this.generator.getName(),
            type: normalizeString(this.generator.getName()),
            modifiers,
            startedAt: new Date().getTime(),
            wordCoordMap,
            isValid,
            premises,
            operations,
            conclusion,
            ...(countdown && { countdown }),
        }
    }

    getNumTransformsSplit(numPremises) {
        const totalTransforms = this.generator.hardModeLevel();
        if (!this.generator.hardModeAllowed() || totalTransforms === 0) {
            return [0, 0];
        }

        if (!savedata.enableTransformInterleave) {
            return [0, totalTransforms];
        }
        let interleaveCount = Math.max(0, Math.min(totalTransforms - 1, numPremises - 1));
        return [interleaveCount, totalTransforms - interleaveCount];
    }

    createWordMapCommands(length) {
        const words = createStimuli(length + 1);
        let commands = words.map(w => ['move', w]);
        let [interleaveCount, _] = this.getNumTransformsSplit(length);
        if (interleaveCount === 0) {
            return [words, commands];
        }

        let transformCommands = []
        for (let i = 0; i < interleaveCount; i++) {
            transformCommands.push(['transform']);
        }
        let tailCommands = commands.slice(1, commands.length);
        let merged = frontHeavyIntervalMerge(tailCommands, transformCommands);
        merged.unshift(commands[0]);

        return [words, merged];
    }

    createWordMapInterleaved(length) {
        let [words, commands] = this.createWordMapCommands(length);
        const initialCoord = this.generator.initialCoord();
        let wordCoordMap = {[words[0]]: initialCoord };
        let neighbors = {[words[0]]: []};
        let premiseChunks = [[]];
        let operations = [];
        let usedDirCoords = [];

        let lastWord = words[0];
        let dimensionPool = repeatArrayUntil(shuffle(initialCoord.map((d, i) => i)), commands.length * 2);
        let dimensionIndex = 0;
        for (let i = 1; i < commands.length; i++) {
            let command = commands[i];
            let action = command[0];
            if (action === 'transform') {
                if (premiseChunks[premiseChunks.length - 1].length !== 0) {
                    premiseChunks.push([]);
                }
                let [newWordMap, operation] = new SpaceHardMode(0).oneTransform(wordCoordMap, lastWord, dimensionPool[dimensionIndex], dimensionPool[dimensionIndex+1]);
                dimensionIndex++;
                wordCoordMap = newWordMap;
                operations.push(operation);
            } else {
                const baseWord = lastWord;
                const nextWord = command[1];
                const dirCoord = this.generator.pickDirection(baseWord, neighbors, wordCoordMap);
                wordCoordMap[nextWord] = addCoords(wordCoordMap[baseWord], dirCoord);
                const premise = this.generator.createDirectionStatement(baseWord, nextWord, dirCoord);
                premiseChunks[premiseChunks.length - 1].push(premise);
                usedDirCoords.push(dirCoord);
                neighbors[baseWord] = neighbors[baseWord] ?? [];
                neighbors[baseWord].push(nextWord);
                neighbors[nextWord] = neighbors[nextWord] ?? [];
                neighbors[nextWord].push(baseWord);
                lastWord = nextWord;
            }
        }

        if (premiseChunks[premiseChunks.length - 1].length === 0) {
            premiseChunks.pop();
        }

        let scrambleLimit = savedata.scrambleLimit;
        premiseChunks = premiseChunks.map(chunk => {
            if (scrambleLimit === null) {
                return shuffle(chunk);
            } else {
                let chosenLimit = Math.min(scrambleLimit, chunk.length);
                scrambleLimit -= chosenLimit;
                return scrambleWithLimit(chunk, chosenLimit);
            }
        });

        let merged = interleaveArrays(premiseChunks, operations);
        let premises = merged.flatMap(p => {
            if (Array.isArray(p)) {
                return p;
            } else {
                return [p];
            }
        });

        return [wordCoordMap, neighbors, premises, usedDirCoords];
    }

    createWordMap(length, branchesAllowed) {
        const baseWords = createStimuli(length + 1);
        const start = baseWords[0];
        const words = baseWords.slice(1, baseWords.length);
        let wordCoordMap = {[start]: this.generator.initialCoord() };
        let neighbors = {[start]: []};
        return this.buildOntoWordMap(words, wordCoordMap, neighbors, branchesAllowed);
    }

    createWordMapAnchor(length, branchesAllowed) {
        const star = '[svg]0[/svg]';
        const circle = '[svg]1[/svg]';
        const triangle = '[svg]2[/svg]';
        const heart = '[svg]3[/svg]';

        let result;
        for (let i = 0; i < 10; i++) {
            const words = createStimuli(length, [star, circle, triangle, heart]);
            let wordCoordMap = {
                [star]: [0, 1],
                [circle]: [1, 0],
                [triangle]: [-1, 0],
                [heart]: [0, -1],
            };

            let starters = [star, circle, triangle, heart];
            shuffle(starters);
            const bannedFromBranching = [starters[1], starters[2], starters[3]];
            let neighbors;
            if (branchesAllowed) {
                neighbors = {
                    [starters[0]]: [starters[1], starters[2], starters[3]],
                    [starters[1]]: [starters[0]],
                    [starters[2]]: [starters[0]],
                    [starters[3]]: [starters[0]],
                };
            } else {
                neighbors = {
                    [starters[0]]: [starters[1], starters[2]],
                    [starters[1]]: [starters[0], starters[3]],
                    [starters[2]]: [starters[0]],
                    [starters[3]]: [starters[1]],
                };
            }

            result = this.buildOntoWordMap(words, wordCoordMap, neighbors, branchesAllowed, bannedFromBranching);
            const anchorConnections = starters.map(s => neighbors[s].length).reduce((a, b) => a + b, 0);
            if (anchorConnections >= 8) {
                break;
            }
        }
        return result;
    }

    buildOntoWordMap(words, wordCoordMap, neighbors, branchesAllowed, bannedFromBranching=[]) {
        let premiseMap = {};
        let usedDirCoords = [];

        for (const nextWord of words) {
            const baseWord = pickBaseWord(neighbors, branchesAllowed, bannedFromBranching);
            const dirCoord = this.generator.pickDirection(baseWord, neighbors, wordCoordMap);
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

function createDirectionQuestionAnchor(length) {
    return new DirectionQuestion(new Direction2D(false, true)).createQuestion(length);
}
