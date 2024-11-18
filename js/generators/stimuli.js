function maxStimuliAllowed() {
    let quota = 999;

    if (savedata.useNonsenseWords) {
        if (savedata.nonsenseWordLength % 2)
            quota = Math.min(quota, ((21 ** (Math.floor(savedata.nonsenseWordLength / 2) + 1)) * (5 ** Math.floor(savedata.nonsenseWordLength / 2))));
        else 
            quota = Math.min(quota, (21 ** (savedata.nonsenseWordLength / 2)) * (5 ** (savedata.nonsenseWordLength / 2)));
    }
    if (savedata.useGarbageWords) {
        quota = Math.min(quota, 20 ** (savedata.garbageWordLength))
    }
    if (savedata.useMeaningfulWords) {
        if (savedata.meaningfulWordNouns) quota = Math.min(quota, meaningfulWords.nouns.length);
        if (savedata.meaningfulWordAdjectives) quota = Math.min(quota, meaningfulWords.adjectives.length);
    }   
    if (savedata.useEmoji) quota = Math.min(quota, emoji.length);
    if (savedata.useJunkEmoji) quota = Math.min(quota, JUNK_EMOJI_COUNT);
    
    return quota - 1;
}

function createNonsenseWord() {
    const vowels = ['A', 'E', 'I', 'O', 'U'], consonants = ['B', 'C', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'N', 'P', 'Q', 'R', 'S', 'T', 'V', 'W', 'X', 'Y', 'Z'];
    for (string = ''; string.length < savedata.nonsenseWordLength;) {
        if ((string.length + 1) % 2) 
            string += consonants[Math.floor(Math.random() * 21)];
        else 
            string += vowels[Math.floor(Math.random() * 5)];

        if (string.length == savedata.nonsenseWordLength) {
            if (bannedWords.some(d => string.includes(d))) {
                string = '';
            } else {
                return string;
            }
        }
    }
}

function createGarbageWord() {
    const consonants = ['B', 'C', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'N', 'P', 'Q', 'R', 'S', 'T', 'V', 'W', 'X', 'Y', 'Z'];
    let string = '';
    while (string.length < savedata.garbageWordLength) {
        const c = consonants[Math.floor(Math.random() * 21)]
        if (string.length > 0 && string.endsWith(c)) {
            continue;
        }
        string += c;
    }
    return string;
}

function createJunkEmoji() {
    const id = Math.floor(Math.random() * JUNK_EMOJI_COUNT);
    return [id, `[junk]${id}[/junk]`];
}

function createStimuli(numberOfStimuli) {
    const quota = maxStimuliAllowed();
    
    const uniqueWords = {
        meaningful: {
            nouns: new Set(),
            adjectives: new Set()
        },
        nonsense: new Set(),
        garbage: new Set(),
        emoji: new Set(),
        junkEmoji: new Set(),
    };

    const stimulusTypes = new Set();
    
    if (savedata.useNonsenseWords) stimulusTypes.add('nonsenseWords');
    if (savedata.useGarbageWords) stimulusTypes.add('garbageWords');
    if (savedata.useMeaningfulWords) stimulusTypes.add('meaningfulWords');
    if (savedata.useEmoji) stimulusTypes.add('emoji');
    if (savedata.useJunkEmoji) { stimulusTypes.add('junkEmoji'); }
    if (!stimulusTypes.size) stimulusTypes.add(savedata.defaultStimulusType);

    const stimuliCreated = [];

    const partsOfSpeech = new Set();
    
    if (savedata.meaningfulWordNouns) partsOfSpeech.add('nouns');
    if (savedata.meaningfulWordAdjectives) partsOfSpeech.add('adjectives');
    if (!partsOfSpeech.size) partsOfSpeech.add(savedata.defaultPartOfSpeech);

    for (; numberOfStimuli > 0 && stimulusTypes.size; numberOfStimuli -= 1) {
        const randomStimulusType = Array.from(stimulusTypes)[Math.floor(Math.random() * stimulusTypes.size)];

        if (randomStimulusType == 'nonsenseWords') {
            while (true) {
                const string = createNonsenseWord();
                if (!uniqueWords.nonsense.has(string)) {
                    stimuliCreated.push(string);
                    uniqueWords.nonsense.add(string);
                    break;
                }
            }

            if (uniqueWords.nonsense.size >= quota) stimulusTypes.delete(randomStimulusType);     
        } else if (randomStimulusType == 'garbageWords') {
            while (true) {
                const string = createGarbageWord();
                if (!uniqueWords.garbage.has(string)) {
                    stimuliCreated.push(string);
                    uniqueWords.garbage.add(string);
                    break;
                }
            }

            if (uniqueWords.garbage.size >= quota) stimulusTypes.delete(randomStimulusType);     
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
            let emojiWord;

            do {
                emojiWord = emoji[Math.floor(Math.random() * emoji.length)];           
            } while (uniqueWords.emoji.has(emojiWord));
            
            stimuliCreated.push(emojiWord);
            uniqueWords.emoji.add(emojiWord);
            
            if (uniqueWords.emoji.size >= quota) stimulusTypes.delete(randomStimulusType);
        } else if (randomStimulusType == 'junkEmoji') {
            let junkId;
            let junkEmoji;
            do {
                [junkId, junkEmoji] = createJunkEmoji();
            } while (uniqueWords.junkEmoji.has(junkId))
            stimuliCreated.push(junkEmoji);
            uniqueWords.junkEmoji.add(junkId);
            if (uniqueWords.junkEmoji.size >= quota) stimulusTypes.delete(randomStimulusType);
        } else break;
    }

    return stimuliCreated
}
