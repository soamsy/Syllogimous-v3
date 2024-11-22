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
}

class Direction3D {
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
}

class DirectionQuestion {
    constructor(directionGenerator) {
        this.generator = directionGenerator;
        this.pairChooser = new DirectionPairChooser();
        this.incorrectDirections = new IncorrectDirections();
    }

    generate(length) {
        const words = createStimuli(length + 1);
        let startWord;
        let endWord;

        let wordCoordMap = {};
        let premises = [];
        let conclusion;
        let conclusionCoord;
        let diffCoord;
        let usedDirCoords;
        let neighbors;
        const branchesAllowed = Math.random() > 0.33;
        while (true) {
            wordCoordMap = {[words[0]]: this.generator.initialCoord() };
            neighbors = {};
            premises = [];
            usedDirCoords = [];

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

            [startWord, endWord] = this.pairChooser.pickTwoDistantWords(wordCoordMap, neighbors);
            const [start, end] = [wordCoordMap[startWord], wordCoordMap[endWord]];
            diffCoord = diffCoords(start, end);
            conclusionCoord = normalize(diffCoord);
            if (conclusionCoord.slice(0, 3).some(c => c !== 0)) {
                break;
            }
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
        this.conclusion = conclusion;
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
