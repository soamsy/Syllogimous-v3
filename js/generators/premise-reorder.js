function premiseKey(source, target) {
    return JSON.stringify([source, target].sort());
}

// Util to take a branching (non-linear) graph of premises, and reorder them so
// they mostly appear in connection order.
function orderPremises(premiseMap, neighbors) {
    let premises = [];
    let traversed = new Set();
    const traverse = (word, parent) => {
        if (traversed.has(word)) {
            return;
        }
        traversed.add(word);

        const key = premiseKey(word, parent);
        if (premiseMap[key]) {
            premises.push(premiseMap[key]);
        }
        const traversalOptions = [...neighbors[word]];
        traversalOptions.sort((a,b) => neighbors[a].length - neighbors[b].length);
        for (const neighbor of traversalOptions) {
            traverse(neighbor, word);
        }
    }
    const start = Object.keys(neighbors).filter(word => neighbors[word].length === 1)[0];
    traverse(start, null);

    return premises;
}

function scramble(premises) {
    if (savedata.scrambleLimit === null || premises.length <= savedata.scrambleLimit) {
        return shuffle(premises);
    }

    let { picked: shuffled, remaining: unshuffled } = pickRandomItems(premises, savedata.scrambleLimit);
    shuffled = shuffle(shuffled);

    let result = [];
    for (let i = 0; i < 100; i++) {
        result = [];
        let i = 0, j = 0;
        while (i < shuffled.length || j < unshuffled.length) {
            if (i < shuffled.length && j < unshuffled.length) {
                let shuffledRemaining = shuffled.length - i;
                let unshuffledRemaining = unshuffled.length - j;
                let chance = shuffledRemaining / (shuffledRemaining + unshuffledRemaining);
                if (Math.random() < chance) {
                    result.push(shuffled[i++]);
                } else {
                    result.push(unshuffled[j++]);
                }
            } else if (i < shuffled.length) {
                result.push(shuffled[i++]);
            } else {
                result.push(unshuffled[j++]);
            }
        }

        if (!arraysEqual(result, premises)) {
            break;
        }
    }
    return result;
}
