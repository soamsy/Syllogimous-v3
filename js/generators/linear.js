function pickLinearPremise(a, b, comparison, reverseComparison, min, minRev) {
    if (savedata.minimalMode) {
        comparison = min;
        reverseComparison = minRev;
    } else {
        comparison = comparison;
        reverseComparison = reverseComparison;
    }
    const ps = [
    `<span class="subject">${a}</span> <span class="relation">${comparison}</span> <span class="subject">${b}</span>`,
    `<span class="subject">${a}</span> <span class="relation"><span class="is-negated">${reverseComparison}</span></span> <span class="subject">${b}</span>`,
    ];
    return pickNegatable(ps);
}

function startHeavyWeightedChoiceInRange(start, end) {
    const weights = Array.from({ length: end - start + 1 }, (_, i) => end - start - i + 1);
    const totalWeight = weights.reduce((acc, val) => acc + val, 0);
    const randomNum = Math.random() * totalWeight;
    let sum = 0;

    for (let i = start; i <= end; i++) {
        sum += weights[i - start];
        if (randomNum <= sum) {
            return i
        }
    }
    return end;
}

function findTwoWordIndexes(words) {
    const minSpan = Math.min(words.length - 1, words.length < 8 ? 3 : 4);
    const selectedSpan = startHeavyWeightedChoiceInRange(minSpan, words.length - 1);
    const defaultStartOption = Math.floor((words.length - selectedSpan - 1) / 2);
    const devianceFromDefault = startHeavyWeightedChoiceInRange(0, defaultStartOption)
    let start = defaultStartOption + devianceFromDefault * (coinFlip() ? 1 : -1);
    start = Math.max(0, Math.min(start, words.length - selectedSpan - 1));
    const end = start + selectedSpan;
    return [start, end];
}

class LinearGenerator {
    constructor(name, prev, prevMin, next, nextMin, equal, equalMin) {
        this.name = name;
        this.prev = prev;
        this.prevMin = prevMin;
        this.next = next;
        this.nextMin = nextMin;
        this.equal = equal;
        this.equalMin = equalMin;
    }

    forwards(a, b) {
        return pickLinearPremise(a, b, this.prev, this.next, this.prevMin, this.nextMin);
    }

    backwards(a, b) {
        return pickLinearPremise(a, b, this.next, this.prev, this.nextMin, this.prevMin);
    }

    createLinearPremise(a, b) {
        if (coinFlip()) {
            return this.forwards(a, b);
        } else {
            return this.backwards(b, a);
        }
    }

    createReverseLinearPremise(a, b) {
        return this.createLinearPremise(b, a);
    }

    createBacktrackingLinearPremise(a, b, options, isValid) {
        if (coinFlip()) {
            [a, b] = [b, a];
            options = options.map(choice => -choice);
        }
        const choice = pickRandomItems(options, 1).picked[0] + 1;
        const relations = [this.prev, this.equal, this.next];
        const relationsMin = [this.prevMin, this.equalMin, this.nextMin];
        const negatedChoice = pickRandomItems([0, 1, 2].filter(x => x !== choice), 1).picked[0];
        return pickLinearPremise(a, b, relations[choice], relations[negatedChoice], relationsMin[choice], relationsMin[negatedChoice]);
    }

    getName() {
        return this.name;
    }
}

