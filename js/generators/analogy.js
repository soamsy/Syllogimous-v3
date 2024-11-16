function createSameDifferent(length) {

    const premiseOffset = getPremisesFor('offsetAnalogyPremises', 0);
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

        choice = createSameOpposite(Math.max(3, getPremisesFor("overrideDistinctionPremises", length) + premiseOffset));
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

        choice = createMoreLess(Math.max(3, getPremisesFor("overrideComparisonPremises", length) + premiseOffset));
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

        choice = createBeforeAfter(Math.max(3, getPremisesFor("overrideTemporalPremises", length) + premiseOffset));
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
            choice = createDirectionQuestion(Math.max(3, getPremisesFor("overrideDirectionPremises", length) + premiseOffset));

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
            choice = createDirectionQuestion3D(Math.max(3, getPremisesFor("overrideDirection3DPremises", length) + premiseOffset));

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
            choice = createDirectionQuestion4D(Math.max(3, getPremisesFor("overrideDirection4DPremises", length) + premiseOffset));

            // Pick 4 different items
            [a, b, c, d] = pickRandomItems(Object.keys(choice.wordCoordMap), 4).picked;
            conclusion += `<span class="subject">${a}</span> to <span class="subject">${b}</span>`;

            // Find if A to B has same relation of C to D
            const coord = findDirectionCoord4D(choice.wordCoordMap[a], choice.wordCoordMap[b]);
            const coord2 = findDirectionCoord4D(choice.wordCoordMap[c], choice.wordCoordMap[d]);
            isValidSame = arraysEqual(coord, coord2);
        }
    }

    if (coinFlip()) {
        isValid = isValidSame;
        if (choiceIndex < 1) {
            const cs = [
                '<div class="analogy-statement">is the same as</div>',
                '<div class="analogy-statement" style="color: red;">is different from</div>'
            ];
            conclusion += (!savedata.enableNegation)
                ? cs[0]
                : pickRandomItems(cs, 1).picked[0];
        }
        else {
            const cs = [
                '<div class="analogy-statement">has the same relation as</div>',
                '<div class="analogy-statement" style="color: red">has a different relation from</div>'
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
                '<div class="analogy-statement">is different from</div>',
                '<div class="analogy-statement" style="color: red;">is the same as</div>'
            ];
            conclusion += (!savedata.enableNegation)
                ? cs[0]
                : pickRandomItems(cs, 1).picked[0];

        }
        else {
            const cs = [
                '<div class="analogy-statement">has a different relation from</div>',
                '<div class="analogy-statement" style="color: red">has the same relation as</div>',
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
