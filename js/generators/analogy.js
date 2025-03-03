function pickAnalogyStatementSameTwoOptions() {
    return pickNegatable([
        '<div class="analogy-statement">is the same as</div>',
        '<div class="analogy-statement" style="color: red;">is different from</div>'
    ]);
}

function pickAnalogyStatementDifferentTwoOptions() {
    return pickNegatable([
        '<div class="analogy-statement">is different from</div>',
        '<div class="analogy-statement" style="color: red;">is the same as</div>'
    ]);
}

function pickAnalogyStatementSame() {
    return pickNegatable([
        '<div class="analogy-statement">has the same relation as</div>',
        '<div class="analogy-statement" style="color: red">has a different relation from</div>',
    ]);
}

function pickAnalogyStatementDifferent() {
    return pickNegatable([
        '<div class="analogy-statement">has a different relation from</div>',
        '<div class="analogy-statement" style="color: red">has the same relation as</div>',
    ]);
}

function analogyTo(a, b) {
    return `<span class="subject">${a}</span> to <span class="subject">${b}</span>`;
}

class AnalogyQuestion {
     create(length) {
        const timeOffset = savedata.offsetAnalogyTime;
        const premiseOffset = getPremisesFor('offsetAnalogyPremises', 0);
        const choiceIndices = [];

        let generators = [];
        if (savedata.enableDistinction)
            generators.push(createDistinctionGenerator(length));
        if (savedata.enableLinear)
            generators.push(...createLinearGenerators(length));
        if (savedata.enableDirection)
            generators.push(createDirectionGenerator(length));
        if (savedata.enableDirection3D)
            generators.push(createDirection3DGenerator(length));
        if (savedata.enableDirection4D)
            generators.push(createDirection4DGenerator(length));
        if (savedata.enableAnchorSpace)
            generators.push(createAnchorSpaceGenerator(length));

        const totalWeight = generators.reduce((sum, item) => sum + item.weight, 0);
        const randomValue = Math.random() * totalWeight;
        let cumulativeWeight = 0;
        let g;
        for (let generator of generators) {
            cumulativeWeight += generator.weight;
            if (randomValue < cumulativeWeight) {
                g = generator;
                break;
            }
        }

        let question = g.question.createAnalogy(Math.max(g.premiseCount + premiseOffset, 3));
        question.plen = g.premiseCount;
        question.tlen = question.countdown || savedata.timer;
        question.tags = ['analogy'];
        if (question.countdown) {
            question.countdown += timeOffset;
        } else {
            question.timeOffset = timeOffset;
        }

        return question;
    }
}

function createAnalogyGenerator(length) {
    return {
        question: new AnalogyQuestion(),
        premiseCount: length,
        weight: 100,
    };
}
