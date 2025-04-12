function createPremiseHTML(premise, allowReversal=true) {
    if (typeof premise === 'string') {
        return premise;
    }
    if (savedata.widePremises && Array.isArray(premise)) {
        return createWidePremiseHTML(premise, allowReversal);
    } else {
        return createBasicPremiseHTML(premise, allowReversal);
    }
}

function createBasicPremiseHTML(premise, allowReversal=true) {
    const relation = savedata.minimalMode ? premise.relationMinimal : premise.relation;
    const reverse = savedata.minimalMode ? premise.reverseMinimal : premise.reverse;
    let ps;
    if (!allowReversal || coinFlip()) {
      ps = [
      `<span class="subject">${premise.start}</span> <span class="relation">${relation}</span> <span class="subject">${premise.end}</span>`,
      `<span class="subject">${premise.start}</span> <span class="relation"><span class="is-negated">${reverse}</span></span> <span class="subject">${premise.end}</span>`,
      ];
    } else {
      ps = [
      `<span class="subject">${premise.end}</span> <span class="relation">${reverse}</span> <span class="subject">${premise.start}</span>`,
      `<span class="subject">${premise.end}</span> <span class="relation"><span class="is-negated">${relation}</span></span> <span class="subject">${premise.start}</span>`,
      ];
    }
    return pickNegatable(ps);
}

function createWidePremiseHTML(premise, allowReversal=true) {
    if (premise.length === 1) {
        return createBasicPremiseHTML(premise[0], allowReversal);
    }

    let [left, right] = premise;
    if (right.end === left.start) {
        [left, right] = [right, left];
    }
    const leftRelation = savedata.minimalMode ? left.relationMinimal : left.relation;
    const leftReverse = savedata.minimalMode ? left.reverseMinimal : left.reverse;
    const rightRelation = savedata.minimalMode ? right.relationMinimal : right.relation;
    const rightReverse = savedata.minimalMode ? right.reverseMinimal : right.reverse;
    let a, b, c, ab, bc, abRev, bcRev;
    if (left.end === right.start) {
        a = left.start;
        b = left.end;
        c = right.end;
        ab = leftRelation;
        abRev = leftReverse;
        bc = rightRelation;
        bcRev = rightReverse;
    } else if (left.start === right.start) {
        a = left.end;
        b = left.start;
        c = right.end;
        ab = allowReversal ? leftReverse : leftRelation;
        abRev = allowReversal ? leftRelation : leftReverse;
        bc = rightRelation;
        bcRev = rightReverse;
    } else {
        a = left.start;
        b = left.end;
        c = right.start;
        ab = leftRelation;
        abRev = leftReverse;
        bc = allowReversal ? rightReverse : rightRelation;
        bcRev = allowReversal ? rightRelation : rightReverse;
    }

    if (savedata.enableNegation && coinFlip()) {
        ab, abRev = `<span class="is-negated">${abRev}</span>`, `<span class="is-negated">${ab}</span>`;
    }
    if (savedata.enableNegation && coinFlip()) {
        bc, bcRev = `<span class="is-negated">${bcRev}</span>`, `<span class="is-negated">${bc}</span>`;
    }

    if (!allowReversal || coinFlip()) {
        return `<span class="subject">${a}</span> <span class="relation">${ab}</span> <span class="subject">${b}</span> <span class="relation">${bc}</span> <span class="subject">${c}</span>`;
    } else {
        return `<span class="subject">${c}</span> <span class="relation">${bcRev}</span> <span class="subject">${b}</span> <span class="relation">${abRev}</span> <span class="subject">${a}</span>`;
    }
}
