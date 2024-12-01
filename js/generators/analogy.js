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

function createSameDifferent(length) {
    const timeOffset = savedata.offsetAnalogyTime;
    let question = createAnalogyQuestion(length, timeOffset);
    if (!question.countdown) {
        question.timeOffset = timeOffset;
    }
    return question;
}

function createAnalogyQuestion(length, timeOffset) {
    const premiseOffset = getPremisesFor('offsetAnalogyPremises', 0);
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
    if (choiceIndex === 0) {
        length = Math.max(3, getPremisesFor("overrideDistinctionPremises", length) + premiseOffset);
        return new DistinctionQuestion().createAnalogy(length, timeOffset);
    }
    else if (choiceIndex === 1) {
        length = Math.max(3, getPremisesFor("overrideComparisonPremises", length) + premiseOffset);
        return new LinearQuestion(new MoreLess()).createAnalogy(length, timeOffset);
    }
    else if (choiceIndex === 2) {
        length = Math.max(3, getPremisesFor("overrideTemporalPremises", length) + premiseOffset);
        return new LinearQuestion(new BeforeAfter()).createAnalogy(length, timeOffset);
    }
    else if (choiceIndex === 3) {
        length = Math.max(3, getPremisesFor("overrideDirectionPremises", length) + premiseOffset);
        return new DirectionQuestion(new Direction2D()).createAnalogy(length, timeOffset);
    } else if (choiceIndex === 4) {
        length = Math.max(3, getPremisesFor("overrideDirection3DPremises", length) + premiseOffset);
        return new DirectionQuestion(new Direction3D()).createAnalogy(length, timeOffset);
    } else {
        length = Math.max(3, getPremisesFor("overrideDirection4DPremises", length) + premiseOffset);
        return new DirectionQuestion(new Direction4D()).createAnalogy(length, timeOffset);
    }
}
