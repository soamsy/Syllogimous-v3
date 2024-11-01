function createQuota() {
    let quota = Infinity;

    if (savedata.useNonsenseWords) {
        if (savedata.nonsenseWordLength % 2) quota = Math.min(quota, ((21 ** (Math.floor(savedata.nonsenseWordLength / 2) + 1)) * (5 ** Math.floor(savedata.nonsenseWordLength / 2))));
        else quota = Math.min(quota, (21 ** (savedata.nonsenseWordLength / 2)) * (5 ** (savedata.nonsenseWordLength / 2)));
    }
    if (savedata.useMeaningfulWords) {
        if (savedata.meaningfulWordNouns) quota = Math.min(quota, meaningfulWords.nouns.length);
        if (savedata.meaningfulWordAdjectives) quota = Math.min(quota, meaningfulWords.adjectives.length);
    }   
    if (savedata.useEmoji) quota = Math.min(quota, emoji.length);
    
    return quota;
}

function createStimuli(numberOfStimuli) {
    const quota = createQuota();
    
    const uniqueWords = {
        meaningful: {
            nouns: new Set(),
            adjectives: new Set()
        },
        nonsense: new Set()
    }
    const uniqueEmoji = new Set();

    const stimulusTypes = new Set();
    
    if (savedata.useNonsenseWords) stimulusTypes.add('nonsenseWords');
    if (savedata.useMeaningfulWords) stimulusTypes.add('meaningfulWords');
    if (savedata.useEmoji) stimulusTypes.add('emoji');
    if (!stimulusTypes.size) stimulusTypes.add(savedata.defaultStimulusType);

    const stimuliCreated = [];

    const partsOfSpeech = new Set();
    
    if (savedata.meaningfulWordNouns) partsOfSpeech.add('nouns');
    if (savedata.meaningfulWordAdjectives) partsOfSpeech.add('adjectives');
    if (!partsOfSpeech.size) partsOfSpeech.add(savedata.defaultPartOfSpeech);

    for (; numberOfStimuli > 0 && stimulusTypes.size; numberOfStimuli -= 1) {
        const randomStimulusType = Array.from(stimulusTypes)[Math.floor(Math.random() * stimulusTypes.size)];

        if (randomStimulusType == 'nonsenseWords') {      
            const vowels = ['A', 'E', 'I', 'O', 'U'], consonants = ['B', 'C', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'N', 'P', 'Q', 'R', 'S', 'T', 'V', 'W', 'X', 'Y', 'Z'];
            
            for (string = ''; string.length < savedata.nonsenseWordLength;) {
                if ((string.length + 1) % 2) string += consonants[Math.floor(Math.random() * 21)];
                else string += vowels[Math.floor(Math.random() * 5)];
        
                if (string.length == savedata.nonsenseWordLength) {
                    if (uniqueWords.nonsense.has(string)) string = '';
                    else {
                        stimuliCreated.push(string);
                        uniqueWords.nonsense.add(string);
                    }
                }
            }

            if (uniqueWords.nonsense.size >= quota) stimulusTypes.delete(randomStimulusType);     
        } else if (randomStimulusType == 'meaningfulWords') {
            const randomPartOfSpeech = Array.from(partsOfSpeech)[Math.floor(Math.random() * partsOfSpeech.size)]

            if (randomPartOfSpeech) {
                let randomMeaningfulWord;

                do {
                    if (uniqueWords.meaningful[randomPartOfSpeech].size >= meaningfulWords[randomPartOfSpeech].length) uniqueWords.meaningful[randomPartOfSpeech].nouns = new Set();
    
                    randomMeaningfulWord = meaningfulWords[randomPartOfSpeech][Math.floor(Math.random() * meaningfulWords[randomPartOfSpeech].length)];         
                } while (uniqueWords.meaningful[randomPartOfSpeech].has(randomMeaningfulWord));
    
                stimuliCreated.push(randomMeaningfulWord);
                uniqueWords.meaningful[randomPartOfSpeech].add(randomMeaningfulWord);
            } else stimulusTypes.delete(randomStimulusType);

            if (uniqueWords.meaningful[randomPartOfSpeech].size >= quota) partsOfSpeech.delete(randomPartOfSpeech);
        } else if (randomStimulusType == 'emoji') {
            let randomEmoji;

            do {
                if (uniqueEmoji.size >= emoji.length) uniqueEmoji = new Set();
                
                randomEmoji = emoji[Math.floor(Math.random() * emoji.length)];           
            } while (uniqueEmoji.has(randomEmoji));
            
            stimuliCreated.push(randomEmoji);
            uniqueEmoji.add(randomEmoji);
            
            if (uniqueEmoji.size >= quota) stimulusTypes.delete(randomStimulusType);
        } else break;
    }

    return stimuliCreated
}

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

