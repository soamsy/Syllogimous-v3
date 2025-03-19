function pickRandomItems(array, n) {
    const copy = [...array];
    const picked = [];
    while (n > 0) {
        const rnd = Math.floor(Math.random()*copy.length);
        picked.push(copy.splice(rnd, 1)[0]);
        n--;
    }
    return { picked, remaining: copy };
}

function shuffle(array) {
    let currentIndex = array.length, randomIndex;
    while (currentIndex != 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }
    return array;
}

function coinFlip() {
    return Math.random() > 0.5;
}

function randomInclusive(start, end) {
    if (start >= end) {
        return start;
    }
    return Math.floor(Math.random() * (end - start + 1)) + start;
}

function arraysEqual(arr1, arr2) {
    return arr1.length === arr2.length && arr1.every((value, index) => value === arr2[index]);
}

function removeDuplicateArrays(arrays) {
    const uniqueArrays = arrays.filter((arr, index, self) =>
      index === self.findIndex(otherArr => arraysEqual(arr, otherArr))
    );

    return uniqueArrays;
}

function getPremisesFor(key, defaultQuota) {
    if (savedata[key] && typeof savedata[key] === 'number' && isFinite(savedata[key])) {
        return savedata[key];
    } else {
        return defaultQuota;
    }
}

function pickNegatable(cs) {
    return savedata.enableNegation ? pickRandomItems(cs, 1).picked[0] : cs[0];
}

function interleaveArrays(arr1, arr2) {
    const maxLength = Math.max(arr1.length, arr2.length); // Get the longer array's length
    const result = [];

    for (let i = 0; i < maxLength; i++) {
        if (i < arr1.length) {
            result.push(arr1[i]); // Add element from the first array if it exists
        }
        if (i < arr2.length) {
            result.push(arr2[i]); // Add element from the second array if it exists
        }
    }

    return result;
}

function frontHeavyIntervalMerge(left, right) {
    const result = [];
    const totalIntervals = right.length + 1;
    const lowInterval = Math.floor(left.length / totalIntervals);
    const highInterval = Math.ceil(left.length / totalIntervals);
    const numHigh = left.length % totalIntervals;

    let m = 0;
    let n = 0;

    for (let i = 0; i < numHigh; i++) {
        for (let j = 0; j < highInterval; j++) {
            result.push(left[m++]);
        }
        if (n < right.length) {
            result.push(right[n++]);
        }
    }

    for (let i = numHigh; i < totalIntervals; i++) {
        for (let j = 0; j < lowInterval; j++) {
            result.push(left[m++]);
        }
        if (n < right.length) {
            result.push(right[n++]);
        }
    }

    return result;
}

function pairwise(arr, callback) {
    for (let i = 0; i < arr.length - 1; i++) {
        callback(arr[i], arr[i + 1], i, arr);
    }
}

function repeatArrayUntil(arr, n) {
    const result = [];
    while (result.length < n) {
        result.push(...arr); // Spread the array and append it to the result
    }
    return result.slice(0, n); // Trim the array to exactly 'n' elements
}

function getLocalStorageObj(key) {
    const entry = localStorage.getItem(key);
    if (entry) {
        return JSON.parse(entry);
    } else {
        return null;
    }
}

function setLocalStorageObj(key, obj) {
    localStorage.setItem(key, JSON.stringify(obj));
}

function normalizeString(input) {
    return input
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '');
}

function oneOutOf(n) {
    return Math.random() < 1 / n;
}
