const openDatabase = () => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('Images', 1);

        // Create the object store if it's the first time opening the database
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains('ImageStore')) {
                db.createObjectStore('ImageStore', { keyPath: 'id' });
            }
        };

        request.onsuccess = (event) => resolve(event.target.result);
        request.onerror = (event) => reject(event.target.error);
    });
};

const storeImage = async (id, image) => {
    const db = await openDatabase();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction('ImageStore', 'readwrite');
        const store = transaction.objectStore('ImageStore');

        const request = store.put({ id, value: image });

        request.onsuccess = () => resolve('Image stored successfully!');
        request.onerror = (event) => reject(event.target.error);
    });
};

const getImage = async (id) => {
    const db = await openDatabase();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction('ImageStore', 'readonly');
        const store = transaction.objectStore('ImageStore');

        const request = store.get(id);

        request.onsuccess = (event) => resolve(event.target.result?.value);
        request.onerror = (event) => reject(event.target.error);
    });
};

const deleteImage = async (id) => {
    const db = await openDatabase();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction('ImageStore', 'readwrite');
        const store = transaction.objectStore('ImageStore');

        const request = store.delete(id);

        request.onsuccess = (event) => resolve('Image deleted successfully');
        request.onerror = (event) => reject(event.target.error);
    });
};
