const openDatabase = () => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('SyllDB', 5);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains('ImageStore')) {
                db.createObjectStore('ImageStore', { keyPath: 'id' });
            }

            if (!db.objectStoreNames.contains('RRTHistory')) {
                const progressStore = db.createObjectStore('RRTHistory', { keyPath: 'id', autoIncrement: true });
                progressStore.createIndex('orderIndex', ['key', 'timestamp'], { unique: false });
            }

            const progressStore = event.target.transaction.objectStore('RRTHistory');
            if (!progressStore.indexNames.contains('timestampIndex')) {
                progressStore.createIndex('timestampIndex', 'timestamp', { unique: false });
            }

            new SettingsMigration().updateRRTHistory(progressStore);
        };

        request.onsuccess = (event) => resolve(event.target.result);
        request.onerror = (event) => reject(event.target.error);
    });
};

const initDB = async () => {
    return await openDatabase();
};

const storeImage = async (id, image) => {
    const db = await initDB();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction('ImageStore', 'readwrite');
        const store = transaction.objectStore('ImageStore');

        const request = store.put({ id, value: image });

        request.onsuccess = () => resolve('Image stored successfully!');
        request.onerror = (event) => reject(event.target.error);
    });
};

// js/db.js (Modified - Only the `getImage` function needs change)

const getImage = async (id) => {
    const db = await initDB();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction('ImageStore', 'readonly');
        const store = transaction.objectStore('ImageStore');

        const request = store.get(id);

        request.onsuccess = (event) => {
            // The key change here is in onsuccess
            const result = event.target.result;
            if (result && result.value) {
                // Return the base64 string directly; don't create a blob here
                resolve(result.value);
            } else {
                resolve(null); // Resolve with null if no image is found
            }
        };

        request.onerror = (event) => reject(event.target.error);
    });
};

const deleteImage = async (id) => {
    const db = await initDB();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction('ImageStore', 'readwrite');
        const store = transaction.objectStore('ImageStore');

        const request = store.delete(id);

        request.onsuccess = (event) => resolve('Image deleted successfully');
        request.onerror = (event) => reject(event.target.error);
    });
};

const storeProgressData = async (progressData) => {
    const db = await initDB();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction('RRTHistory', 'readwrite');
        const store = transaction.objectStore('RRTHistory');

        const request = store.add(progressData);

        request.onsuccess = () => resolve('RRTHistory stored successfully!');
        request.onerror = (event) => reject(event.target.error);
    });
};

const getTopRRTProgress = async (keys, count = 20) => {
    const db = await initDB();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction('RRTHistory', 'readonly');
        const store = transaction.objectStore('RRTHistory');
        const index = store.index('orderIndex');

        let results = [];
        let pendingKeys = keys.length;
        let maxResults = count * keys.length;

        keys.forEach(key => {
            const keyRange = IDBKeyRange.bound([key, 0], [key, Infinity]);
            const request = index.openCursor(keyRange, 'prev');

            request.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor) {
                    results.push(cursor.value);

                    if (results.length >= maxResults) {
                        pendingKeys = 0;
                        finalizeResults();
                        return;
                    }

                    cursor.continue();
                } else {
                    pendingKeys--;
                    if (pendingKeys === 0) finalizeResults();
                }
            };

            request.onerror = (event) => reject(event.target.error);
        });

        function finalizeResults() {
            results.sort((a, b) => b.timestamp - a.timestamp);

            let filteredResults = [];
            for (const result of results) {
                if (filteredResults.length >= count || result.didTriggerProgress === true) {
                    break;
                }
                filteredResults.push(result);
            }
            resolve(filteredResults);
        }
    });
};

const getAllRRTProgress = async () => {
    const db = await initDB();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction('RRTHistory', 'readonly');
        const store = transaction.objectStore('RRTHistory');
        const getAll = store.getAll();
        getAll.onsuccess = () => resolve(getAll.result);
        getAll.onerror = () => reject(getAll.error);
    });

    request.onerror = () => reject(request.error);
}

const getTodayRRTProgress = async () => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 4, 0, 0);
    if (now.getHours() < 4) {
        todayStart.setDate(todayStart.getDate() - 1);
    }

    return await getRRTProgressFrom(todayStart.getTime());
};

const getWeekRRTProgress = async () => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() + mondayOffset, 4, 0, 0);
    if (now.getDay() === 1 && now.getHours() < 4) {
        weekStart.setDate(weekStart.getDate() - 7);
    }

    return getRRTProgressFrom(weekStart.getTime());
};

const getRRTProgressFrom = async (startTime) => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction('RRTHistory', 'readonly');
        const store = transaction.objectStore('RRTHistory');
        const index = store.index('timestampIndex');
        const keyRange = IDBKeyRange.lowerBound(startTime);

        const results = [];
        const request = index.openCursor(keyRange, 'next');

        request.onsuccess = (event) => {
            const cursor = event.target.result;
            if (cursor) {
                results.push(cursor.value);
                cursor.continue();
            } else {
                resolve(results);
            }
        };
        request.onerror = (event) => reject(event.target.error);
    });
}
