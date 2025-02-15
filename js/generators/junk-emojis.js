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

    static perfectShuffle(arr, groupCount) {
        let groups = Array.from({ length: groupCount }, () => []);

        for (let i = 0; i < arr.length; i++) {
            groups[i % groupCount].push(arr[i]);
        }

        return [].concat(...groups);
    }

    static zipShuffle(arrays) {
        const maxLength = Math.max(...arrays.map(arr => arr.length));
    
        const result = [];
        for (let i = 0; i < maxLength; i++) {
            const group = arrays.map(arr => arr[i] !== undefined ? arr[i] : undefined).filter(x => x !== undefined); // Handle different array lengths
            const splits = pickRandomItems([3,4,5,6,7,8,9], 1).picked[0];
            result.push(JunkEmojis.perfectShuffle(group, splits));
        }
    
        return result.flat();
    }

    static generateColorPool() {
        const colors = [];

        const hueGroups = [];
        const hues = [0,10,20,30,40,45,50,55,60,65,70,80,90,100,115,130,145,160,170,180,190,200,210,220,230,237,244,250,260,270,280,290,295,300,305,310,320,330,340,350];
        const saturations = [5, 30, 40, 50, 65, 67, 75, 80, 85, 90, 95, 100];
        const lightnesses = [10, 22, 35, 50, 65, 80, 92];

        for (const hue of hues) {
            const group = [];
            for (const saturation of saturations) {
                for (const lightness of lightnesses) {
                    if (85 < hue && hue < 150 && (lightness <= 30 || saturation <= 30)) {
                        // Puke green is not kawaii
                        continue;
                    }
                    if (Math.random() < 0.005) {
                        group.push(`hsl(${hue}, ${saturation}%, ${0}%)`);
                    } else if (Math.random() < 0.005) {
                        group.push(`hsl(${hue}, ${saturation}%, ${100}%)`);
                    } else {
                        group.push(`hsl(${hue}, ${saturation}%, ${lightness}%)`);
                    }
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

    generateJunkEmoji(colors, id=-1) {
        const width = EMOJI_LENGTH, height = EMOJI_LENGTH;
        const numPoints = colors.length;
        const points = JunkEmojis.generateRandomPoints(3, width-3, 3, height-3, numPoints, 5);
        const voronoi = d3.Delaunay.from(points).voronoi([0, 0, width, height]);
        let svgContent = `<symbol id="junk-${id}" xmlns="http://www.w3.org/2000/svg" viewbox="0 0 ${width} ${height}">`;

        for (let i = 0; i < points.length; i++) {
            const color = colors[i];
            const cell = voronoi.cellPolygon(i);
            if (cell) {
                const pointsString = cell.map(([x, y]) => `${Math.round(x)},${Math.round(y)}`).join(' ');
                svgContent += `<polygon points="${pointsString}" fill="${color}" />`;
            }
        }

        svgContent += '</symbol>';
        return svgContent;
    }

    parseHSL(hsl) {
        let match = hsl.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
        return match ? match.slice(1).map(Number) : [0, 0, 0];
    }

    generateAllEmoji() {
        let colorCombos = [];
        for (let i = 0; i < JUNK_EMOJI_COUNT; i++) {
            const numColors = pickRandomItems([2, 3, 3, 4, 4, 5], 1).picked[0];
            let combo = [];
            for (let j = 0; j < numColors; j++) {
                combo.push(this.nextColor());
            }
            colorCombos.push(combo);
        }

        colorCombos.sort((a, b) => {
            const [u, v, w] = this.parseHSL(a[0]);
            const [x, y, z] = this.parseHSL(b[0]);
            return u - x || v - y || w - z;
        })

        let s = '<svg style="display: none;">\n';
        s += '<defs>\n';
        let id = 0;
        for (const combo of colorCombos) {
            const svg = this.generateJunkEmoji(combo, id);
            s += svg + '\n';
            id++;
        }
        s += '</defs>\n';
        s += '</svg>\n';
        return s;
    }
}

// To generate:
// console.log(new JunkEmojis(JUNK_EMOJI_COUNT + 1).generateAllEmoji());
// document.addEventListener("DOMContentLoaded", throwSvgsOnPage);

function throwSvgsOnPage() {
    let symbols = Array.from(document.querySelectorAll("symbol"));
    let container = document.createElement("div");
    container.id = "svg-container";

    symbols.forEach(symbol => {
        let useElement = document.createElementNS("http://www.w3.org/2000/svg", "use");
        useElement.setAttributeNS("http://www.w3.org/1999/xlink", "href", `#${symbol.id}`);

        let svgWrapper = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svgWrapper.setAttribute("viewBox", symbol.getAttribute("viewBox"));
        svgWrapper.setAttribute("width", "50");
        svgWrapper.setAttribute("height", "50");
        svgWrapper.appendChild(useElement);
        container.appendChild(svgWrapper);
    });

    document.body.appendChild(container);
}

function renderJunkEmojisText(text) {
    text = text.replaceAll(/\[junk\](\d+)\[\/junk\]/gi, (match, id) => {
        let s = `<svg class="junk" width="${EMOJI_LENGTH}" height="${EMOJI_LENGTH}">`;
        s += `<use xlink:href="#junk-${id}"></use>`;
        s += '</svg>';
        return s;
    });

    text = text.replaceAll(/\[vnoise\](\d+),(\d+)\[\/vnoise\]/gi, (match, seed, splits) => {
        return new VisualNoise().generateVisualNoise(parseInt(seed), parseInt(splits));
    });

    text = text.replaceAll(/\[svg\](\d+)\[\/svg\]/gi, (match, id) => {
        return ANCHOR_SVGS[id];
    });

    return text;
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

