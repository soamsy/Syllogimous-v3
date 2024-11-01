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

function findTwoWords(words) {
    let wordsJump = Math.max(2, randomInclusive(words.length - 3, words.length - 1));
    let wordsOffset = randomInclusive(0, words.length - wordsJump - 1);
    let wordsEnd = Math.min(words.length - 1, wordsOffset + wordsJump);
    return [words[wordsOffset], words[wordsEnd]];
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

