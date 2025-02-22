function pickDistinctionPremise(a, b, comparison, reverseComparison, min, minRev) {
    if (savedata.minimalMode) {
        comparison = min;
        reverseComparison = minRev;
    } else {
        comparison = 'is ' + comparison;
        reverseComparison = 'is ' + reverseComparison;
    }
    const ps = [
    `<span class="subject">${a}</span> <span class="relation">${comparison}</span> <span class="subject">${b}</span>`,
    `<span class="subject">${a}</span> <span class="relation"><span class="is-negated">${reverseComparison}</span></span> <span class="subject">${b}</span>`,
    ];
    return pickNegatable(ps);
}

function createSamePremise(a, b) {
    return pickDistinctionPremise(a, b, 'same as', 'opposite of', '=', '☍');
}

function createOppositePremise(a, b) {
    return pickDistinctionPremise(a, b, 'opposite of', 'same as', '☍', '=');
}

function applyMeta(premises, relationFinder) {
    // Randomly choose a number of meta-relations
    const numOfMetaRelations = 1 + Math.floor(Math.random() * Math.floor(premises.length / 2));
    let _premises = pickRandomItems(premises, numOfMetaRelations * 2);
    premises = [ ..._premises.remaining ];

    while (_premises.picked.length) {

        const choosenPair = pickRandomItems(_premises.picked, 2);
        const negations = choosenPair.picked.map(p => /is-negated/.test(p));
        const relations = choosenPair.picked.map(relationFinder);

        // Generate substitution string
        let substitution;
        const [a, b] = [
                ...choosenPair.picked[0]
                .matchAll(/<span class="subject">(.*?)<\/span>/g)
            ]
            .map(m => m[1]);
        const isSame = negations[0] ^ negations[1] ^ (relations[0] === relations[1]);
        if (isSame) {
            substitution = pickNegatable([
                `$1 is same as <span class="is-meta">(<span class="subject">${a}</span> to <span class="subject">${b}</span>)</span> to $3`,
                `$1 is <span class="is-negated">opposite of</span> <span class="is-meta">(<span class="subject">${a}</span> to <span class="subject">${b}</span>)</span> to $3`
            ]);
        } else {
            substitution = pickNegatable([
                `$1 is opposite of <span class="is-meta">(<span class="subject">${a}</span> to <span class="subject">${b}</span>)</span> to $3`,
                `$1 is <span class="is-negated">same as</span> <span class="is-meta">(<span class="subject">${a}</span> to <span class="subject">${b}</span>)</span> to $3`
            ]);
        }
        
        // Replace relation with meta-relation via substitution string
        const metaPremise = choosenPair.picked[1]
            .replace(/(<span class="relation">)(.*)(<\/span>) (?=<span class="subject">)/, substitution);

        // Push premise and its corresponding meta-premise
        premises.push(choosenPair.picked[0], metaPremise);

        // Update _premises so that it doesn't end up in an infinite loop
        _premises = { picked: choosenPair.remaining };
    }
    return premises;
}

class DistinctionQuestion {
    generate(length) {
        length++;
    
        const words = createStimuli(length);

        let premiseMap = {};
        let first = words[0];
        let bucketMap = { [first]: 0 };
        let neighbors = { [first]: [] };

        const chanceOfBranching = {
            5: 0.60,
            6: 0.55,
            7: 0.50,
            8: 0.45,
            9: 0.40,
            10: 0.35,
        }[words.length] ?? (words.length > 10 ? 0.3 : 0.6);
        for (let i = 1; i < words.length; i++) {
            const source = pickBaseWord(neighbors, Math.random() < chanceOfBranching);
            const target = words[i];

            const key = premiseKey(source, target);
            if (coinFlip()) {
                premiseMap[key] = createSamePremise(source, target);
                bucketMap[target] = bucketMap[source];
            } else {
                premiseMap[key] = createOppositePremise(source, target);
                bucketMap[target] = (bucketMap[source] + 1) % 2;
            }

            neighbors[source] = neighbors?.[source] ?? [];
            neighbors[target] = neighbors?.[target] ?? [];
            neighbors[target].push(source);
            neighbors[source].push(target);
        }

        let premises = orderPremises(premiseMap, neighbors);

        let buckets = [
            Object.keys(bucketMap).filter(w => bucketMap[w] === 0),
            Object.keys(bucketMap).filter(w => bucketMap[w] === 1)
        ]

        if (savedata.enableMeta && !savedata.minimalMode) {
            premises = applyMeta(premises, p => p.match(/<span class="relation">(?:<span class="is-negated">)?(.*?)<\/span>/)[1]);
        }

        premises = scramble(premises);

        this.premises = premises;
        this.buckets = buckets;
        this.neighbors = neighbors;
        this.bucketMap = bucketMap;
    }

    createAnalogy(length) {
        this.generate(length);
        const [a, b, c, d] = pickRandomItems([...this.buckets[0], ...this.buckets[1]], 4).picked;

        const [
            indexOfA,
            indexOfB,
            indexOfC,
            indexOfD
        ] = [
            Number(this.buckets[0].indexOf(a) !== -1),
            Number(this.buckets[0].indexOf(b) !== -1),
            Number(this.buckets[0].indexOf(c) !== -1),
            Number(this.buckets[0].indexOf(d) !== -1)
        ];
        const isValidSame = indexOfA === indexOfB && indexOfC === indexOfD
                   || indexOfA !== indexOfB && indexOfC !== indexOfD;

        let conclusion = analogyTo(a, b);
        let isValid;
        if (coinFlip()) {
            conclusion += pickAnalogyStatementSameTwoOptions();
            isValid = isValidSame;
        } else {
            conclusion += pickAnalogyStatementDifferentTwoOptions();
            isValid = !isValidSame;
        }
        conclusion += analogyTo(c, d);
        const countdown = this.getCountdown();

        return {
            category: "Analogy: Distinction",
            type: "distinction",
            startedAt: new Date().getTime(),
            buckets: this.buckets,
            premises: this.premises,
            isValid,
            conclusion,
            ...(countdown && { countdown }),
        };
    }

    createQuestion(length) {
        this.generate(length);

        let [startWord, endWord] = new DirectionPairChooser().pickTwoDistantWords(this.neighbors);
        if (coinFlip()) {
            this.conclusion = createSamePremise(startWord, endWord);
            this.isValid = this.bucketMap[startWord] === this.bucketMap[endWord];
        } else {
            this.conclusion = createOppositePremise(startWord, endWord);
            this.isValid = this.bucketMap[startWord] !== this.bucketMap[endWord];
        }

        const countdown = this.getCountdown();
        return {
            category: "Distinction",
            type: "distinction",
            startedAt: new Date().getTime(),
            buckets: this.buckets,
            premises: this.premises,
            isValid: this.isValid,
            conclusion: this.conclusion,
            ...(countdown && { countdown }),
        };
    }
    
    getCountdown() {
        return savedata.overrideDistinctionTime;
    }
}

function createSameOpposite(length) {
    return new DistinctionQuestion().createQuestion(length);
}
