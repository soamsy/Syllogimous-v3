function createSameOpposite(length) {
    length++;
    
    const words = createStimuli(length);

    const category = "Distinction";
    let buckets;
    let isValid;
    let premises;
    let conclusion;
    do {
        let first = words[0];
        let prev = first;
        let curr;

        buckets = [[prev], []];
        let prevBucket = 0;

        premises = [];

        for (let i = 1; i < words.length; i++) {
            curr = words[i];

            if (coinFlip()) {
                const ps = [
                    `<span class="subject">${prev}</span> is same as <span class="subject">${curr}</span>`,
                    `<span class="subject">${prev}</span> is <span class="is-negated">opposite of</span> <span class="subject">${curr}</span>`,
                ];
                premises.push((!savedata.enableNegation)
                    ? ps[0]
                    : pickRandomItems(ps, 1).picked[0]);
                buckets[prevBucket].push(curr);
            } else {
                const ps = [
                    `<span class="subject">${prev}</span> is opposite of <span class="subject">${curr}</span>`,
                    `<span class="subject">${prev}</span> is <span class="is-negated">same as</span> <span class="subject">${curr}</span>`,
                ];
                premises.push((!savedata.enableNegation)
                    ? ps[0]
                    : pickRandomItems(ps, 1).picked[0]);
                prevBucket = (prevBucket + 1) % 2;
                buckets[prevBucket].push(curr);
            }

            prev = curr;
        }

        if (savedata.enableMeta) {

            // Randomly choose a number of meta-relations
            const numOfMetaRelations = 1 + Math.floor(Math.random() * Math.floor((length - 1) / 2));
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
        }

        if (coinFlip()) {
            const cs = [
                `<span class="subject">${first}</span> is same as <span class="subject">${curr}</span>`,
                `<span class="subject">${first}</span> is <span class="is-negated">opposite of</span> <span class="subject">${curr}</span>`,
            ];
            conclusion = (!savedata.enableNegation)
                ? cs[0]
                : pickRandomItems(cs, 1).picked[0];
            isValid = buckets[0].includes(curr);
        } else {
            const cs = [
                `<span class="subject">${first}</span> is opposite of <span class="subject">${curr}</span>`,
                `<span class="subject">${first}</span> is <span class="is-negated">same as</span> <span class="subject">${curr}</span>`,
            ];
            conclusion = (!savedata.enableNegation)
                ? cs[0]
                : pickRandomItems(cs, 1).picked[0];
            isValid = buckets[1].includes(curr);
        }
    } while(isPremiseSimilarToConlusion(premises, conclusion));

    shuffle(premises);

    return {
        category,
        startedAt: new Date().getTime(),
        buckets,
        isValid,
        premises,
        conclusion
    };
}
