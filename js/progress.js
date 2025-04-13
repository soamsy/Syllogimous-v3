const TYPE_TO_OVERRIDES = {
    "distinction"  : [ "overrideDistinctionPremises", "overrideDistinctionTime" ],
    "linear"       : [ "overrideLinearPremises"     , "overrideLinearTime" ],
    "syllogism"    : [ "overrideSyllogismPremises"  , "overrideSyllogismTime" ],
    "binary"       : [ "overrideBinaryPremises"     , "overrideBinaryTime" ],
    "space-two-d"  : [ "overrideDirectionPremises"  , "overrideDirectionTime" ],
    "space-three-d": [ "overrideDirection3DPremises", "overrideDirection3DTime" ],
    "space-time"   : [ "overrideDirection4DPremises", "overrideDirection4DTime" ],
    "anchor-space" : [ "overrideAnchorSpacePremises", "overrideAnchorSpaceTime" ],
};

const COMMON_TYPES = [
    ["linear", "distinction", "syllogism"],
]

const COMMON_TYPES_TABLE = COMMON_TYPES.reduce((acc, types) => {
    for (let i = 0; i < types.length; i++) {
        for (let j = i+1; j < types.length; j++) {
            acc[types[i]] = acc[types[i]] || [types[i]];
            acc[types[j]] = acc[types[j]] || [types[j]];
            acc[types[i]].push(types[j]);
            acc[types[j]].push(types[i]);
        }
    }
    return acc;
}, {});


const progressTracker = document.getElementById("progress-tracker");
const dailyProgressTracker = document.getElementById("daily-progress-container");
const weeklyProgressTracker = document.getElementById("weekly-progress-container");

function findSuccessCriteria() {
    return Math.max(50, Math.min(savedata.autoProgressionPercentSuccess, 100));
}

function findFailureCriteria() {
    const failureCriteria = Math.max(0, Math.min(savedata.autoProgressionPercentFail, 99));
    return Math.min(failureCriteria, findSuccessCriteria());
}

function findAutoProgressionTrailing() {
    return Math.max(5, Math.min(savedata.autoProgressionTrailing, 50));
}

class ProgressStore {
    calculateKey(question) {
        return this.calculateKeyFromCustomType(question, question.type);
    }

    calculateKeyFromCustomType(question, type) {
        let plen = question.premises;
        let countdown = question.countdown;
        let key = `${type}-${plen}-${countdown}`;
        if (question.modifiers && question.modifiers.length !== 0) {
            key += `-${question.modifiers.join('-')}`
        }
        return key;
    }

    findCommonTypes(question) {
        if (savedata.autoProgressionGrouping === 'simple') {
            return COMMON_TYPES_TABLE[question.type] || [question.type];
        } else {
            return [question.type];
        }
    }

