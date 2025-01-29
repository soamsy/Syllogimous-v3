// Accidentally named the IndexedDB instance "Images", so I'm using this to rename it. Not sure if worth.
function databaseExists(dbName, deleteAfter=false) {
    return new Promise((resolve) => {
        const request = indexedDB.open(dbName);

        request.onsuccess = () => {
            request.result.close();
            resolve(true);
        };

        request.onupgradeneeded = () => {
            request.result.close();
            if (deleteAfter) {
                indexedDB.deleteDatabase(dbName);
            }
            resolve(false);
        };

        request.onerror = () => resolve(false);
    });
}

function exportDatabaseData(oldDbName) {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(oldDbName);

        request.onsuccess = (event) => {
            const oldDb = event.target.result;
            if (oldDb.objectStoreNames.length === 0) {
                resolve({});
                return;
            }
            const transaction = oldDb.transaction(oldDb.objectStoreNames, 'readonly');
            const data = {};

            Array.from(oldDb.objectStoreNames).forEach((storeName) => {
                const store = transaction.objectStore(storeName);
                const storeRequest = store.getAll();

                storeRequest.onsuccess = () => {
                    data[storeName] = storeRequest.result;
                };

                storeRequest.onerror = () => reject(storeRequest.error);
            });

            transaction.oncomplete = () => {
                oldDb.close();
                resolve(data);
            };

            transaction.onerror = () => reject(transaction.error);
        };

        request.onerror = () => reject(request.error);
    });
}

function importDatabaseData(newDbName, data) {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(newDbName, 2);

        request.onupgradeneeded = (event) => {
            const newDb = event.target.result;

            for (const storeName in data) {
                if (!newDb.objectStoreNames.contains(storeName)) {
                    newDb.createObjectStore(storeName, { keyPath: 'id' });
                }
            }
        };

        request.onsuccess = (event) => {
            const newDb = event.target.result;
            const transaction = newDb.transaction(newDb.objectStoreNames, 'readwrite');

            for (const storeName in data) {
                const store = transaction.objectStore(storeName);
                data[storeName].forEach((item) => {
                    store.put(item);
                });
            }

            transaction.oncomplete = () => {
                newDb.close();
                resolve();
            };

            transaction.onerror = () => reject(transaction.error);
        };

        request.onerror = () => reject(request.error);
    });
}

function deleteDatabase(dbName) {
    return new Promise((resolve, reject) => {
        const request = indexedDB.deleteDatabase(dbName);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

async function handleRename(oldDbName, newDbName) {
    const newExists = await databaseExists(newDbName);
    if (newExists) {
        return;
    }
    const oldExists = await databaseExists(oldDbName, true);
    if (!oldExists) {
        return;
    }
    const data = await exportDatabaseData(oldDbName);
    await importDatabaseData(newDbName, data);
    await deleteDatabase(oldDbName);
}

let processingRename;
async function renameDatabase(oldDbName, newDbName) {
    if (processingRename) {
        return processingRename;
    }

    processingRename = handleRename(oldDbName, newDbName)
    return processingRename;
}
