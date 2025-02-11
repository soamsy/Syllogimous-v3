class SettingsMigration {
    update(settings) {
        if (settings.version === 1) {
            this.upgradeToV2(settings);
        }

        for (const key of Object.keys(defaultSavedata)) {
            if (!settings.hasOwnProperty(key)) {
                settings[key] = defaultSavedata[key];
            }
        }
    }

    // Do not remove. Old share links still use V1, so getting rid of this will break those links
    upgradeToV2(settings) {
        if (settings.hasOwnProperty('enableComparison') || settings.hasOwnProperty('enableTemporal')) {
            settings.enableLinear = settings.enableComparison || settings.enableTemporal;
            let wording = [];
            if (settings.enableComparison) {
                wording.push('comparison');
            }
            if (settings.enableTemporal) {
                wording.push('temporal');
            }
            if (wording.length === 0) {
                wording.push('leftright');
            }
            settings.linearWording = wording.join(',');
            delete settings.enableComparison;
            delete settings.enableTemporal;
        }

        if (settings.hasOwnProperty('overrideComparisonPremises') || settings.hasOwnProperty('overrideTemporalPremises')) {
            settings.overrideLinearPremises = settings.overrideComparisonPremises ?? settings.overrideTemporalPremises;
            delete settings.overrideComparisonPremises;
            delete settings.overrideTemporalPremises;
        }

        if (settings.hasOwnProperty('overrideComparisonTime') || settings.hasOwnProperty('overrideTemporalTime')) {
            settings.overrideLinearTime = settings.overrideComparisonTime ?? settings.overrideTemporalTime;
            delete settings.overrideComparisonTime;
            delete settings.overrideTemporalTime;
        }

        if (settings.hasOwnProperty('enableBacktrackingComparison') || settings.hasOwnProperty('enableBacktrackingTemporal')) {
            settings.enableBacktrackingLinear = settings.enableBacktrackingComparison ?? settings.enableBacktrackingTemporal;
            delete settings.enableBacktrackingComparison;
            delete settings.enableBacktrackingTemporal;
        }
        settings.version = 2;
    }

    updateRRTHistory(progressStore) {
        const cursorRequest = progressStore.openCursor();
        cursorRequest.onsuccess = (event) => {
            const cursor = event.target.result;
            if (cursor) {
                const entry = cursor.value;

                if (entry.type === 'comparison') {
                    entry.type = 'linear';
                    entry.key = entry.key.replace('comparison', 'linear');
                    cursor.update(entry);
                }

                if (entry.type === 'temporal') {
                    entry.type = 'linear';
                    entry.key = entry.key.replace('temporal', 'linear');
                    cursor.update(entry);
                }
                cursor.continue();
            }
        };

        cursorRequest.onerror = (event) => {
            console.error('Error iterating through RRTHistory:', event.target.error);
        };
    }
}
