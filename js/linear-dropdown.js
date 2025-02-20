const linearSettingsButton = document.getElementById('linear-settings-button');
const linearDropdown = document.getElementById('linear-dropdown');
const linearLeftRightCheckbox = document.getElementById('p-leftright');
const linearTopUnderCheckbox = document.getElementById('p-topunder');
const linearComparisonCheckbox = document.getElementById('p-comparison');
const linearTemporalCheckbox = document.getElementById('p-temporal');

linearSettingsButton.addEventListener('click', (event) => {
  event.preventDefault();
  linearDropdown.style.display = linearDropdown.style.display === 'flex' ? 'none' : 'flex';
});

document.addEventListener('click', (event) => {
  if (!linearDropdown.contains(event.target) && !linearSettingsButton.contains(event.target)) {
    linearDropdown.style.display = 'none';
  }
});

function populateLinearDropdown() {
  const wording = savedata.linearWording;
  let options = wording.split(',');
  linearLeftRightCheckbox.checked = options.includes('leftright');
  linearTopUnderCheckbox.checked = options.includes('topunder');
  linearComparisonCheckbox.checked = options.includes('comparison');
  linearTemporalCheckbox.checked = options.includes('temporal');
}

function updateLinearWording(option, isSelected) {
  let options = savedata.linearWording.split(',').filter(x => x && x.length > 0);
  if (isSelected && !options.includes(option)) {
    options.push(option);
  } else if (!isSelected) {
    options = options.filter(o => o !== option);
  }

  savedata.linearWording = options.join(',');
  save();
  init();
}

linearLeftRightCheckbox.addEventListener('click', e => updateLinearWording('leftright', e.target.checked));
linearTopUnderCheckbox.addEventListener('click', e => updateLinearWording('topunder', e.target.checked));
linearComparisonCheckbox.addEventListener('click', e => updateLinearWording('comparison', e.target.checked));
linearTemporalCheckbox.addEventListener('click', e => updateLinearWording('temporal', e.target.checked));
