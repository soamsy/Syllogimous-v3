const TYPE_TO_OVERRIDES = {
    "distinction"  : [ "overrideDistinctionPremises", "overrideDistinctionTime" ],
    "comparison"   : [ "overrideComparisonPremises" , "overrideComparisonTime" ],
    "temporal"     : [ "overrideTemporalPremises"   , "overrideTemporalTime" ],
    "syllogism"    : [ "overrideSyllogismPremises"  , "overrideSyllogismTime" ],
    "binary"       : [ "overrideBinaryPremises"     , "overrideBinaryTime" ],
    "space-two-d"  : [ "overrideDirectionPremises"  , "overrideDirectionTime" ],
    "space-three-d": [ "overrideDirection3DPremises", "overrideDirection3DTime" ],
    "space-time"   : [ "overrideDirection4DPremises", "overrideDirection4DTime" ],
};

const progressTracker = document.getElementById("progress-tracker");

class ProgressStore {
    calculateKey(question) {
        let type = question.type;
        let plen = question.premises;
        let countdown = question.countdown;
        let key = `${type}-${plen}-${countdown}`;
        if (question.modifiers && question.modifiers.length !== 0) {
            key += `-${question.modifiers.join('-')}`
        }
        return key;
    }

    convertForDatabase(question) {
        const q = {...question};
        q.timestamp = q.answeredAt;
        q.timeElapsed = q.answeredAt - q.startedAt;
        q.premises = q.plen || q.premises.length;
        q.countdown = q.tlen || q.countdown || savedata.timer;
        q.key = this.calculateKey(q);
        delete q.plen;
        delete q.startedAt;
        delete q.answeredAt;
        delete q.wordCoordMap;
        delete q.bucket;
        delete q.buckets;
        delete q.operations;
        delete q.conclusion;
        delete q.isValid;
        delete q.answerUser;
        delete q.category;
        delete q.subresults;
        delete q.tlen;
        return q;
    }

    async storeCompletedQuestion(question) {
        const q = this.convertForDatabase(question);
        if (savedata.autoProgression) {
            await this.determineLevelChange(q);
        }
        await storeProgressData(q);
    }

    async determineLevelChange(q) {
        let trailingProgress = await getTopRRTProgress(q.key, 19);
        trailingProgress.push(q);
        if (trailingProgress.length < 20) {
            return;
        }
        const successes = trailingProgress.filter(p => p.correctness === 'right');
        const [overridePremiseSetting, overrideTimerSetting] = TYPE_TO_OVERRIDES[q.type];
        if (18 <= successes.length) {
            const minUpgrade = q.countdown - 1;
            successes.sort((a, b) => a.timeElapsed - b.timeElapsed);
            const left = successes[successes.length - 3].timeElapsed / 1000;
            const right = successes[successes.length - 2].timeElapsed / 1000;
            const percentile90ish = Math.floor((left + right) / 2) + 1;
            const newTimerValue = Math.min(minUpgrade, percentile90ish);
            if (newTimerValue <= savedata.autoProgressionGoal) {
                savedata[overridePremiseSetting] = q.premises + 1;
                savedata[overrideTimerSetting] = savedata.autoProgressionGoal + 20;
            } else {
                savedata[overrideTimerSetting] = newTimerValue;
            }
            q.didTriggerProgress = true;
        } else if (14 <= successes.length) {
            return;
        } else {
            const newTimerValue = q.countdown + (successes.length >= 10 ? 5 : 10);
            if (newTimerValue > savedata.autoProgressionGoal + 25) {
                if (q.premises > 2) {
                    savedata[overridePremiseSetting] = q.premises - 1;
                    savedata[overrideTimerSetting] = savedata.autoProgressionGoal + 20;
                } else {
                    savedata[overrideTimerSetting] = Math.min(newTimerValue, 60);
                }
            } else {
                savedata[overrideTimerSetting] = newTimerValue;
            }
            q.didTriggerProgress = true;
        }
        populateSettings();
    }

    async renderCurrentProgress(question) {
        const q = this.convertForDatabase(question);
        let trailingProgress = await getTopRRTProgress(q.key, 20);
        progressTracker.innerHTML = '';
        if (!savedata.autoProgression) {
            progressTracker.classList.remove('visible');
            return;
        } 
        progressTracker.classList.add('visible');
        trailingProgress.forEach(q => {
            const isSuccess = q.correctness === 'right';
            const span = document.createElement('span');
            span.classList.add('trailing-dot');
            span.classList.add(isSuccess ? 'success' : 'fail');
            progressTracker.appendChild(span);
        });
    }

}

const PROGRESS_STORE = new ProgressStore();
