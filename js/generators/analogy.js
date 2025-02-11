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
    const premiseOffset = getPremisesFor('offsetAnalogyPremises', 0);
    const choiceIndices = [];

    if (savedata.enableDistinction)
        choiceIndices.push(0);
    if (savedata.enableLinear) {
        for (let i = 0; i < getLinearQuestionsCount(); i++) {
            choiceIndices.push(1);
        }
    }
    if (savedata.enableDirection)
        choiceIndices.push(2);
    if (savedata.enableDirection3D)
        choiceIndices.push(3);
    if (savedata.enableDirection4D)
        choiceIndices.push(4);

    const choiceIndex = pickRandomItems(choiceIndices, 1).picked[0];
    let question;
    let origLength;
    if (choiceIndex === 0) {
        origLength = getPremisesFor("overrideDistinctionPremises", length);
        question = new DistinctionQuestion().createAnalogy(Math.max(origLength + premiseOffset, 3));
    } else if (choiceIndex === 1) {
        origLength = getPremisesFor("overrideLinearPremises", length);
        question = createLinearQuestion().createAnalogy(Math.max(origLength + premiseOffset, 3));
    } else if (choiceIndex === 2) {
        origLength = getPremisesFor("overrideDirectionPremises", length);
        question = new DirectionQuestion(new Direction2D()).createAnalogy(Math.max(origLength + premiseOffset, 3));
    } else if (choiceIndex === 3) {
        origLength = getPremisesFor("overrideDirection3DPremises", length);
        question = new DirectionQuestion(new Direction3D()).createAnalogy(Math.max(origLength + premiseOffset, 3));
    } else {
        origLength = getPremisesFor("overrideDirection4DPremises", length);
        question = new DirectionQuestion(new Direction4D()).createAnalogy(Math.max(origLength + premiseOffset, 3));
    }

    question.plen = origLength;
    question.tlen = question.countdown || savedata.timer;
    question.tags = ['analogy'];
    if (question.countdown) {
        question.countdown += timeOffset;
    } else {
        question.timeOffset = timeOffset;
    }

    return question;
}