function createMoreLess(length) {
    length++;

    const category = "Comparison";
    let bucket;
    let isValid;
    let premises;
    let conclusion;
    do {
        bucket = createStimuli(length)

        let sign = [-1, 1][Math.floor(Math.random() * 2)];

        premises = [];
        let next;

        for (let i = 0; i < bucket.length - 1; i++) {
            let curr = bucket[i];
            next = bucket[i + 1];

            if (coinFlip()) {
                if (sign === 1) {
                    const ps = [
                        `<span class="subject">${next}</span> is more than <span class="subject">${curr}</span>`,
                        `<span class="subject">${next}</span> is <span class="is-negated">less</span> than <span class="subject">${curr}</span>`,
                    ];
                    premises.push((!savedata.enableNegation)
                        ? ps[0]
                        : pickRandomItems(ps, 1).picked[0]);
                } else {
                    const ps = [
                        `<span class="subject">${curr}</span> is more than <span class="subject">${next}</span>`,
                        `<span class="subject">${curr}</span> is <span class="is-negated">less</span> than <span class="subject">${next}</span>`,
                    ];
                    premises.push((!savedata.enableNegation)
                        ? ps[0]
                        : pickRandomItems(ps, 1).picked[0]);
                }
            } else {
                if (sign === 1) {
                    const ps = [
                        `<span class="subject">${curr}</span> is less than <span class="subject">${next}</span>`,
                        `<span class="subject">${curr}</span> is <span class="is-negated">more</span> than <span class="subject">${next}</span>`,
                    ];
                    premises.push((!savedata.enableNegation)
                        ? ps[0]
                        : pickRandomItems(ps, 1).picked[0]);
                } else {
                    const ps = [
                        `<span class="subject">${next}</span> is less than <span class="subject">${curr}</span>`,
                        `<span class="subject">${next}</span> is <span class="is-negated">more</span> than <span class="subject">${curr}</span>`,
                    ];
                    premises.push((!savedata.enableNegation)
                        ? ps[0]
                        : pickRandomItems(ps, 1).picked[0]);
                }
            }
        }

        let a = Math.floor(Math.random() * bucket.length);
        let b = Math.floor(Math.random() * bucket.length);
        while (a === b) {
            b = Math.floor(Math.random() * bucket.length);
        }
        if (coinFlip()) {
            const cs = [
                `<span class="subject">${bucket[a]}</span> is less than <span class="subject">${bucket[b]}</span>`,
                `<span class="subject">${bucket[a]}</span> is <span class="is-negated">more</span> than <span class="subject">${bucket[b]}</span>`,
            ];
            conclusion = (!savedata.enableNegation)
                ? cs[0]
                : pickRandomItems(cs, 1).picked[0];
            isValid = sign === 1 && a < b || sign === -1 && a > b;
        } else {
            const cs = [
                `<span class="subject">${bucket[a]}</span> is more than <span class="subject">${bucket[b]}</span>`,
                `<span class="subject">${bucket[a]}</span> is <span class="is-negated">less</span> than <span class="subject">${bucket[b]}</span>`,
            ];
            conclusion = (!savedata.enableNegation)
                ? cs[0]
                : pickRandomItems(cs, 1).picked[0];
            isValid = sign === 1 && a > b || sign === -1 && a < b;
        }
    } while(isPremiseSimilarToConlusion(premises, conclusion));

    shuffle(premises);

    return {
        category,
        startedAt: new Date().getTime(),
        bucket,
        isValid,
        premises,
        conclusion
    }
}

