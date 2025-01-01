function seededRandom(seed) {
    let m = 2 ** 31 - 1; // Large prime number
    let a = 48271;       // Multiplier
    let c = 0;           // Increment
    let state = seed % m;

    return function () {
        state = (a * state + c) % m;
        return state / m; // Normalize to [0, 1)
    };
}

class VisualNoise {
    nextColor() {
        const hue = Math.floor(this.random() * 360);
        const saturation = Math.floor(20 + this.random() * 81);
        const lightness = Math.floor(10 + (this.random() * 91));

        return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    }

    weightedRandomIndex(array) {
        const totalWeight = array.reduce((acc, _, index) => acc + Math.pow(index + 1, 2), 0);
        const randomWeight = this.random() * totalWeight;

        let cumulativeWeight = 0;
        for (let i = 0; i < array.length; i++) {
            cumulativeWeight += Math.pow(i + 1, 2);
            if (randomWeight < cumulativeWeight) {
                return i;
            }
        }
    }

    generateEmojiSvg(id, splits, minSplit, maxSplit) {
        const width = 100, height = 50;
        let rectangles = [{ x: 0, y: 0, width, height }];

        for (let i = 0; i < splits; i++) {
            const [rect] = rectangles.splice(this.weightedRandomIndex(rectangles), 1);
            const splitProbability = rect.height / (rect.width + rect.height);
            const splitHorizontally = this.random() < splitProbability;
            if (splitHorizontally) {
                const low = rect.height * minSplit;
                const high = rect.height * maxSplit;
                const splitY = rect.y + low + this.random() * (high - low);
                rectangles.push(
                    { x: rect.x, y: rect.y, width: rect.width, height: splitY - rect.y },
                    { x: rect.x, y: splitY, width: rect.width, height: rect.y + rect.height - splitY }
                );
            } else {
                const low = rect.width * minSplit;
                const high = rect.width * maxSplit;
                const splitX = rect.x + low + this.random() * (high - low);
                rectangles.push(
                    { x: rect.x, y: rect.y, width: splitX - rect.x, height: rect.height },
                    { x: splitX, y: rect.y, width: rect.x + rect.width - splitX, height: rect.height }
                );
            }

            rectangles.sort((a, b) => a.width * a.height - b.width * b.height);
        }

        let svgContent = `<svg id="vnoise-${id}" class="noise" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`;
        for (const rect of rectangles) {
            const color = this.nextColor();
            svgContent += `<rect x="${Math.round(rect.x)}" y="${Math.round(rect.y)}" width="${Math.round(rect.width)}" height="${Math.round(rect.height)}" fill="${color}" />`;
        }

        svgContent += '</svg>';
        return svgContent;
    }

    generateVisualNoise(seed, splits) {
        this.random = seededRandom(seed);
        return this.generateEmojiSvg(seed, splits, 0.25, 0.75);
    }
}
