class DirectionPairChooser {
    pickTwoDistantWords(wordCoordMap, neighbors) {
        let options = Object.keys(wordCoordMap);
        let pool = [];
        const single_edges = options.filter(word => neighbors[word].length == 1);
        const single_edge_neighbors = options.filter(word => single_edges.some(edge => neighbors[edge].indexOf(word) !== -1))
        pool.push.apply(pool, single_edges);
        pool.push.apply(pool, single_edge_neighbors);

        const ranks = this._rankPairs(pool, neighbors);
        let [startWord, endWord] = pickRandomItems(ranks[0][1], 1).picked[0];
        const useMaxPossible = Object.keys(neighbors).length <= 5 || Math.random() > 0.20;
        if (ranks.length > 1 && !useMaxPossible) {
            [startWord, endWord] = pickRandomItems(ranks[1][1], 1).picked[0];
        }

        return [startWord, endWord];
    }

    _rankPairs(pool, neighbors) {
        let pairs = []
        for (let i = 0; i < pool.length; i++) {
            for (let j = i+1; j < pool.length; j++) {
                const start = pool[i];
                const end = pool[j];
                const dist = this._distanceBetween(start, end, neighbors)
                if (dist > 1) {
                    pairs.push([start, end, dist]);
                }
            }
        }

        let groups = {}
        for (const [a, b, dist] of pairs) {
            groups[dist] = groups?.[dist] ?? []
            groups[dist].push([a, b]);
        }

        return Object.entries(groups).sort(([distA, _], [distB, __]) => distB - distA);
    }

    _distanceBetween(start, end, neighbors) {
        let distance = 0;
        let layer = [start];
        let found = {[start]: true};
        while (layer.length > 0) {
            distance++;
            let newLayer = [];
            for (const node of layer) {
                for (const neighbor of neighbors[node]) {
                    if (found[neighbor]) {
                        continue;
                    }
                    if (neighbor === end) {
                        return distance;
                    }
                    newLayer.push(neighbor);
                    found[neighbor] = true;
                }
            }
            layer = newLayer;
        }
        return distance;
    }
}
