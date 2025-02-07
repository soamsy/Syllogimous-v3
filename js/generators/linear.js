function pickLinearPremise(a, b, comparison, reverseComparison) {
    const ps = [
    `<span class="subject">${a}</span> is ${comparison} <span class="subject">${b}</span>`,
    `<span class="subject">${a}</span> is <span class="is-negated">${reverseComparison}</span> <span class="subject">${b}</span>`,
    ];
    return pickNegatable(ps);
}

function findTwoWordIndexes(words) {
    let wordsJump = Math.max(2, randomInclusive(words.length - 3, words.length - 1));
    let wordsOffset = randomInclusive(0, words.length - wordsJump - 1);
    let wordsEnd = Math.min(words.length - 1, wordsOffset + wordsJump);
    return [wordsOffset, wordsEnd];
}

class MoreLess {
    createLinearPremise(a, b) {
        return pickRandomItems([
            pickLinearPremise(a, b, 'less than', 'more than'),
            pickLinearPremise(b, a, 'more than', 'less than'),
        ], 1).picked[0];
    }

    createReverseLinearPremise(a, b) {
        return pickRandomItems([
            pickLinearPremise(a, b, 'more than', 'less than'),
            pickLinearPremise(b, a, 'less than', 'more than'),
        ], 1).picked[0];
    }

    getName() {
        return 'Comparison';
    }

    getCountdown() {
        return savedata.overrideComparisonTime;
    }

    isBacktrackingEnabled() {
        return savedata.enableBacktrackingComparison;
    }
}

class BeforeAfter {
    createLinearPremise(a, b) {
        return pickRandomItems([
            pickLinearPremise(a, b, 'before', 'after'),
            pickLinearPremise(b, a, 'after', 'before'),
        ], 1).picked[0];
    }

    createReverseLinearPremise(a, b) {
        return pickRandomItems([
            pickLinearPremise(a, b, 'after', 'before'),
            pickLinearPremise(b, a, 'before', 'after'),
        ], 1).picked[0];
    }

    getName() {
        return 'Temporal';
    }

    getCountdown(offset=0) {
        return savedata.overrideTemporalTime ? savedata.overrideTemporalTime + offset : null;
    }

    isBacktrackingEnabled() {
        return savedata.enableBacktrackingTemporal;
    }
}

class LinearQuestion {
    constructor(linearGenerator) {
        this.generator = linearGenerator;
    }

    generate(length) {
        let isValid;
        let premises;
        let conclusion;
        let buckets;
        let bucketMap;

        const words = createStimuli(length + 1);

        if (this.generator.isBacktrackingEnabled()) {
            [premises, conclusion, isValid, buckets, bucketMap] = this.buildBacktrackingMap(words);
        } else {
            [premises, conclusion, isValid] = this.buildLinearMap(words);
        }

        if (savedata.enableMeta) {
            premises = applyMeta(premises, p => p.match(/is (?:<span class="is-negated">)*(.*?)(?:<\/span>)* /)[1]);
        }

        premises = scramble(premises);
        this.premises = premises;
        this.conclusion = conclusion;
        this.isValid = isValid;
        if (this.generator.isBacktrackingEnabled()) {
            this.buckets = buckets;
            this.bucketMap = bucketMap;
        } else {
            this.bucket = words;
        }
    }

    buildLinearMap(words) {
        let premises = [];
        let conclusion;
        let isValid;

        for (let i = 0; i < words.length - 1; i++) {
            const curr = words[i];
            const next = words[i + 1];

            if (coinFlip()) {
                premises.push(this.generator.createLinearPremise(curr, next));
            } else {
                premises.push(this.generator.createReverseLinearPremise(next, curr));
            }
        }

        const [i, j] = findTwoWordIndexes(words);

        if (coinFlip()) {
            conclusion = this.generator.createLinearPremise(words[i], words[j]);
            isValid = i < j;
        } else {
            conclusion = this.generator.createReverseLinearPremise(words[i], words[j]);
            isValid = i > j;
        }

        return [premises, conclusion, isValid];
    }


