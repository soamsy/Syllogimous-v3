function getSyllogism(s, p, m, rule) {
    const _forms = pickNegatable(forms);
    let major = _forms[rule[0]];
    let minor = _forms[rule[1]];
    let conclusion = _forms[rule[2]];

    let figure = +rule[3];

    if (figure === 1) {
        major = major.replace("$", m);
        major = major.replace("$", p);

        minor = minor.replace("$", s);
        minor = minor.replace("$", m);
    } else if (figure === 2) {
        major = major.replace("$", p);
        major = major.replace("$", m);

        minor = minor.replace("$", s);
        minor = minor.replace("$", m);
    } else if (figure === 3) {
        major = major.replace("$", m);
        major = major.replace("$", p);

        minor = minor.replace("$", m);
        minor = minor.replace("$", s);
    } else if (figure === 4) {
        major = major.replace("$", p);
        major = major.replace("$", m);

        minor = minor.replace("$", m);
        minor = minor.replace("$", s);
    }

    conclusion = conclusion.replace("$", s);
    conclusion = conclusion.replace("$", p);

    return [major, minor, conclusion];
}

function getRandomInvalidRule() {
    let rule;
    while (!rule || validRules.includes(rule)) {
        rule = "";
        for (let i = 0; i < 3; i++) {
            rule += Math.floor(Math.random() * 4); // Form
        }
        rule += 1 + Math.floor(Math.random() * 4); // Figure
    }
    return rule;
}


function isPremiseSimilarToConlusion(premises, conclusion) {
    const subjectsOfPremises = premises.map(p => extractSubjects(p));
    const subjectsOfConclusion = extractSubjects(conclusion);
    for (const subjects of subjectsOfPremises) {
        if (subjects[0]+subjects[1] === subjectsOfConclusion[0]+subjectsOfConclusion[1]
         || subjects[1]+subjects[0] === subjectsOfConclusion[0]+subjectsOfConclusion[1])
            return true;
    }
}

function extractSubjects(phrase) {
    return [...phrase.matchAll(/<span class="subject">(.*?)<\/span>/g)].map(a => a[1]);
}

class SyllogismQuestion {
    constructor() {
    }

    create(length) {
        let bucket;
        let isValid;
        let rule;
        let premises = [];
        let conclusion;
        do {
            bucket = createStimuli(length + 1);
            premises = []

            conclusion;
            isValid = coinFlip();
            let a, b;
            if (isValid) {
                rule = validRules[Math.floor(Math.random() * validRules.length)];
                [a, b, conclusion] = getSyllogism(
                    bucket[0],
                    bucket[1],
                    bucket[2],
                    rule
                );
            } else {
                rule = getRandomInvalidRule();
                [a, b, conclusion] = getSyllogism(
                    bucket[0],
                    bucket[1],
                    bucket[2],
                    getRandomInvalidRule()
                );
            }
            premises.push(a);
            premises.push(b);
        } while(isPremiseSimilarToConlusion(premises, conclusion));

        for (let i = 3; i < bucket.length; i++) {
            let rnd = Math.floor(Math.random() * (i - 1));
            let flip = coinFlip();
            let p = flip ? bucket[i] : bucket[rnd];
            let m = flip ? bucket[rnd] : bucket[i];
            premises.push(getSyllogism("#####", p, m, getRandomInvalidRule())[0]);
        }

        premises = scramble(premises);

        const countdown = this.getCountdown();
        return {
            category: 'Syllogism',
            type: "syllogism",
            startedAt: new Date().getTime(),
            rule,
            bucket,
            isValid,
            premises,
            conclusion,
            ...(countdown && { countdown }),
        };
    }

    getCountdown() {
        return savedata.overrideSyllogismTime;
    }
}

function createSyllogismGenerator(length) {
    return {
        question: new SyllogismQuestion(),
        premiseCount: getPremisesFor('overrideSyllogismPremises', length),
        weight: savedata.overrideSyllogismWeight,
    };
}