function createBeforeAfter(length) {
    length++;

    const category = "Temporal";
    let bucket;
    let isValid;
    let premises;
    let conclusion;
    do {
        bucket = createStimuli(length);

        let sign = [-1, 1][Math.floor(Math.random() * 2)];

        premises = [];
        let next;

        for (let i = 0; i < bucket.length - 1; i++) {
            let curr = bucket[i];
            next = bucket[i + 1];
            if (coinFlip()) {
                if (sign === 1) {
                    const ps = [
                        `<span class="subject">${next}</span> is after <span class="subject">${curr}</span>`,
                        `<span class="subject">${next}</span> is <span class="is-negated">before</span> <span class="subject">${curr}</span>`,
                    ];
                    premises.push((!savedata.enableNegation)
                        ? ps[0]
                        : pickRandomItems(ps, 1).picked[0]);
                } else {
                    const ps = [
                        `<span class="subject">${curr}</span> is after <span class="subject">${next}</span>`,
                        `<span class="subject">${curr}</span> is <span class="is-negated">before</span> <span class="subject">${next}</span>`,
                    ];
                    premises.push((!savedata.enableNegation)
                        ? ps[0]
                        : pickRandomItems(ps, 1).picked[0]);
                }
            } else {
                if (sign === 1) {
                    const ps = [
                        `<span class="subject">${curr}</span> is before <span class="subject">${next}</span>`,
                        `<span class="subject">${curr}</span> is <span class="is-negated">after</span> <span class="subject">${next}</span>`,
                    ];
                    premises.push((!savedata.enableNegation)
                        ? ps[0]
                        : pickRandomItems(ps, 1).picked[0]);
                } else {
                    const ps = [
                        `<span class="subject">${next}</span> is before <span class="subject">${curr}</span>`,
                        `<span class="subject">${next}</span> is <span class="is-negated">after</span> <span class="subject">${curr}</span>`,
                    ];
                    premises.push((!savedata.enableNegation)
                        ? ps[0]
                        : pickRandomItems(ps, 1).picked[0]);
                }
            }
        }

        let a = Math.floor(Math.random() * bucket.length);
        let b = Math.floor(Math.random() * bucket.length);
        while (a === b) {
            b = Math.floor(Math.random() * bucket.length);
        }
        if (coinFlip()) {
            const cs = [
                `<span class="subject">${bucket[a]}</span> is before <span class="subject">${bucket[b]}</span>`,
                `<span class="subject">${bucket[a]}</span> is <span class="is-negated">after</span> <span class="subject">${bucket[b]}</span>`,
            ];
            conclusion = (!savedata.enableNegation)
                ? cs[0]
                : pickRandomItems(cs, 1).picked[0];
            isValid = sign === 1 && a < b || sign === -1 && a > b;
        } else {
            const cs = [
                `<span class="subject">${bucket[a]}</span> is after <span class="subject">${bucket[b]}</span>`,
                `<span class="subject">${bucket[a]}</span> is <span class="is-negated">before</span> <span class="subject">${bucket[b]}</span>`,
            ];
            conclusion = (!savedata.enableNegation)
                ? cs[0]
                : pickRandomItems(cs, 1).picked[0];
            isValid = sign === 1 && a > b || sign === -1 && a < b;
        }
    } while(isPremiseSimilarToConlusion(premises, conclusion));

    shuffle(premises);

    return {
        category,
        startedAt: new Date().getTime(),
        bucket,
        isValid,
        premises,
        conclusion
    }
}

