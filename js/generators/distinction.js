function pickDistinctionPremise(a, b, comparison, reverseComparison) {
    const ps = [
    `<span class="subject">${a}</span> is ${comparison} <span class="subject">${b}</span>`,
    `<span class="subject">${a}</span> is <span class="is-negated">${reverseComparison}</span> <span class="subject">${b}</span>`,
    ];
    return savedata.enableNegation ? pickRandomItems(ps, 1).picked[0] : ps[0];
}

function createSamePremise(a, b) {
    return pickDistinctionPremise(a, b, 'same as', 'opposite of');
}

function createOppositePremise(a, b) {
    return pickDistinctionPremise(a, b, 'opposite of', 'same as');
}

function applyMeta(premises) {
    // Randomly choose a number of meta-relations
    const numOfMetaRelations = 1 + Math.floor(Math.random() * Math.floor(premises.length / 2));
    let _premises = pickRandomItems(premises, numOfMetaRelations * 2);
    premises = [ ..._premises.remaining ];

    while (_premises.picked.length) {

        const choosenPair = pickRandomItems(_premises.picked, 2);
        const negations = choosenPair.picked.map(p => /is-negated/.test(p));
        const relations = choosenPair.picked.map(p =>
            p.match(/is (?:<span class="is-negated">)?(.*) (?:as|of)/)[1]
        );

        // Generate substitution string
        let substitution;
        const [a, b] = [
                ...choosenPair.picked[0]
                .matchAll(/<span class="subject">(.*?)<\/span>/g)
            ]
            .map(m => m[1]);
        if (!negations[0] && !negations[1] && relations[0] === relations[1]) {
            substitution = `$1 same as <span class="is-meta">(<span class="subject">${a}</span> to <span class="subject">${b}</span>)</span> to`;
        } // Tested
        if (!negations[0] && negations[1] && relations[0] === relations[1]) {
            substitution = `$1 opposite of <span class="is-meta">(<span class="subject">${a}</span> to <span class="subject">${b}</span>)</span> to`;
        } // Tested
        if (negations[0] && !negations[1] && relations[0] === relations[1]) {
            substitution = `$1 <span class="is-negated">same as</span> <span class="is-meta">(<span class="subject">${a}</span> to <span class="subject">${b}</span>)</span> to`;
        } // Tested
        if (negations[0] && negations[1] && relations[0] === relations[1]) {
            substitution = `$1 <span class="is-negated">opposite of</span> <span class="is-meta">(<span class="subject">${a}</span> to <span class="subject">${b}</span>)</span> to`;
        } // Tested

        if (!negations[0] && !negations[1] && relations[0] !== relations[1]) {
            substitution = `$1 <span class="is-negated">same as</span> <span class="is-meta">(<span class="subject">${a}</span> to <span class="subject">${b}</span>)</span> to`;
        } // Tested
        if (!negations[0] && negations[1] && relations[0] !== relations[1]) {
            substitution = `$1 <span class="is-negated">opposite of</span> <span class="is-meta">(<span class="subject">${a}</span> to <span class="subject">${b}</span>)</span> to`;
        } // Tested
        if (negations[0] && !negations[1] && relations[0] !== relations[1]) {
            substitution = `$1 same as <span class="is-meta">(<span class="subject">${a}</span> to <span class="subject">${b}</span>)</span> to`;
        } // Tested
        if (negations[0] && negations[1] && relations[0] !== relations[1]) {
            substitution = `$1 opposite of <span class="is-meta">(<span class="subject">${a}</span> to <span class="subject">${b}</span>)</span> to`;
        } // Tested

        // Replace relation with meta-relation via substitution string
        const metaPremise = choosenPair.picked[1]
            .replace(/(is) (.*) (as|of)/, substitution);

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

        let premises = [];

        let first = words[0];
        let prev = first;
        let curr;

        let buckets = [[prev], []];
        let prevBucket = 0;

        for (let i = 1; i < words.length; i++) {
            curr = words[i];

            if (coinFlip()) {
                premises.push(createSamePremise(prev, curr));
                buckets[prevBucket].push(curr);
            } else {
                premises.push(createOppositePremise(prev, curr));
                prevBucket = (prevBucket + 1) % 2;
                buckets[prevBucket].push(curr);
            }

            prev = curr;
        }

        if (savedata.enableMeta) {
            premises = applyMeta(premises);
        }

        if (coinFlip()) {
            this.conclusion = createSamePremise(first, curr);
            this.isValid = buckets[0].includes(curr);
        } else {
            this.conclusion = createOppositePremise(first, curr);
            this.isValid = buckets[1].includes(curr);
        }

        shuffle(premises);

        this.premises = premises;
        this.buckets = buckets;
        const category = "Distinction";
    }

    createQuestion(length) {
        this.generate(length);
        return {
            category: "Distinction",
            startedAt: new Date().getTime(),
            buckets: this.buckets,
            isValid: this.isValid,
            premises: this.premises,
            conclusion: this.conclusion,
        };
    }
    
}

function createSameOpposite(length) {
    return new DistinctionQuestion().createQuestion(length);
}
