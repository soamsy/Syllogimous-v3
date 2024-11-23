class SpaceHardMode {
    constructor(generator) {
        this.generator = generator;
    }
    
    basicHardMode(wordCoordMap, startWord, endWord, originalConclusionCoord) {
        let newWordMap;
        let newDiffCoord;
        let newConclusionCoord;
        let operations;
        let usedDimensions;
        const demandClose = Math.random() > 0.3;
        const demandChange = Math.random() > 0.2;
        let closeTries = 10;
        let changeTries = 10;
        while (true) {
            newWordMap = structuredClone(wordCoordMap);
            [operations, usedDimensions] = this.applyHardMode(newWordMap, startWord, endWord);
            [newDiffCoord, newConclusionCoord] = getConclusionCoords(newWordMap, startWord, endWord);
            if (newConclusionCoord.slice(0, 3).every(c => c === 0)) {
                continue;
            }
            const distance = newDiffCoord.map(Math.abs).reduce((a, b) => a + b);
            const distanceLimit = Math.max(3, Math.floor(Object.keys(newWordMap).length / 2));
            const isClose = distance < distanceLimit;
            if (demandClose && !isClose && closeTries > 0) {
                closeTries--;
                continue;
            }
            const isChanged = !arraysEqual(originalConclusionCoord, newConclusionCoord);
            if (demandChange && !isChanged && changeTries > 0) {
                changeTries--;
                continue;
            }
            break;
        }
        return [newWordMap, operations, newDiffCoord, newConclusionCoord, usedDimensions];
    }

    applyHardMode(wordCoordMap, leftStart, rightStart) {
        const [leftChains, rightChains] = this.createChains(wordCoordMap, leftStart, rightStart);
        const dimensionsUsed = [...leftChains.map(([words, dimension]) => dimension), ...rightChains.map(([words, dimension]) => dimension)];
        const leftOperations = this.applyChain(wordCoordMap, leftChains, leftStart);
        const rightOperations = this.applyChain(wordCoordMap, rightChains, rightStart);
        return [[...leftOperations, ...rightOperations], dimensionsUsed];
    }

    createChains(wordCoordMap, leftStart, rightStart) {
        let leftChains = [];
        let rightChains = [];
        let leftDimensions = [];
        let rightDimensions = [];

        const bannedFromPool = new Set([leftStart, rightStart]);
        const pool = Object.keys(wordCoordMap).filter(word => !bannedFromPool.has(word));
        const dimensionPool = wordCoordMap[leftStart].map((c, i) => i);

        let wordSequence = repeatArrayUntil(shuffle(pool.slice()), this.generator.hardModeLevel());
        let count = 0;
        while (wordSequence.length > 0 && count < 100) {
            let chainSize = Math.min(wordSequence.length, pickRandomItems([1, 1, 2, 2, 2, 3], 1).picked[0]);
            if (chainSize == wordSequence.length && leftChains.length == 0 && rightChains.length == 0)
                chainSize = 1;
            let words = wordSequence.splice(0, chainSize);
            if (coinFlip()) {
                leftChains.push(this.directionize(words, leftStart, leftDimensions, rightDimensions, dimensionPool, wordCoordMap));
                leftDimensions.push(leftChains[leftChains.length - 1][1]);
            } else {
                rightChains.push(this.directionize(words, rightStart, rightDimensions, leftDimensions, dimensionPool, wordCoordMap));
                rightDimensions.push(rightChains[rightChains.length - 1][1]);
            }
            count++;
        }

        return [leftChains, rightChains];
    }

    directionize(words, start, usedDimensions, otherDimensions, dimensionPool, wordCoordMap) {
        let chainWords = words.slice();
        chainWords.push(start);

        let allShifts = dimensionPool.map(c => 0);
        pairwise(chainWords, (a, b) => {
            allShifts = addCoords(allShifts, normalize(diffCoords(wordCoordMap[a], wordCoordMap[b])).map(c => Math.abs(c)));
        })

        const lastUsed = usedDimensions.length > 0 ? usedDimensions[usedDimensions.length - 1] : -1;
        const lastOther = otherDimensions.length > 0 ? otherDimensions[otherDimensions.length - 1] : -1;
        const noLastUsed = dimensionPool.filter((v, i) => i !== lastUsed);
        const noLastOther = noLastUsed.filter((v, i) => i !== lastOther);

        const pool = new Set(noLastOther.length > 0 ? noLastOther : noLastUsed);
        const available = allShifts.map((v, i) => [v, i]).filter(([v, i]) => pool.has(i));
        shuffle(available);
        const sorted = available.sort((a, b) => b[0] - a[0]);
        return [chainWords, sorted[0][1]];
    }

    applyChain(wordCoordMap, chains, refWord) {
        if (chains.length === 0) {
            return [];
        }

        const mirrorPoint = (a, b, index) => {
            const p1 = wordCoordMap[a];
            const p2 = wordCoordMap[b];
            const diff = p2[index] - p1[index];
            const newPoint = p2.slice();
            newPoint[index] = p1[index] - diff;
            operations.push(createMirrorTemplate(a, b, dimensionNames[index]));
            return newPoint;
        }

        const setPoint = (a, b, index) => {
            const p1 = wordCoordMap[a];
            const p2 = wordCoordMap[b];
            const newPoint = p2.slice();
            newPoint[index] = p1[index];
            operations.push(createSetTemplate(a, b, dimensionNames[index]));
            return newPoint;
        }

        const scalePoint = (a, b, index) => {
            const p1 = wordCoordMap[a];
            const p2 = wordCoordMap[b];
            const diff = p2[index] - p1[index];
            const newPoint = p2.slice();
            const magnifier = 2;
            operations.push(createScaleTemplate(a, b, dimensionNames[index], magnifier));
            newPoint[index] = p1[index] + magnifier * diff;
            return newPoint;
        }

        let operations = [];
        let commandPool = [mirrorPoint, mirrorPoint, mirrorPoint, scalePoint, scalePoint];
        let starterCommandPool = [setPoint, mirrorPoint, scalePoint];
        let usedCommands = [];

        let count = 0;
        let cpool = starterCommandPool;
        for (const [chain, dimension] of chains) {
            for (let i = 1; i < chain.length; i++) {
                const a = chain[i-1];
                const b = chain[i];
                if (usedCommands.length > 1) {
                    cpool = cpool.filter(c => c !== usedCommands[usedCommands.length - 1]);
                }

                const command = pickRandomItems(cpool, 1).picked[0];
                wordCoordMap[b] = command.call(null, a, b, dimension);
                usedCommands.push(command);
                cpool = commandPool;
            }
        }
        return operations;
    }

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

