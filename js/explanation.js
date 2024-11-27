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
    if (text.length > 50) {
        const half = Math.floor(width / 2);
        const padding = ' '.repeat(half);
        return padding + text + padding;
    }
    const totalPadding = width - text.length;
    const paddingStart = Math.floor(totalPadding / 2);
    return text.padStart(text.length + paddingStart).padEnd(width);
}

function createFiller(grid) {
    const lengths = grid.flat(Infinity).map(x => x.length > 50 ? 1 : x.length);
    const biggest = lengths.reduce((a, b) => Math.max(a, b));
    const neededLength = biggest + 2;
    return ' '.repeat(neededLength);
}

function createExplanation2D(grid, filler) {
    if (!filler) {
        filler = createFiller(grid);
    }

    let s = '<table>\n';
    for (let i = grid.length - 1; i >= 0; i--) {
        const row = grid[i];
        s += '<tr>';
        for (const val of row) {
            s += '<td>' + (val ? centerText(val, filler.length) : filler) + '</td>';
        }
        s += '</tr>\n';
    }
    s += '</table>';
    return s;
}

function createExplanation3D(grid, filler) {
    if (!filler) {
        filler = createFiller(grid);
    }
    let s = '';
    for (let i = grid.length - 1; i >= 0; i--) {
        let floor = i + 1;
        s += '<span>F' + floor + '</span>\n';
        s += createExplanation2D(grid[i], filler);
    }
    return s;
}

function createExplanation4D(grid) {
    const filler = createFiller(grid);
    let s = '<div style="display: flex; gap: 0.5rem;">';
    for (let i = 0; i < grid.length; i++) {
        let time = i + 1;
        s += '<div>';
        s += '<div>Time ' + time + '</div>'
        s += '<div>---------</div>'
        s += createExplanation3D(grid[i], filler);
        s += '</div>';
    }
    s += '</div>'
    return s;
}

function createExplanationBucket(question) {
    if (question.category == 'Comparison') {
        return question.bucket.join(' < ');
    } else {
        return question.bucket.join(" ");
    }
}

function createExplanationBuckets(question) {
    const filler = createFiller(question.buckets);
    const [a, b] = question.buckets;
    const verticalLength = Math.max(a.length, b.length);
    let s = '<table class="distinction">';
    s += '<tr>';
    s += '<td>';
    for (const item of a) {
        s += '<div>' + centerText(item, filler.length) + '</div>';
    }
    s += '</td>';
    s += '<td>';
    for (const item of b) {
        s += '<div>' + centerText(item, filler.length) + '</div>';
    }
    s += '</td>';
    s += '</tr>';
    s += '</table>';
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
        if (grid && Array.isArray(grid[0]) && Array.isArray(grid[0][0]) && Array.isArray(grid[0][0][0])) {
            return createExplanation4D(grid);
        } else if (grid && Array.isArray(grid[0]) && Array.isArray(grid[0][0])) {
            return createExplanation3D(grid);
        } else {
            return createExplanation2D(grid);
        }
    }

    if (question.subresults) {
        return question.subresults.map(createExplanation).join('<div class="binary-explainer-separator"></div>');
    }
}

function createExplanationPopup(question, e) {
    const { clientX: mouseX, clientY: mouseY } = event;
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
    popup.style.maxWidth = "98vw";
    popup.style.maxHeight = "98vh";
    popup.style.overflow = "auto";
    popup.style.textAlign = "center";
    popup.style.pointerEvents = "none";

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
    if (question.category === 'Syllogism') {
        return '';
    }

    if (question.wordCoordMap || question.bucket || question.buckets || question.subresults) {
        return `<button class="explanation-button">Explanation</button>`;
    }

    return ''
}

