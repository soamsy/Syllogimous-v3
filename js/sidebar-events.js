const sylSettingsCheckbox = document.getElementById('offcanvas-settings');
const sylSettingsSidebar = document.getElementById('sidebar-settings');
const sylHistoryCheckbox = document.getElementById('offcanvas-history');
const sylHistorySidebar = document.getElementById('sidebar-history');
const sylCreditsCheckbox = document.getElementById('offcanvas-credits');
const sylCreditsSidebar = document.getElementById('sidebar-credits');

document.addEventListener('click', (event) => {
  if (!sylSettingsCheckbox.contains(event.target) && !sylSettingsSidebar.contains(event.target)) {
    sylSettingsCheckbox.checked = false;
  }
  if (!sylHistoryCheckbox.contains(event.target) && !sylHistorySidebar.contains(event.target)) {
    sylHistoryCheckbox.checked = false;
  }
  if (!sylCreditsCheckbox.contains(event.target) && !sylCreditsSidebar.contains(event.target)) {
    sylCreditsCheckbox.checked = false;
  }
});