const MORE_LESS = new LinearGenerator('Comparison', 'is less than', '<', 'is more than', '>', 'is equal to', '=');
const BEFORE_AFTER = new LinearGenerator('Temporal', 'is before', '[svg]4[/svg]', 'is after', '[svg]5[/svg]', 'is at', '=');
const CONTAINS_WITHIN = new LinearGenerator('Contains', 'contains', '⊃', 'is within', '⊂', 'is the same as', '=');
const LEFT_RIGHT = new LinearGenerator('Horizontal', 'is left of', '[svg]9[/svg]', 'is right of', '[svg]8[/svg]', 'is at', '=');
const TOP_UNDER = new LinearGenerator('Vertical', 'is on top of', '[svg]7[/svg]', 'is under', '[svg]6[/svg]', 'is at', '=');

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

        if (this.isBacktrackingEnabled()) {
            [premises, conclusion, isValid, buckets, bucketMap] = this.buildBacktrackingMap(words);
        } else {
            [premises, conclusion, isValid] = this.buildLinearMap(words);
        }

        if (savedata.enableMeta && !savedata.minimalMode) {
            premises = applyMeta(premises, p => p.match(/<span class="relation">(?:<span class="is-negated">)?(.*?)<\/span>/)[1]);
        }

        premises = scramble(premises);
        this.premises = premises;
        this.conclusion = conclusion;
        this.isValid = isValid;
        if (this.isBacktrackingEnabled()) {
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
        const chanceOfBranching = {
            5: 0.60,
            6: 0.55,
            7: 0.50,
            8: 0.45,
            9: 0.40,
            10: 0.35,
        }[words.length] ?? (words.length > 10 ? 0.3 : 0.6);

        const first = words[0];
        let idealDistance = null;
        if (words.length >= 5) {
            if (oneOutOf(8)) {
                idealDistance = 0;
            } else if (oneOutOf(7)) {
                idealDistance = 1;
            } else if (oneOutOf(8)) {
                idealDistance = 2;
            }
        }
        const chooseEqualItems = words.length >= 5 && oneOutOf(8);
        let premiseMap, bucketMap, neighbors;
        let a, b;
        const isIdealScenario = (a, b) => {
            if (idealDistance === null) {
                return true;
            }
            return Math.abs(bucketMap[a] - bucketMap[b]) === idealDistance;
        };

        for (let tries = 0; tries < 9999; tries++) {
            premiseMap = {};
            bucketMap = { [first]: 0 };
            neighbors = { [first]: [] };
            for (let i = 1; i < words.length; i++) {
                const source = pickBaseWord(neighbors, Math.random() < chanceOfBranching);
                const target = words[i];
                const key = premiseKey(source, target);

                let forwardChance = 0.5;
                const neighborList = neighbors[source];
                const firstNeighbor = neighborList[0];
                if (firstNeighbor && neighborList.every(word => bucketMap[word] === bucketMap[firstNeighbor])) {
                    if (bucketMap[firstNeighbor] + 1 == bucketMap[source]) {
                        forwardChance = 0.6;
                    } else {
                        forwardChance = 0.4;
                    }
                }
                if (Math.random() < forwardChance) {
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
            [a, b] = new DirectionPairChooser().pickTwoDistantWords(neighbors);
            if (isIdealScenario(a, b)) {
                break;
            }
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
        const comparison = bucketMap[a] === bucketMap[b] ? 0 : (bucketMap[a] < bucketMap[b] ? -1 : 1)
        let conclusion, isValid;
        if (coinFlip()) {
            conclusion = this.generator.createBacktrackingLinearPremise(a, b, [comparison], true);
            isValid = true;
        } else {
            let options = [-1, 0, 1].filter(o => o !== comparison);
            const distance = Math.abs(bucketMap[a] - bucketMap[b]);
            const includeZero = {
                1: oneOutOf(2),
                2: oneOutOf(4),
                3: oneOutOf(6),
                4: oneOutOf(8),
            }?.[distance] ?? oneOutOf(12);
            if (!includeZero) {
                options = options.filter(o => o !== 0);
            }
            conclusion = this.generator.createBacktrackingLinearPremise(a, b, options, false);
            isValid = false;
        }

        return [premises, conclusion, isValid, buckets, bucketMap];
    }

    indexOfWord(word) {
        if (this.isBacktrackingEnabled()) {
            return this.bucketMap[word];
        } else {
            return this.bucket.indexOf(word);
        }
    }

    createAnalogy(length) {
        this.generate(length);
        let a, b, c, d;
        if (this.isBacktrackingEnabled()) {
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

        const countdown = this.getCountdown();
        return {
            category: 'Analogy: ' + this.generator.getName(),
            type: normalizeString('linear'),
            startedAt: new Date().getTime(),
            ...(this.bucket && { bucket: this.bucket }),
            ...(this.buckets && { buckets: this.buckets, modifiers: ['180'] }),
            premises: this.premises,
            isValid,
            conclusion,
            ...(countdown && { countdown }),
        }
    }

    create(length) {
        this.generate(length);
        const countdown = this.getCountdown();
        return {
            category: this.generator.getName(),
            type: normalizeString('linear'),
            startedAt: new Date().getTime(),
            ...(this.bucket && { bucket: this.bucket }),
            ...(this.buckets && { buckets: this.buckets, modifiers: ['180'] }),
            premises: this.premises,
            isValid: this.isValid,
            conclusion: this.conclusion,
            ...(countdown && { countdown }),
        }
    }

    getCountdown(offset=0) {
        return savedata.overrideLinearTime ? savedata.overrideLinearTime + offset : null;
    }

    isBacktrackingEnabled() {
        return savedata.enableBacktrackingLinear;
    }
}

function createLinearQuestion(wording) {
    if (wording === 'comparison') {
        return new LinearQuestion(MORE_LESS);
    } else if (wording === 'temporal') {
        return new LinearQuestion(BEFORE_AFTER);
    } else if (wording === 'topunder') {
        return new LinearQuestion(TOP_UNDER);
    } else if (wording === 'contains') {
        return new LinearQuestion(CONTAINS_WITHIN);
    } else {
        return new LinearQuestion(LEFT_RIGHT);
    }
}

function getEnabledLinearWordings() {
    return savedata.linearWording.split(',').filter(wording => wording && wording.length > 0);
}

function getEnabledLinearWeights() {
    const wordings = getEnabledLinearWordings();
    const weights = [
        [ 'leftright', savedata.overrideLeftRightWeight ],
        [ 'topunder', savedata.overrideTopUnderWeight ],
        [ 'comparison', savedata.overrideComparisonWeight ],
        [ 'temporal', savedata.overrideTemporalWeight ],
        [ 'contains', savedata.overrideContainsWeight ],
    ].filter(w => wordings.includes(w[0]));
    return weights;
}

function createLinearGenerators(length) {
    length = getPremisesFor("overrideLinearPremises", length);
    let generators = [];
    for (const [wording, weight] of getEnabledLinearWeights()) {
        generators.push({ question: createLinearQuestion(wording), premiseCount: length, weight: weight });
    }
    return generators;
}