function createBinaryQuestion(length) {
    const operands = [
        "a&&b",                 // and
        "!(a&&b)",              // nand
        "a||b",                 // or
        "!(a||b)",              // nor
        "!(a&&b)&&(a||b)",      // xor
        "!(!(a&&b)&&(a||b))"    // xnor
    ];

    const operandNames = [
        "AND",
        "NAND",
        "OR",
        "NOR",
        "XOR",
        "XNOR"
    ];

    const operandTemplates = [
        '$a <div class="is-connector">and</div> $b',
        '<div class="is-connector"></div> $a <div class="is-connector">and</div> $b <div class="is-connector">are true</div>',
        '$a <div class="is-connector">or</div> $b',
        '<div class="is-connector">Neither</div> $a <div class="is-connector">nor</div> $b',
        '<div class="is-connector">Either</div> $a <div class="is-connector">or</div> $b',
        '<div class="is-connector">Both</div> $a <div class="is-connector">and</div> $b <div class="is-connector">are the same</div>'
    ];

    const pool = [];

    if (savedata.enableDistinction)
        pool.push(createSameOpposite);
    if (savedata.enableComparison)
        pool.push(createMoreLess);
    if (savedata.enableTemporal)
        pool.push(createBeforeAfter);
    if (savedata.enableDirection)
        pool.push(createDirectionQuestion);
    if (savedata.enableDirection3D)
        pool.push(createDirectionQuestion3D);
    if (savedata.enableDirection4D)
        pool.push(createDirectionQuestion4D);
    if (savedata.enableSyllogism)
        pool.push(createSyllogism);

    let choice;
    let choice2;
    let premises;
    let conclusion = "";
    const flip = coinFlip();
    let isValid;
    const operandIndex = Math.floor(Math.random()*operands.length);
    const operand = operands[operandIndex];
    while (flip !== isValid) {
        let [generator, generator2] = pickRandomItems(pool, 2).picked;

        [choice, choice2] = [
            generator(Math.floor(length/2)),
            generator2(Math.ceil(length/2))
        ];
    
        premises = [...choice.premises, ...choice2.premises];
        shuffle(premises);
    
        conclusion = operandTemplates[operandIndex]
            .replace("$a", choice.conclusion)
            .replace("$b", choice2.conclusion);

        isValid = eval(
            operand
                .replaceAll("a", choice.isValid)
                .replaceAll("b", choice2.isValid)
        );
    }

    return {
        category: `Binary: ${choice.category} ${operandNames[operandIndex]} ${choice2.category}`,
        startedAt: new Date().getTime(),
        isValid,
        premises,
        conclusion
    };
}

function createNestedBinaryQuestion(length) {
    const humanOperands = [
        '<span class="is-connector">(</span>à<span class="is-connector">)</span> <span class="is-connector">AND</span> <span class="is-connector">(</span>ò<span class="is-connector">)</span>',
        '<span class="is-connector">(</span>à<span class="is-connector">)</span> <span class="is-connector">NAND</span> <span class="is-connector">(</span>ò<span class="is-connector">)</span>',
        '<span class="is-connector">(</span>à<span class="is-connector">)</span> <span class="is-connector">OR</span> <span class="is-connector">(</span>ò<span class="is-connector">)</span>',
        '<span class="is-connector">(</span>à<span class="is-connector">)</span> <span class="is-connector">NOR</span> <span class="is-connector">(</span>ò<span class="is-connector">)</span>',
        '<span class="is-connector">(</span>à<span class="is-connector">)</span> <span class="is-connector">XOR</span> <span class="is-connector">(</span>ò<span class="is-connector">)</span>',
        '<span class="is-connector">(</span>à<span class="is-connector">)</span> <span class="is-connector">XNOR</span> <span class="is-connector">(</span>ò<span class="is-connector">)</span>'
    ];

    const evalOperands =[
        "(a)&&(b)",
        "!((a)&&(b))",
        "(a)||(b)",
        "!((a)||(b))",
        "!((a)&&(b))&&((a)||(b))",
        "!(!((a)&&(b))&&((a)||(b)))"
    ];

    const pool = [];

    if (savedata.enableDistinction)
        pool.push(createSameOpposite);
    if (savedata.enableComparison)
        pool.push(createMoreLess);
    if (savedata.enableTemporal)
        pool.push(createBeforeAfter);
    if (savedata.enableDirection)
        pool.push(createDirectionQuestion);
    if (savedata.enableDirection3D)
        pool.push(createDirectionQuestion3D);
    if (savedata.enableDirection4D)
        pool.push(createDirectionQuestion4D);
    if (savedata.enableSyllogism)
        pool.push(createSyllogism);

    const halfLength = Math.floor(length / 2);
    const questions = Array(halfLength).fill(0)
        .map(() => pool[Math.floor(Math.random() * pool.length)](2));

    let maxDepth = +savedata.maxNestedBinaryDepth;
    let i = 0;
    function generator(depth) {
        const flip = Math.random() < 0.5;
        const flip2 = Math.random() < 0.5;
        const rndIndex = Math.floor(Math.random() * humanOperands.length);
        const humanOperand = humanOperands[rndIndex];
        const evalOperand = evalOperands[rndIndex];
        const val = (flip && maxDepth--> 0)
            ? generator(++depth)
            : (i++) % halfLength;
        const val2 = (flip2 && maxDepth--> 0)
            ? generator(++depth)
            : (i++) % halfLength;
        return {
            human: humanOperand
                .replace('à', val > - 1 ? val : val.human)
                .replace('ò', val2 > - 1 ? val2 : val2.human),
            eval: evalOperand
                .replaceAll('a', val > - 1 ? val : val.eval)
                .replaceAll('b', val2 > - 1 ? val2 : val2.eval),
        };
    }

    const generated = generator();

    const category = Object.keys(
        questions
            .map(q => q.category)
            .reduce((a, c) => (a[c] = 1, a), {})
    )
    .join('/');
    const isValid = eval(generated.eval.replaceAll(/(\d+)/g, m => questions[m].isValid));
    const premises = questions.reduce((a, q) => [ ...a, ...q.premises ], [])
    const conclusion = generated.human.replaceAll(/(\d+)/g, m => questions[m].conclusion);

    return {
        category: `Nested Binary: ${category}`,
        startedAt: new Date().getTime(),
        isValid,
        premises,
        conclusion
    };
}

