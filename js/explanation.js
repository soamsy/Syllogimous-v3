function createGridFromMap(wordCoordMap) {
    const entries = Object.entries(wordCoordMap);
    const low = structuredClone(entries[0][1]);
    const high = structuredClone(entries[0][1]);

    for (const [word, coord] of entries) {
        for (const i in coord) {
            low[i] = Math.min(low[i], coord[i])
            high[i] = Math.max(high[i], coord[i])
        }
    }

    const dimensions = low.map((l, i) => high[i] - l + 1);
    const createNArray = (i) => {
        if (i < 0)
            return '';
        return Array.from({ length: dimensions[i] }, (_, a) => createNArray(i-1));
    };
    const grid = createNArray(dimensions.length - 1);

    for (const [word, coord] of entries) {
        let curr = grid
        for (let i = coord.length - 1; i >= 0; i--) {
            const loc = coord[i] - low[i];
            if (!Array.isArray(curr[loc])) {
                curr[loc] += (curr[loc].length > 0 ? ',' : '') + word;
                break;
            }
            curr = curr[loc]
        }
    }

    return grid;
}

function centerText(text, width) {
    const totalPadding = width - text.length;
    const paddingStart = Math.floor(totalPadding / 2);
    return text.padStart(text.length + paddingStart).padEnd(width);
}

function createExplanation2D(grid, filler) {
    if (!filler) {
        const biggest = grid.flatMap(row => row).map(val => val?.length ?? 0).reduce((a, b) => Math.max(a, b));
        const neededLength = biggest + 2;
        filler = ' '.repeat(neededLength);
    }

    let s = '<table>\n';
    for (let i = grid.length - 1; i >= 0; i--) {
        const row = grid[i];
        s += '<tr>';
        for (const val of row) {
            s += '<td>' + (val ? val : filler) + '</td>';
        }
        s += '</tr>\n';
    }
    s += '</table>';
    return s;
}

function createExplanation3D(grid) {
    const biggest = grid.flatMap(floor => floor.flatMap(row => row)).map(val => val?.length ?? 0).reduce((a, b) => Math.max(a, b));
    const neededLength = biggest + 2;
    const filler = ' '.repeat(neededLength)
    let s = '';
    for (let i = grid.length - 1; i >= 0; i--) {
        let floor = i + 1;
        s += '<span>F' + floor + '</span>\n';
        s += createExplanation2D(grid[i], filler);
    }
    return s;
}

function createExplanationBucket(question) {
    if (question.category == 'Comparison') {
        return structuredClone(question.bucket).reverse().join(' < ');
    } else {
        return question.bucket.join(" ");
    }
}

function createExplanationBuckets(question) {
    const biggest = question.buckets.flatMap(row => row).map(val => val?.length ?? 0).reduce((a, b) => Math.max(a, b));
    const neededLength = biggest + 4;
    const [a, b] = question.buckets;
    const verticalLength = Math.max(a.length, b.length);
    let s = '';
    for (let i = 0; i < verticalLength; i++) {
        const left = centerText((i < a.length) ? a[i] : '', neededLength);
        const right = centerText((i < b.length) ? b[i] : '', neededLength);
        s += left + '|' + right + '\n';
    }
    return s;
}

function createExplanation(question) {
    if (question.bucket) {
        return createExplanationBucket(question);
    }

    if (question.buckets) {
        return createExplanationBuckets(question);
    }

    if (question.wordCoordMap) {
        const grid = createGridFromMap(question.wordCoordMap);
        if (grid && Array.isArray(grid[0]) && Array.isArray(grid[0][0])) {
            return createExplanation3D(grid);
        } else {
            return createExplanation2D(grid);
        }
    }
}

function createExplanationPopup(question) {
    const popup = document.createElement("div");
    popup.id = "explanation-popup";
    popup.className = "explanation-popup";
    popup.style.position = "fixed";
    popup.style.top = "50%";
    popup.style.left = "50%";
    popup.style.transform = "translate(-50%, -50%)";
    popup.style.zIndex = "1000";
    popup.style.padding = "20px";
    popup.style.backgroundColor = "#222";
    popup.style.borderRadius = "8px";
    popup.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.2)";
    popup.style.width = "fit-content";
    popup.style.textAlign = "center";

    const content = document.createElement("pre");
    content.innerHTML = createExplanation(question);
    popup.appendChild(content);

    document.body.appendChild(popup);
}

function removeExplanationPopup() {
    let elems = document.getElementsByClassName("explanation-popup");
    for (const el of elems) {
        el.remove();
    }
}

function createExplanationButton(question) {
    if (question.category === 'Syllogism' || question.category === 'Space Time') {
        return '';
    }

    if (question.wordCoordMap || question.bucket || question.buckets) {
        return `<button class="explanation-button">Explanation</button>`;
    }

    return ''
}

