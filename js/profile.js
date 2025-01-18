const profileInput = document.getElementById('profile-input');
const profileArrow = document.getElementById('profile-arrow');
const profileList = document.getElementById('profile-list');
const profileDropdown = document.querySelector('.profile-dropdown');
const profilePlus = document.getElementById('profile-plus');
const profileShare = document.getElementById('profile-share');
const profileCopied = document.getElementById('profile-copied');

class ProfileStore {
    constructor() {
        this.profiles = [];
        this.selectedProfile = 0;
    }

    startup() {
        this.loadProfiles();
        this.loadUrl();
    }

    overrideExistingKeys(target, source) {
        for (const key of Object.keys(target)) {
            if (source.hasOwnProperty(key)) {
                target[key] = source[key];
            }
        }
    }

    loadProfiles() {
        const oldMigratedSettings = getLocalStorageObj(oldSettingsKey);

        const storedProfiles = getLocalStorageObj(profilesKey);
        if (storedProfiles && Array.isArray(storedProfiles) && storedProfiles.length > 0) {
            this.profiles = storedProfiles;
        } else {
            let starterSettings = structuredClone(defaultSavedata);
            if (oldMigratedSettings) {
                this.overrideExistingKeys(starterSettings, oldMigratedSettings);
                // Backwards compatibility: don't blow away everyone's history
                for (const movedKey of ["score", "questions", "backgroundImage", "gameAreaColor"]) {
                    if (oldMigratedSettings.hasOwnProperty(movedKey)) {
                        appState[movedKey] = oldMigratedSettings[movedKey];
                    }
                }
            }
            let defaultProfiles = [{
                name: "Default",
                id: '12345678',
                savedata: starterSettings,
            }];
            this.profiles = defaultProfiles;
        }

        if (oldMigratedSettings) {
            localStorage.removeItem(oldSettingsKey);
        }

        let profileIndex = 0
        const storedSelection = +localStorage.getItem(selectedProfileKey);
        if (0 <= storedSelection && storedSelection < this.profiles.length) {
            profileIndex = storedSelection;
        }

        this.selectProfile(profileIndex);
    }

    saveProfiles() {
        setLocalStorageObj(profilesKey, this.profiles);
        setLocalStorageObj(selectedProfileKey, this.selectedProfile);
    }

    syncProfileChange() {
        this.saveProfiles();
        savedata = this.current().savedata;
        for (const key of Object.keys(defaultSavedata)) {
            if (!savedata.hasOwnProperty(key)) {
                savedata[key] = defaultSavedata[key];
            }
        }
    }

    handleProfileChange() {
        this.syncProfileChange();
        populateSettings();
        init();
    }

    current() {
        return this.profiles[this.selectedProfile];
    }

    selectProfile(index) {
        this.selectedProfile = index;
        profileList.style.display = 'none';
        this.renderDropdown();
        this.handleProfileChange();
    }

    deleteProfile(index) {
        this.profiles.splice(index, 1);
        if (this.selectedProfile >= this.profiles.length) {
            this.selectedProfile = 0;
        }
        this.renderDropdown();
        this.handleProfileChange();
    }

    copySelectedProfile() {
        const curr = this.current();
        const newProfile = {
            savedata: structuredClone(curr.savedata),
            name: this.updateNameNumber(curr.name),
            id: this.generateShortId(),
        };

        this.profiles.push(newProfile);
        this.selectedProfile = this.profiles.length - 1;
        this.renderDropdown();
        this.handleProfileChange();
        profileInput.select();
    }

    renderDropdown() {
        profileInput.value = this.current().name;
        profileList.innerHTML = '';

        this.profiles.forEach((profile, index) => {
            const selectButton = document.createElement('div');
            selectButton.classList.add('profile-select');
            selectButton.value = index;
            selectButton.textContent = profile.name || '(no name)';
            if (this.selectedProfile === index) {
                selectButton.classList.add('highlight');
            }
            selectButton.addEventListener('click', (event) => {
                this.selectProfile(index);
            });

            if (this.profiles.length > 1) {
                const deleteButton = document.createElement('div');
                deleteButton.className = 'profile-delete';
                deleteButton.textContent = 'X';
                deleteButton.addEventListener('click', (event) => {
                    event.stopPropagation();
                    const confirmed = confirm(`Delete ${profile.name}?`);
                    if (confirmed) {
                        this.deleteProfile(index);
                    }
                });

                selectButton.appendChild(deleteButton);
            }
            profileList.appendChild(selectButton);
        });
    }