    calculateCommonKeys(question) {
        const types = this.findCommonTypes(question);
        types.sort();
        return types.map(type => this.calculateKeyFromCustomType(question, type));
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

    success(q, trailingProgress, successes, type) {
        const [overridePremiseSetting, overrideTimerSetting] = TYPE_TO_OVERRIDES[type];
        let newTimerValue;
        if (savedata.autoProgressionChange === 'auto') {
            const minUpgrade = q.countdown - 1;
            const left = successes[successes.length - 3].timeElapsed / 1000;
            const right = successes[successes.length - 2].timeElapsed / 1000;
            const percentile90ish = Math.floor((left + right) / 2) + 1;
            newTimerValue = Math.min(minUpgrade, percentile90ish);
        } else {
            newTimerValue = q.countdown - savedata.autoProgressionTimeDrop;
        }
        newTimerValue = Math.max(1, newTimerValue);
        const averageTime = successes.map(s => s.timeElapsed / 1000).reduce((a, b) => a + b) / successes.length;
        if (averageTime <= savedata.autoProgressionGoal || newTimerValue <= savedata.autoProgressionGoal) {
            savedata[overridePremiseSetting] = q.premises + 1;
            savedata[overrideTimerSetting] = savedata.autoProgressionGoal + 15;
        } else {
            savedata[overrideTimerSetting] = newTimerValue;
        }
    }

    fail(q, trailingProgress, successes, type) {
        const [overridePremiseSetting, overrideTimerSetting] = TYPE_TO_OVERRIDES[type];
        let newTimerValue;
        if (savedata.autoProgressionChange === 'auto') {
            newTimerValue = q.countdown + 5;
        } else {
            newTimerValue = q.countdown + savedata.autoProgressionTimeBump;
        }
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
    }

    async determineLevelChange(q) {
        let trailingProgress = await getTopRRTProgress(this.calculateCommonKeys(q), findAutoProgressionTrailing() - 1);
        trailingProgress.push(q);
        trailingProgress.sort((a, b) => a.timeElapsed - b.timeElapsed);
        const successes = trailingProgress.filter(p => p.correctness === 'right');
        const commonTypes = this.findCommonTypes(question);
        if (trailingProgress.length < findAutoProgressionTrailing()) {
            const numFailures = trailingProgress.length - successes.length;
            const bestPercentagePossible = 100 * (findAutoProgressionTrailing() - numFailures) / findAutoProgressionTrailing();
            if (bestPercentagePossible <= findFailureCriteria()) {
                for (const type of commonTypes) {
                    this.fail(q, trailingProgress, successes, type);
                }
                q.didTriggerProgress = true;
            }
            populateSettings();
            return;
        }
        for (const type of commonTypes) {
            const percentageRight = 100 * successes.length / findAutoProgressionTrailing();
            if (percentageRight >= findSuccessCriteria()) {
                this.success(q, trailingProgress, successes, type);
                q.didTriggerProgress = true;
            } else if (percentageRight <= findFailureCriteria()) {
                this.fail(q, trailingProgress, successes, type);
                q.didTriggerProgress = true;
            }
        }
        populateSettings();
    }

    async renderCurrentProgress(question) {
        await this.renderAutoProgressionTrailing(question);
        await this.renderDailyProgress();
        await this.renderWeeklyProgress();
    }

    async renderAutoProgressionTrailing(question) {
        const q = this.convertForDatabase(question);
        let trailingProgress = await getTopRRTProgress(this.calculateCommonKeys(q), findAutoProgressionTrailing());
        progressTracker.innerHTML = '';
        if (!savedata.autoProgression) {
            progressTracker.classList.remove('visible');
            return;
        } 
        progressTracker.classList.add('visible');
        const width = 100 / findAutoProgressionTrailing();
        trailingProgress.forEach(q => {
            const isSuccess = q.correctness === 'right';
            const span = document.createElement('span');
            span.classList.add('trailing-dot');
            span.style.width = `${width.toFixed(2)}%`;
            span.classList.add(isSuccess ? 'success' : 'fail');
            progressTracker.appendChild(span);
        });
    }

    async renderDailyProgress() {
        if (!savedata.dailyProgressGoal) {
            dailyProgressTracker.classList.remove('visible');
            return;
        }
        dailyProgressTracker.classList.add('visible');
        const progressToday = await getTodayRRTProgress();
        const minutesSpent = progressToday.map(q => q.timeElapsed).reduce((a, b) => a + b, 0) / 1000 / 60;
        this.fillProgressTracker(dailyProgressTracker, minutesSpent, savedata.dailyProgressGoal);
    }

    async renderWeeklyProgress() {
        if (!savedata.weeklyProgressGoal) {
            weeklyProgressTracker.classList.remove('visible');
            return;
        }
        weeklyProgressTracker.classList.add('visible');
        const progressWeek = await getWeekRRTProgress();
        const minutesSpent = progressWeek.map(q => q.timeElapsed).reduce((a, b) => a + b, 0) / 1000 / 60;
        this.fillProgressTracker(weeklyProgressTracker, minutesSpent, savedata.weeklyProgressGoal);
    }

    fillProgressTracker(tracker, minutesSpent, goal) {
        const percentComplete = Math.max(0, Math.min(100 * minutesSpent / goal, 100));
        tracker.querySelector('.progress-fill').style.height = `${percentComplete}%`;
        tracker.querySelector('.progress-value').innerText = `${Math.floor(minutesSpent)} / ${goal}`;
        if (percentComplete >= 100) {
            tracker.querySelector('.progress-fill').classList.remove('halfway');
            tracker.querySelector('.progress-fill').classList.add('complete');
        } else if (percentComplete >= 50) {
            tracker.querySelector('.progress-fill').classList.add('halfway');
            tracker.querySelector('.progress-fill').classList.remove('complete');
        } else {
            tracker.querySelector('.progress-fill').classList.remove('halfway');
            tracker.querySelector('.progress-fill').classList.remove('complete');
        }
    }
}

const PROGRESS_STORE = new ProgressStore();
