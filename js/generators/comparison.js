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
