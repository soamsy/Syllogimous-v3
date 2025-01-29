const openDatabase = () => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('SyllDB', 3);

        // Create the object store if it's the first time opening the database
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains('ImageStore')) {
                db.createObjectStore('ImageStore', { keyPath: 'id' });
            }

            if (!db.objectStoreNames.contains('RRTHistory')) {
                const progressStore = db.createObjectStore('RRTHistory', { keyPath: 'id', autoIncrement: true });
                progressStore.createIndex('orderIndex', ['key', 'timestamp'], { unique: false });
            }
        };

        request.onsuccess = (event) => resolve(event.target.result);
        request.onerror = (event) => reject(event.target.error);
    });
};

const initDB = async () => {
    await renameDatabase("Images", "SyllDB");
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

const getImage = async (id) => {
    const db = await initDB();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction('ImageStore', 'readonly');
        const store = transaction.objectStore('ImageStore');

        const request = store.get(id);

        request.onsuccess = (event) => resolve(event.target.result?.value);
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

const getTopRRTProgress = async (key, count) => {
    const db = await initDB();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction('RRTHistory', 'readonly');
        const store = transaction.objectStore('RRTHistory');
        const index = store.index('orderIndex');

        const keyRange = IDBKeyRange.bound(
            [key, 0],
            [key, Infinity]
        );

        const request = index.openCursor(keyRange, 'prev');

        const results = [];
        request.onsuccess = (event) => {
            const cursor = event.target.result;
            if (cursor) {
                results.push(cursor.value);
                if (results.length >= count || cursor.value.didTriggerProgress === true) {
                    resolve(results);
                } else {
                    cursor.continue();
                }
            } else {
                resolve(results);
            }
        };

        request.onerror = (event) => reject(event.target.error);
    });
};
