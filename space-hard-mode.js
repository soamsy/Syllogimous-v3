class SpaceHardMode {
    constructor(generator) {
        this.generator = generator;
    }
    
    basicHardMode(wordCoordMap, startWord, endWord, originalConclusionCoord) {
        let newWordMap;
        let newDiffCoord;
        let newConclusionCoord;
        const demandClose = Math.random() > 0.3;
        const demandChange = Math.random() > 0.3;
        let closeTries = 10;
        let changeTries = 10;
        while (true) {
            newWordMap = structuredClone(wordCoordMap)
            operations = this.applyHardMode(newWordMap, startWord, endWord);
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
            const isChanged = !arraysEqual(originalConclusionCoord, newConclusionCoord);
            if (demandChange && !isChanged && changeTries > 0) {
                changeTries--;
                continue;
            }
            break;
        }
        return [newWordMap, newDiffCoord, newConclusionCoord];
    }

    applyHardMode(wordCoordMap, leftStart, rightStart) {
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
        let remaining = this.generator.hardModeLevel();
        let wordSequence = repeatArrayUntil(shuffle(pool.slice()), this.generator.hardModeLevel());
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

