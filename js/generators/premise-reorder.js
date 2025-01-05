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

    return scrambleWithLimit(premises, savedata.scrambleLimit);
}

function scrambleWithLimit(premises, limit) {
    let { picked: shuffled, remaining: unshuffled } = pickRandomItems(premises, limit);
    shuffled = shuffle(shuffled);

    let result = [];
    for (let i = 0; i < 100; i++) {
        result = mergeRandomly(shuffled, unshuffled);
        if (!arraysEqual(result, premises)) {
            break;
        }
    }
    return result;
}

function mergeRandomly(left, right) {
    result = [];
    let i = 0, j = 0;
    while (i < left.length || j < right.length) {
        if (i < left.length && j < right.length) {
            let leftRemaining = left.length - i;
            let rightRemaining = right.length - j;
            let chance = leftRemaining / (leftRemaining + rightRemaining);
            if (Math.random() < chance) {
                result.push(left[i++]);
            } else {
                result.push(right[j++]);
            }
        } else if (i < left.length) {
            result.push(left[i++]);
        } else {
            result.push(right[j++]);
        }
    }

    return result;
}
