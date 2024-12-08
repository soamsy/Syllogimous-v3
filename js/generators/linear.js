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
        return pickLinearPremise(a, b, 'less than', 'more than');
    }

    createReverseLinearPremise(a, b) {
        return pickLinearPremise(a, b, 'more than', 'less than')
    }

    getName() {
        return 'Comparison';
    }

    getCountdown(offset=0) {
        return savedata.overrideComparisonTime ? savedata.overrideComparisonTime + offset : null;
    }
}

class BeforeAfter {
    createLinearPremise(a, b) {
        return pickLinearPremise(a, b, 'before', 'after');
    }

    createReverseLinearPremise(a, b) {
        return pickLinearPremise(a, b, 'after', 'before');
    }

    getName() {
        return 'Temporal';
    }

    getCountdown(offset=0) {
        return savedata.overrideTemporalTime ? savedata.overrideTemporalTime + offset : null;
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

        const bucket = createStimuli(length + 1);

        premises = [];
        let next;

        for (let i = 0; i < bucket.length - 1; i++) {
            let curr = bucket[i];
            next = bucket[i + 1];

            if (coinFlip()) {
                premises.push(this.generator.createLinearPremise(curr, next));
            } else {
                premises.push(this.generator.createReverseLinearPremise(next, curr));
            }
        }

        const [i, j] = findTwoWordIndexes(bucket);

        if (coinFlip()) {
            this.conclusion = this.generator.createLinearPremise(bucket[i], bucket[j]);
            this.isValid = i < j;
        } else {
            this.conclusion = this.generator.createReverseLinearPremise(bucket[i], bucket[j]);
            this.isValid = i > j;
        }

        if (savedata.enableMeta) {
            premises = applyMeta(premises, p => p.match(/is (?:<span class="is-negated">)*(.*?)(?:<\/span>)* /)[1]);
        }

        premises = scramble(premises);
        this.premises = premises;
        this.bucket = bucket;
    }

    createAnalogy(length, timeOffset) {
        this.generate(length);
        const [a, b, c, d] = pickRandomItems(this.bucket, 4).picked;

        const [indexOfA, indexOfB] = [this.bucket.indexOf(a), this.bucket.indexOf(b)];
        const [indexOfC, indexOfD] = [this.bucket.indexOf(c), this.bucket.indexOf(d)];
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

        const countdown = this.generator.getCountdown(timeOffset);
        return {
            category: 'Analogy: ' + this.generator.getName(),
            startedAt: new Date().getTime(),
            bucket: this.bucket,
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
            startedAt: new Date().getTime(),
            bucket: this.bucket,
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
