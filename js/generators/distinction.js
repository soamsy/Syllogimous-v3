function createSamePremise(a, b) {
    return {
        start: a,
        end: b,
        relation: 'is same as',
        reverse: 'is opposite of',
        relationMinimal: '=',
        reverseMinimal: '☍',
    }
}

function createOppositePremise(a, b) {
    return {
        start: a,
        end: b,
        relation: 'is opposite of',
        reverse: 'is same as',
        relationMinimal: '☍',
        reverseMinimal: '=',
    }
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
        if (savedata.widePremises) {
            premises = createWidePremises(premises, premiseMap);
        }

        let buckets = [
            Object.keys(bucketMap).filter(w => bucketMap[w] === 0),
            Object.keys(bucketMap).filter(w => bucketMap[w] === 1)
        ]

        if (savedata.enableMeta && !savedata.minimalMode && !savedata.widePremises) {
            premises = applyMeta(premises, p => p.match(/<span class="relation">(?:<span class="is-negated">)?(.*?)<\/span>/)[1]);
        }

        premises = scramble(premises);
        premises = premises.map(p => createPremiseHTML(p, false));

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
            ...(savedata.widePremises && { plen: length }),
            isValid,
            conclusion,
            ...(countdown && { countdown }),
        };
    }

    create(length) {
        this.generate(length);

        let [startWord, endWord] = new DirectionPairChooser().pickTwoDistantWords(this.neighbors);
        if (coinFlip()) {
            this.conclusion = createBasicPremiseHTML(createSamePremise(startWord, endWord), false);
            this.isValid = this.bucketMap[startWord] === this.bucketMap[endWord];
        } else {
            this.conclusion = createBasicPremiseHTML(createOppositePremise(startWord, endWord), false);
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
            ...(savedata.widePremises && { plen: length }),
            ...(countdown && { countdown }),
        };
    }
    
    getCountdown() {
        return savedata.overrideDistinctionTime;
    }
}

function createDistinctionGenerator(length) {
    return {
        question: new DistinctionQuestion(),
        premiseCount: getPremisesFor('overrideDistinctionPremises', length),
        weight: savedata.overrideDistinctionWeight,
    };
}
