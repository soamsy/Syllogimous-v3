function applyMeta(premises, relationFinder) {
    // Randomly choose a number of meta-relations
    const numOfMetaRelations = 1 + Math.floor(Math.random() * Math.floor(premises.length / 2));
    let _premises = pickRandomItems(premises, numOfMetaRelations * 2);
    premises = [ ..._premises.remaining ];

    while (_premises.picked.length) {

        const choosenPair = pickRandomItems(_premises.picked, 2);
        const negations = choosenPair.picked.map(p => /is-negated/.test(p));
        const relations = choosenPair.picked.map(relationFinder);

        // Generate substitution string
        let substitution;
        const [a, b] = [
                ...choosenPair.picked[0]
                .matchAll(/<span class="subject">(.*?)<\/span>/g)
            ]
            .map(m => m[1]);
        const isSame = negations[0] ^ negations[1] ^ (relations[0] === relations[1]);
        if (isSame) {
            substitution = pickNegatable([
                `$1 is same as <span class="is-meta">(<span class="subject">${a}</span> to <span class="subject">${b}</span>)</span> to $3`,
                `$1 is <span class="is-negated">opposite of</span> <span class="is-meta">(<span class="subject">${a}</span> to <span class="subject">${b}</span>)</span> to $3`
            ]);
        } else {
            substitution = pickNegatable([
                `$1 is opposite of <span class="is-meta">(<span class="subject">${a}</span> to <span class="subject">${b}</span>)</span> to $3`,
                `$1 is <span class="is-negated">same as</span> <span class="is-meta">(<span class="subject">${a}</span> to <span class="subject">${b}</span>)</span> to $3`
            ]);
        }

        // Replace relation with meta-relation via substitution string
        const metaPremise = choosenPair.picked[1]
            .replace(/(<span class="relation">)(.*)(<\/span>) (?=<span class="subject">)/, substitution);

        // Push premise and its corresponding meta-premise
        premises.push(choosenPair.picked[0], metaPremise);

        // Update _premises so that it doesn't end up in an infinite loop
        _premises = { picked: choosenPair.remaining };
    }
    return premises;
}
