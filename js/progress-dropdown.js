const progressionSettingsButton = document.getElementById('progression-settings-button');
const progressionDropdown = document.getElementById('progression-dropdown');

progressionSettingsButton.addEventListener('click', (event) => {
  event.preventDefault();
  progressionDropdown.style.display = progressionDropdown.style.display === 'flex' ? 'none' : 'flex';
});

document.addEventListener('click', (event) => {
  if (!progressionDropdown.contains(event.target) && !progressionSettingsButton.contains(event.target)) {
    progressionDropdown.style.display = 'none';
  }
});