function createSameDifferent(length) {

    // Create a pool based on user preferences
    const choiceIndices = [];

    if (savedata.enableDistinction)
        choiceIndices.push(0);
    if (savedata.enableComparison)
        choiceIndices.push(1);
    if (savedata.enableTemporal)
        choiceIndices.push(2);
    if (savedata.enableDirection)
        choiceIndices.push(3);
    if (savedata.enableDirection3D)
        choiceIndices.push(4);
    if (savedata.enableDirection4D)
        choiceIndices.push(5);

    const choiceIndex = pickRandomItems(choiceIndices, 1).picked[0];
    let choice;
    let conclusion = "";
    let subtype;
    let isValid, isValidSame;
    let a, b, c, d;
    let indexOfA, indexOfB, indexOfC, indexOfD;

    if (choiceIndex === 0) {

        choice = createSameOpposite(length);
        subtype = "Same/Opposite";

        // Pick 4 different items
        [a, b, c, d] = pickRandomItems([...choice.buckets[0], ...choice.buckets[1]], 4).picked;
        conclusion += `<span class="subject">${a}</span> to <span class="subject">${b}</span>`;

        // Find in which side a, b, c and d are
        [
            indexOfA,
            indexOfB,
            indexOfC,
            indexOfD
        ] = [
            Number(choice.buckets[0].indexOf(a) !== -1),
            Number(choice.buckets[0].indexOf(b) !== -1),
            Number(choice.buckets[0].indexOf(c) !== -1),
            Number(choice.buckets[0].indexOf(d) !== -1)
        ];
        isValidSame = indexOfA === indexOfB && indexOfC === indexOfD
                   || indexOfA !== indexOfB && indexOfC !== indexOfD;
    }
    else if (choiceIndex === 1) {

        choice = createMoreLess(length);
        subtype = "More/Less";

        // Pick 4 different items
        [a, b, c, d] = pickRandomItems(choice.bucket, 4).picked;
        conclusion += `<span class="subject">${a}</span> to <span class="subject">${b}</span>`;

        // Find indices of elements
        [indexOfA, indexOfB] = [choice.bucket.indexOf(a), choice.bucket.indexOf(b)];
        [indexOfC, indexOfD] = [choice.bucket.indexOf(c), choice.bucket.indexOf(d)];
        isValidSame = indexOfA > indexOfB && indexOfC > indexOfD
                   || indexOfA < indexOfB && indexOfC < indexOfD;
    }
    else if (choiceIndex === 2) {

        choice = createBeforeAfter(length);
        subtype = "Before/After";

        // Pick 4 different items
        [a, b, c, d] = pickRandomItems(choice.bucket, 4).picked;
        conclusion += `<span class="subject">${a}</span> to <span class="subject">${b}</span>`;

        // Find indices of elements
        [indexOfA, indexOfB] = [choice.bucket.indexOf(a), choice.bucket.indexOf(b)];
        [indexOfC, indexOfD] = [choice.bucket.indexOf(c), choice.bucket.indexOf(d)];
        isValidSame = indexOfA > indexOfB && indexOfC > indexOfD
                   || indexOfA < indexOfB && indexOfC < indexOfD;
    }
    else if (choiceIndex === 3) {

        subtype = "Direction";

        const flip = coinFlip();
        while (flip !== isValidSame) {
            conclusion = "";
            choice = createDirectionQuestion(length);

            // Pick 4 different items
            [a, b, c, d] = pickRandomItems(Object.keys(choice.wordCoordMap), 4).picked;
            conclusion += `<span class="subject">${a}</span> to <span class="subject">${b}</span>`;

            // Find if A to B has same relation of C to D
            isValidSame = findDirection(choice.wordCoordMap[a], choice.wordCoordMap[b]) === findDirection(choice.wordCoordMap[c], choice.wordCoordMap[d]);
        }
    } else if (choiceIndex === 4) {

        subtype = "Direction Three D";

        const flip = coinFlip();
        while (flip !== isValidSame) {
            conclusion = "";
            choice = createDirectionQuestion3D(length);

            // Pick 4 different items
            [a, b, c, d] = pickRandomItems(Object.keys(choice.wordCoordMap), 4).picked;
            conclusion += `<span class="subject">${a}</span> to <span class="subject">${b}</span>`;

            // Find if A to B has same relation of C to D
            isValidSame = findDirection3D(choice.wordCoordMap[a], choice.wordCoordMap[b]) === findDirection3D(choice.wordCoordMap[c], choice.wordCoordMap[d]);
        }
    } else {

        subtype = "Space Time";

        const flip = coinFlip();
        while (flip !== isValidSame) {
            conclusion = "";
            choice = createDirectionQuestion4D(length);

            // Pick 4 different items
            [a, b, c, d] = pickRandomItems(Object.keys(choice.wordCoordMap), 4).picked;
            conclusion += `<span class="subject">${a}</span> to <span class="subject">${b}</span>`;

            // Find if A to B has same relation of C to D
            const {
                spatial,
                temporal
            } = findDirection4D(choice.wordCoordMap[a], choice.wordCoordMap[b]);
            const {
                spatial: spatial2,
                temporal: temporal2
            } = findDirection4D(choice.wordCoordMap[c], choice.wordCoordMap[d]);
            isValidSame = spatial === spatial2 && temporal === temporal2;
        }
    }

    if (coinFlip()) {
        isValid = isValidSame;
        if (choiceIndex < 1) {
            const cs = [
                '<div style="margin: 2px 0;">is the same as</div>',
                '<div style="color: red; margin: 2px 0;">is the same as</div>'
            ];
            conclusion += (!savedata.enableNegation)
                ? cs[0]
                : pickRandomItems(cs, 1).picked[0];
        }
        else {
            const cs = [
                '<div style="font-size: 14px; margin: 2px 0;">has the same relation as</div>',
                '<div style="color: red; font-size: 14px; margin: 2px 0;">has the same relation as</div>'
            ];
            conclusion += (!savedata.enableNegation)
                ? cs[0]
                : pickRandomItems(cs, 1).picked[0];
        }
    }
    else {
        isValid = !isValidSame;
        if (choiceIndex < 1) {
            const cs = [
                '<div style="margin: 2px 0;">is different from</div>',
                '<div style="color: red; margin: 2px 0;">is different from</div>'
            ];
            conclusion += (!savedata.enableNegation)
                ? cs[0]
                : pickRandomItems(cs, 1).picked[0];

        }
        else {
            const cs = [
                '<div style="font-size: 12px; margin: 4px 0;">has a different relation from</div>',
                '<div style="color: red; font-size: 12px; margin: 4px 0;">has a different relation from</div>',
            ];
            conclusion += (!savedata.enableNegation)
                ? cs[0]
                : pickRandomItems(cs, 1).picked[0];
        }
    }
    conclusion += `<span class="subject">${c}</span> to <span class="subject">${d}</span>`;

    choice.category = "Analogy: " + subtype;
    choice.startedAt = new Date().getTime();
    choice.isValid = isValid;
    choice.conclusion = conclusion;

    return choice;
}
