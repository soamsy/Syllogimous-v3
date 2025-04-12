function createWidePremises(premises, premiseMap) {
    if (!premiseMap) {
        premiseMap = {};
        for (const premise of premises) {
            premiseMap[premiseKey(premise.start, premise.end)] = premise;
        }
    }

    const graph = new Map();
    const edges = new Set();

    for (const { start, end } of premises) {
        if (!graph.has(start)) graph.set(start, []);
        if (!graph.has(end)) graph.set(end, []);
        graph.get(start).push(end);
        graph.get(end).push(start);
        edges.add(premiseKey(start, end));
    }

    if (premises.length > 20) {
        return createWidePremisesNonOptimal(premises, premiseMap, graph, edges);
    }

    const triplets = [];
    for (const [b, neighbors] of graph.entries()) {
        if (neighbors.length < 2) continue;
        for (let i = 0; i < neighbors.length; i++) {
            for (let j = i + 1; j < neighbors.length; j++) {
                const a = neighbors[i];
                const c = neighbors[j];
                const ab = premiseKey(a, b);
                const bc = premiseKey(b, c);
                triplets.push({ edges: [ab, bc], nodes: [a, b, c] });
            }
        }
    }

    let best = { used: new Set(), tripletIndices: [] };

    function backtrack(index = 0, used = new Set(), chosen = []) {
        if (index >= triplets.length) {
            if (used.size > best.used.size) {
                best = { used: new Set(used), tripletIndices: [...chosen] };
            }
            return;
        }

        const triplet = triplets[index];
        const [ab, bc] = triplet.edges;

        backtrack(index + 1, used, chosen);

        if (!used.has(ab) && !used.has(bc)) {
            used.add(ab);
            used.add(bc);
            chosen.push(index);
            backtrack(index + 1, used, chosen);
            used.delete(ab);
            used.delete(bc);
            chosen.pop();
        }
    }

    backtrack();

    const result = [];
    const usedEdges = best.used;
    for (const index of best.tripletIndices) {
        const { edges } = triplets[index];
        result.push([premiseMap[edges[0]], premiseMap[edges[1]]]);
    }

    const leftover = [...edges].filter(e => !usedEdges.has(e));
    for (const key of leftover) {
        result.push([premiseMap[key]]);
    }

    return result;
}

function createWidePremisesNonOptimal(premises, premiseMap, graph, edges) {
    const usedEdges = new Set();
    const result = [];

    for (const [b, neighbors] of graph.entries()) {
        const available = neighbors.filter(n => {
            const k = premiseKey(b, n);
            return !usedEdges.has(k);
        });

        while (available.length >= 2) {
            const a = available.pop();
            const c = available.pop();
            const ab = premiseKey(a, b);
            const bc = premiseKey(b, c);
            usedEdges.add(ab);
            usedEdges.add(bc);
            result.push([premiseMap[ab], premiseMap[bc]]);
        }
    }

    for (const edge of edges) {
        if (!usedEdges.has(edge)) {
            result.push([premiseMap[edge]]);
        }
    }

    return result;
}