    buildBacktrackingMap(words) {
        let premiseMap = {};
        let first = words[0];
        let bucketMap = { [first]: 0 };
        let neighbors = { [first]: [] };

        for (let i = 1; i < words.length; i++) {
            const source = pickBaseWord(neighbors, Math.random() < 0.6);
            const target = words[i];

            const key = premiseKey(source, target);
            if (coinFlip()) {
                if (coinFlip()) {
                    premiseMap[key] = this.generator.createLinearPremise(source, target);
                } else {
                    premiseMap[key] = this.generator.createReverseLinearPremise(target, source);
                }
                bucketMap[target] = bucketMap[source] + 1;
            } else {
                if (coinFlip()) {
                    premiseMap[key] = this.generator.createLinearPremise(target, source);
                } else {
                    premiseMap[key] = this.generator.createReverseLinearPremise(source, target);
                }
                bucketMap[target] = bucketMap[source] - 1;
            }

            neighbors[source] = neighbors?.[source] ?? [];
            neighbors[target] = neighbors?.[target] ?? [];
            neighbors[target].push(source);
            neighbors[source].push(target);
        }

        const bucketTargets = Object.values(bucketMap);
        const low = bucketTargets.reduce((a, b) => Math.min(a, b));
        const high = bucketTargets.reduce((a, b) => Math.max(a, b));
        let buckets = Array(high - low + 1).fill(0);
        buckets = buckets.map(x => []);
        for (const word in bucketMap) {
            buckets[bucketMap[word] - low].push(word);
        }

        let premises = orderPremises(premiseMap, neighbors);
        let a, b, tries;
        for (let tries = 0; tries < 10; tries++) {
            [a, b] = new DirectionPairChooser().pickTwoDistantWords(neighbors);
            if (bucketMap[a] !== bucketMap[b]) {
                break;
            }
        }
        for (let tries = 0; tries < 9999 && bucketMap[a] === bucketMap[b]; tries++) {
            [a, b] = pickRandomItems(words, 2).picked;
        }

        let conclusion, isValid;
        if (coinFlip()) {
            conclusion = this.generator.createLinearPremise(a, b);
            isValid = bucketMap[a] < bucketMap[b];
        } else {
            conclusion = this.generator.createReverseLinearPremise(a, b);
            isValid = bucketMap[a] > bucketMap[b];
        }

        return [premises, conclusion, isValid, buckets, bucketMap];
    }

    indexOfWord(word) {
        if (this.generator.isBacktrackingEnabled()) {
            return this.bucketMap[word];
        } else {
            return this.bucket.indexOf(word);
        }
    }

    createAnalogy(length) {
        this.generate(length);
        let a, b, c, d;
        if (this.generator.isBacktrackingEnabled()) {
            [a, b, c, d] = pickRandomItems(Object.keys(this.bucketMap), 4).picked
        } else {
            [a, b, c, d] = pickRandomItems(this.bucket, 4).picked;
        }

        const [indexOfA, indexOfB] = [this.indexOfWord(a), this.indexOfWord(b)];
        const [indexOfC, indexOfD] = [this.indexOfWord(c), this.indexOfWord(d)];
        const isValidSame = indexOfA > indexOfB && indexOfC > indexOfD
                   || indexOfA < indexOfB && indexOfC < indexOfD;

        let conclusion = analogyTo(a, b);
        let isValid;
        if (coinFlip()) {
            conclusion += pickAnalogyStatementSame();
            isValid = isValidSame;
        } else {
            conclusion += pickAnalogyStatementDifferent();
            isValid = !isValidSame;
        }
        conclusion += analogyTo(c, d);

        const countdown = this.generator.getCountdown();
        return {
            category: 'Analogy: ' + this.generator.getName(),
            type: normalizeString(this.generator.getName()),
            startedAt: new Date().getTime(),
            ...(this.bucket && { bucket: this.bucket }),
            ...(this.buckets && { buckets: this.buckets, modifiers: ['180'] }),
            premises: this.premises,
            isValid,
            conclusion,
            ...(countdown && { countdown }),
        }
    }

    createQuestion(length) {
        this.generate(length);
        const countdown = this.generator.getCountdown();
        return {
            category: this.generator.getName(),
            type: normalizeString(this.generator.getName()),
            startedAt: new Date().getTime(),
            ...(this.bucket && { bucket: this.bucket }),
            ...(this.buckets && { buckets: this.buckets, modifiers: ['180'] }),
            premises: this.premises,
            isValid: this.isValid,
            conclusion: this.conclusion,
            ...(countdown && { countdown }),
        }
    }
}

function createBeforeAfter(length) {
    return new LinearQuestion(new BeforeAfter()).createQuestion(length);
}

function createMoreLess(length) {
    return new LinearQuestion(new MoreLess()).createQuestion(length);
}