    rename(newName) {
        this.current().name = newName;
        this.current().id = this.generateShortId();
        this.renderDropdown();
    }

    updateNameNumber(name) {
        const regex = /\((\d+)\)$/;
        const match = name.match(regex);
        if (match) {
            return name.replace(regex, `(${parseInt(match[1])+1})`)
        } else {
            return name + ' (1)';
        }
    }

    generateShortId(length = 9) {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';

        for (let i = 0; i < length; i++) {
            const randomIndex = Math.floor(Math.random() * characters.length);
            result += characters[randomIndex];
        }

        return result;
    }

    generateUrl() {
        const curr = this.current();
        const savedataString = JSON.stringify(curr.savedata);
        const encodedSaveData = encodeURIComponent(savedataString);
        const encodedId = encodeURIComponent(this.generateShortId(10));
        const encodedName = encodeURIComponent(curr.name);
        const url = `${window.location.origin}${window.location.pathname}?id=${encodedId}&name=${encodedName}&savedata=${encodedSaveData}`;
        return url;
    }

    removeSearchParams() {
        const newUrl = window.location.origin + window.location.pathname;
        window.history.replaceState({}, "", newUrl);
    }

    loadUrl() {
        const url = window.location.href;
        const urlObj = new URL(url);
        this.removeSearchParams();
        const encodedId = urlObj.searchParams.get("id");
        const encodedSavedata = urlObj.searchParams.get("savedata");
        const encodedName = urlObj.searchParams.get("name");
        if (!encodedId || !encodedSavedata || !encodedName) {
            return;
        }

        function sanitizeInput(value) {
            return (value.length < 40) ? value.replace(/<[^>]*>/g, "") : '';
        }

        let id = sanitizeInput(decodeURIComponent(encodedId));
        if (!id) {
            return;
        }
        let name = sanitizeInput(decodeURIComponent(encodedName));
        if (!name) {
            name = 'Imported';
        }

        for (const profile of this.profiles) {
            if (profile.id === id) {
                return;
            }

            if (profile.name === name) {
                name = this.updateNameNumber(encodedName);
            }
        }
        const savedataString = decodeURIComponent(encodedSavedata);
        const savedataObj = JSON.parse(savedataString);
        if (!savedataObj) {
            return;
        }

        const unsafeKeys = Object.keys(savedataObj);
        for (const key in unsafeKeys) {
            if (!defaultSavedata.hasOwnProperty(key)) {
                delete savedataObj[key];
                continue;
            }

            if (typeof savedataObj[key] === "string") {
                savedataObj[key] = sanitizeInput(savedataObj[key]);
            }
        }

        const newProfile = {
            id,
            name,
            savedata: savedataObj,
        };

        this.profiles.push(newProfile);
        this.selectedProfile = this.profiles.length - 1;
        this.renderDropdown();
        this.handleProfileChange();
    }
}

const PROFILE_STORE = new ProfileStore();

profileArrow.addEventListener('click', () => {
    profileList.style.display = profileList.style.display === 'block' ? 'none' : 'block';
});

document.addEventListener('click', (event) => {
    if (!profileDropdown.contains(event.target)) {
        profileList.style.display = 'none';
    }
});

profilePlus.addEventListener('click', e => {
    PROFILE_STORE.copySelectedProfile();
});

profileShare.addEventListener('click', e => {
    const url = PROFILE_STORE.generateUrl();
    navigator.clipboard.writeText(url);
    profileCopied.classList.add('toast');
    setTimeout(() => {
        profileCopied.classList.remove('toast');
    }, 1000);
});

function debounce(func, delay) {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      func.apply(this, args);
    }, delay);
  };
}

let saveRename = debounce(() => { PROFILE_STORE.syncProfileChange(); }, 300);
profileInput.addEventListener('input', e => {
    PROFILE_STORE.rename(e.target.value);
    saveRename();
});
