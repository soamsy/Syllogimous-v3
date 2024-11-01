function createQuota() {
    let quota = Infinity;

    if (savedata.useNonsenseWords) {
        if (savedata.nonsenseWordLength % 2) quota = Math.min(quota, ((21 ** (Math.floor(savedata.nonsenseWordLength / 2) + 1)) * (5 ** Math.floor(savedata.nonsenseWordLength / 2))));
        else quota = Math.min(quota, (21 ** (savedata.nonsenseWordLength / 2)) * (5 ** (savedata.nonsenseWordLength / 2)));
    }
    if (savedata.useMeaningfulWords) {
        if (savedata.meaningfulWordNouns) quota = Math.min(quota, meaningfulWords.nouns.length);
        if (savedata.meaningfulWordAdjectives) quota = Math.min(quota, meaningfulWords.adjectives.length);
    }   
    if (savedata.useEmoji) quota = Math.min(quota, emoji.length);
    
    return quota;
}

function createStimuli(numberOfStimuli) {
    const quota = createQuota();
    
    const uniqueWords = {
        meaningful: {
            nouns: new Set(),
            adjectives: new Set()
        },
        nonsense: new Set()
    }
    const uniqueEmoji = new Set();

    const stimulusTypes = new Set();
    
    if (savedata.useNonsenseWords) stimulusTypes.add('nonsenseWords');
    if (savedata.useMeaningfulWords) stimulusTypes.add('meaningfulWords');
    if (savedata.useEmoji) stimulusTypes.add('emoji');
    if (!stimulusTypes.size) stimulusTypes.add(savedata.defaultStimulusType);

    const stimuliCreated = [];

    const partsOfSpeech = new Set();
    
    if (savedata.meaningfulWordNouns) partsOfSpeech.add('nouns');
    if (savedata.meaningfulWordAdjectives) partsOfSpeech.add('adjectives');
    if (!partsOfSpeech.size) partsOfSpeech.add(savedata.defaultPartOfSpeech);

    for (; numberOfStimuli > 0 && stimulusTypes.size; numberOfStimuli -= 1) {
        const randomStimulusType = Array.from(stimulusTypes)[Math.floor(Math.random() * stimulusTypes.size)];

        if (randomStimulusType == 'nonsenseWords') {      
            const vowels = ['A', 'E', 'I', 'O', 'U'], consonants = ['B', 'C', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'N', 'P', 'Q', 'R', 'S', 'T', 'V', 'W', 'X', 'Y', 'Z'];
            
            for (string = ''; string.length < savedata.nonsenseWordLength;) {
                if ((string.length + 1) % 2) string += consonants[Math.floor(Math.random() * 21)];
                else string += vowels[Math.floor(Math.random() * 5)];
        
                if (string.length == savedata.nonsenseWordLength) {
                    if (uniqueWords.nonsense.has(string)) string = '';
                    else {
                        stimuliCreated.push(string);
                        uniqueWords.nonsense.add(string);
                    }
                }
            }

            if (uniqueWords.nonsense.size >= quota) stimulusTypes.delete(randomStimulusType);     
        } else if (randomStimulusType == 'meaningfulWords') {
            const randomPartOfSpeech = Array.from(partsOfSpeech)[Math.floor(Math.random() * partsOfSpeech.size)]

            if (randomPartOfSpeech) {
                let randomMeaningfulWord;

                do {
                    if (uniqueWords.meaningful[randomPartOfSpeech].size >= meaningfulWords[randomPartOfSpeech].length) uniqueWords.meaningful[randomPartOfSpeech].nouns = new Set();
    
                    randomMeaningfulWord = meaningfulWords[randomPartOfSpeech][Math.floor(Math.random() * meaningfulWords[randomPartOfSpeech].length)];         
                } while (uniqueWords.meaningful[randomPartOfSpeech].has(randomMeaningfulWord));
    
                stimuliCreated.push(randomMeaningfulWord);
                uniqueWords.meaningful[randomPartOfSpeech].add(randomMeaningfulWord);
            } else stimulusTypes.delete(randomStimulusType);

            if (uniqueWords.meaningful[randomPartOfSpeech].size >= quota) partsOfSpeech.delete(randomPartOfSpeech);
        } else if (randomStimulusType == 'emoji') {
            let randomEmoji;

            do {
                if (uniqueEmoji.size >= emoji.length) uniqueEmoji = new Set();
                
                randomEmoji = emoji[Math.floor(Math.random() * emoji.length)];           
            } while (uniqueEmoji.has(randomEmoji));
            
            stimuliCreated.push(randomEmoji);
            uniqueEmoji.add(randomEmoji);
            
            if (uniqueEmoji.size >= quota) stimulusTypes.delete(randomStimulusType);
        } else break;
    }

    return stimuliCreated
}
