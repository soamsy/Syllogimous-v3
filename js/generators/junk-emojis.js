const EMOJI_LENGTH = 50;
const JUNK_EMOJI_COUNT = 1000;
class JunkEmojis {
    constructor() {
        this.id = 0;
        this.pool = JunkEmojis.generateColorPool();
    }

    static shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const randomIndex = Math.floor(Math.random() * (i + 1));
            [array[i], array[randomIndex]] = [array[randomIndex], array[i]];
        }
        return array;
    }

    static zipShuffle(arrays) {
        const maxLength = Math.max(...arrays.map(arr => arr.length));
    
        const result = [];
        for (let i = 0; i < maxLength; i++) {
            const group = arrays.map(arr => arr[i] !== undefined ? arr[i] : undefined); // Handle different array lengths
            JunkEmojis.shuffleArray(group);
            result.push(group);
        }
    
        return result.flat();
    }

    static generateColorPool() {
        const colors = [];

        const hueGroups = [];
        const hues = [0,10,20,30,40,45,50,55,60,65,70,80,90,100,110,120,130,140,150,160,170,180,190,200,210,220,230,240,250,260,270,280,290,295,300,305,310,320,330,340,350];
        const saturations = [5, 30, 40, 50, 65, 75, 80, 85, 90, 95, 100];
        const lightnesses = [10, 22, 35, 50, 65, 80, 95];

        for (const hue of hues) {
            const group = [];
            for (const saturation of saturations) {
                for (const lightness of lightnesses) {
                    group.push(`hsl(${hue}, ${saturation}%, ${lightness}%)`);
                }
            }
            hueGroups.push(group);
        }

        for (const group of hueGroups) {
            JunkEmojis.shuffleArray(group);
        }

        return JunkEmojis.zipShuffle(hueGroups);
    }

    static generateRandomPoints(minX, maxX, minY, maxY, numPoints, minDistance) {
        const points = [];
        const width = maxX - minX;
        const height = maxY - minY;

        const isFarEnough = (x, y) => {
            for (const [px, py] of points) {
                const dx = px - x;
                const dy = py - y;
                if (Math.sqrt(dx * dx + dy * dy) < minDistance) {
                    return false;
                }
            }
            return true;
        };

        while (points.length < numPoints) {
            const x = minX + Math.random() * width;
            const y = minY + Math.random() * height;

            if (isFarEnough(x, y)) {
                points.push([x, y]);
            }
        }

        return points;
    }

    rebuildPool() {
        this.pool = JunkEmojis.generateColorPool();
    }

    nextColor() {
        const color = this.pool[this.id % this.pool.length];
        this.id += 1;
        if (this.id % this.pool.length == 0) {
            this.rebuildPool();
        }
        return color;
    }

    generateJunkEmoji(id=-1) {
        const width = EMOJI_LENGTH, height = EMOJI_LENGTH;
        const numPoints = pickRandomItems([2, 3, 3, 4, 4, 5, 6], 1).picked[0];
        const points = JunkEmojis.generateRandomPoints(3, width-3, 3, height-3, numPoints, 5);
        const voronoi = d3.Delaunay.from(points).voronoi([0, 0, width, height]);
        let svgContent = `<symbol id="junk-${id}" xmlns="http://www.w3.org/2000/svg" viewbox="0 0 ${width} ${height}">`;

        for (let i = 0; i < points.length; i++) {
            const cell = voronoi.cellPolygon(i);
            if (cell) {
                const pointsString = cell.map(([x, y]) => `${Math.round(x)},${Math.round(y)}`).join(' ');
                const color = this.nextColor();
                svgContent += `<polygon points="${pointsString}" fill="${color}" />`;
            }
        }

        svgContent += '</symbol>';
        return svgContent;
    }

    generateAllEmoji() {
        let s = '<svg style="display: none;">\n';
        s += '<defs>\n';
        for (let i = 0; i < JUNK_EMOJI_COUNT; i++) {
            const svg = this.generateJunkEmoji(i);
            s += svg + '\n';
        }
        s += '</defs>\n';
        s += '</svg>\n';
        return s;
    }
}

// To generate:
// console.log(new JunkEmojis().generateAllEmoji());

// setTimeout(() => {
//     const e = document.createElement('div');
//     historyList.appendChild(e);
//     for (let id = 0; id < JUNK_EMOJI_COUNT; id++) {
//         const word = `[junk]${id}[/junk]`;
//         e.innerHTML += renderJunkEmojisText(word);
//     }
// }, 1500);

function renderJunkEmojisText(text) {
    return text.replaceAll(/\[junk\](\d+)\[\/junk\]/gi, (match, id) => {
        let s = `<svg class="junk" width="${EMOJI_LENGTH}" height="${EMOJI_LENGTH}">`;
        s += `<use xlink:href="#junk-${id}"></use>`;
        s += '</svg>';
        return s;
    });
}

function renderJunkEmojis(question) {
    question = structuredClone(question);
    if (question.bucket) {
        question.bucket = question.bucket.map(renderJunkEmojisText);
    }

    if (question.buckets) {
        question.buckets = question.buckets.map(bucket => bucket.map(renderJunkEmojisText));
    }

    if (question.wordCoordMap) {
        const words = Object.keys(question.wordCoordMap);
        for (const word of words) {
            const rendered = renderJunkEmojisText(word);
            if (rendered.length !== word.length) {
                question.wordCoordMap[rendered] = question.wordCoordMap[word];
                delete question.wordCoordMap[word];
            }
        }
    }

    if (question.subresults) {
        question.subresults = question.subresults.map(renderJunkEmojis);
    }

    if (question.premises) {
        question.premises = question.premises.map(renderJunkEmojisText);
    }

    if (question.operations) {
        question.operations = question.operations.map(renderJunkEmojisText);
    }

    if (question.conclusion) {
        question.conclusion = renderJunkEmojisText(question.conclusion);
    }

    return question;
}

