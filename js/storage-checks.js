class StorageChecks {
  supportsChecks() {
    return navigator && navigator.storage && navigator.storage.persisted && navigator.storage.estimate && navigator.storage.persist;
  }

  async persist() {
    const alreadyPersistent = await navigator.storage.persisted();
    if (alreadyPersistent) {
      return true;
    }

    const success = await navigator.storage.persist();
    return success;
  }

  async display() {
    if (!this.supportsChecks) {
      return;
    }
    const canPersist = await this.persist();
    const persistenceElement = document.getElementById('storage-persistence');
    if (canPersist) {
      persistenceElement.innerText = 'Storage persistence supported by browser. Storage will not be cleared except by explicit user action.';
    } else {
      persistenceElement.innerText = 'Storage persistence not supported by browser. Storage may be cleared under storage pressure.';
    }

    const estimate = await navigator.storage.estimate();
    const usage_mb = estimate.usage / 1_000_000;
    const usage_display = `${usage_mb.toFixed(2)} MB`;
    const quota_mb = estimate.quota / 1_000_000;
    const quota_display = quota_mb > 2000 ? `${(quota_mb / 1000).toFixed(1)} GB` : `${quota_mb.toFixed(2)} MB`;
    document.getElementById('storage-usage').innerText = usage_display;
    document.getElementById('storage-quota').innerText = quota_display;
  }
}

new StorageChecks().display();
