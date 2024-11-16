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
        '<div class="is-connector"></div> $a <div class="is-connector">nand</div> $b <div class="is-connector">are true</div>',
        '$a <div class="is-connector">or</div> $b',
        '<div class="is-connector">Neither</div> $a <div class="is-connector">nor</div> $b',
        '<div class="is-connector">Either</div> $a <div class="is-connector">or</div> $b',
        '<div class="is-connector">Both</div> $a <div class="is-connector">and</div> $b <div class="is-connector">are the same</div>'
    ];

    const pool = [];
    if (savedata.enableDistinction)
        pool.push([createSameOpposite, getPremisesFor('overrideDistinctionPremises', length)]);
    if (savedata.enableComparison)
        pool.push([createMoreLess, getPremisesFor('overrideComparisonPremises', length)]);
    if (savedata.enableTemporal)
        pool.push([createBeforeAfter, getPremisesFor('overrideTemporalPremises', length)]);
    if (savedata.enableSyllogism)
        pool.push([createSyllogism, getPremisesFor('overrideSyllogismPremises', length)]);
    if (savedata.enableDirection)
        pool.push([createDirectionQuestion, getPremisesFor('overrideDirectionPremises', length)]);
    if (savedata.enableDirection3D)
        pool.push([createDirectionQuestion3D, getPremisesFor('overrideDirection3DPremises', length)]);
    if (savedata.enableDirection4D)
        pool.push([createDirectionQuestion4D, getPremisesFor('overrideDirection4DPremises', length)]);

    const premiseOffset = getPremisesFor('offsetBinaryPremises', 0);
    let choice;
    let choice2;
    let premises;
    let conclusion = "";
    const flip = coinFlip();
    let isValid;
    const operandIndex = Math.floor(Math.random()*operands.length);
    const operand = operands[operandIndex];
    while (flip !== isValid) {
        let [[generator, len], [generator2, len2]] = pickRandomItems(pool, 2).picked;
        length = Math.max(4, Math.floor((len + len2) / 2) + premiseOffset);

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
        subresults: [choice, choice2],
        isValid,
        premises,
        conclusion
    };
}

function createNestedBinaryQuestion(length) {
    const humanOperands = [
        '<span class="is-connector DEPTH">(</span>à<span class="is-connector DEPTH">)</span> <span class="is-connector DEPTH">AND</span><br> <span class="is-connector DEPTH">(</span>ò<span class="is-connector DEPTH">)</span>',
        '<span class="is-connector DEPTH">(</span>à<span class="is-connector DEPTH">)</span> <span class="is-connector DEPTH">NAND</span><br> <span class="is-connector DEPTH">(</span>ò<span class="is-connector DEPTH">)</span>',
        '<span class="is-connector DEPTH">(</span>à<span class="is-connector DEPTH">)</span> <span class="is-connector DEPTH">OR</span><br> <span class="is-connector DEPTH">(</span>ò<span class="is-connector DEPTH">)</span>',
        '<span class="is-connector DEPTH">(</span>à<span class="is-connector DEPTH">)</span> <span class="is-connector DEPTH">NOR</span><br> <span class="is-connector DEPTH">(</span>ò<span class="is-connector DEPTH">)</span>',
        '<span class="is-connector DEPTH">(</span>à<span class="is-connector DEPTH">)</span> <span class="is-connector DEPTH">XOR</span><br> <span class="is-connector DEPTH">(</span>ò<span class="is-connector DEPTH">)</span>',
        '<span class="is-connector DEPTH">(</span>à<span class="is-connector DEPTH">)</span> <span class="is-connector DEPTH">XNOR</span><br> <span class="is-connector DEPTH">(</span>ò<span class="is-connector DEPTH">)</span>'
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

    const premiseOffset = getPremisesFor('offsetBinaryPremises', 0);
    length = Math.max(4, length + premiseOffset);
    const halfLength = Math.floor(length / 2);
    const questions = Array(halfLength).fill(0)
        .map(() => pool[Math.floor(Math.random() * pool.length)](2));

    let numOperands = +savedata.maxNestedBinaryDepth;
    let i = 0;
    function generator(remaining, depth) {
        remaining--;
        const left = Math.floor(Math.random() * remaining);
        const right = remaining - left;
        const rndIndex = Math.floor(Math.random() * humanOperands.length);
        const humanOperand = humanOperands[rndIndex];
        const evalOperand = evalOperands[rndIndex];
        const val = (left > 0)
            ? generator(left, depth+1)
            : (i++) % halfLength;
        const val2 = (right > 0)
            ? generator(right, depth+1)
            : (i++) % halfLength;
        const letter = String.fromCharCode(97 + depth);
        const className = 'depth-' + letter;
        return {
            human: humanOperand
                .replaceAll('DEPTH', className)
                .replace('à', val > - 1 ? val : val.human)
                .replace('ò', val2 > - 1 ? val2 : val2.human),
            eval: evalOperand
                .replaceAll('a', val > - 1 ? val : val.eval)
                .replaceAll('b', val2 > - 1 ? val2 : val2.eval),
        };
    }

    const generated = generator(numOperands, 0);

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
        subresults: questions,
        isValid,
        premises,
        conclusion
    };
}

