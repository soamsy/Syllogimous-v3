// progress-bars.js - Simple implementation of daily and weekly progress trackers

// Constants for local storage keys
const DAILY_PROGRESS_KEY = 'sllgms-v3-daily-progress';
const WEEKLY_PROGRESS_KEY = 'sllgms-v3-weekly-progress';
const PROGRESS_SETTINGS_KEY = 'sllgms-v3-progress-settings';

// Default settings
const DEFAULT_SETTINGS = {
  dailyTarget: 35, // in minutes
  weeklyTarget: 105, // in minutes
  includeUntimed: true,
  showProgressBars: true // New setting to control progress bar visibility
};

class ProgressTracker {
  constructor() {
    this.settings = this.loadSettings();
    this.dailyProgress = this.loadDailyProgress();
    this.weeklyProgress = this.loadWeeklyProgress();
    this.setupElements();
  }

  // Load settings from localStorage or use defaults
  loadSettings() {
    const stored = localStorage.getItem(PROGRESS_SETTINGS_KEY);
    return stored ? JSON.parse(stored) : DEFAULT_SETTINGS;
  }

  // Save settings to localStorage
  saveSettings() {
    localStorage.setItem(PROGRESS_SETTINGS_KEY, JSON.stringify(this.settings));
  }

  // Load daily progress from localStorage
  loadDailyProgress() {
    const today = this.getDateString();
    const stored = localStorage.getItem(DAILY_PROGRESS_KEY);
    const progress = stored ? JSON.parse(stored) : {};

    // Initialize today's progress if not present
    if (!progress[today]) {
      progress[today] = 0;
    }

    return progress;
  }

  // Save daily progress to localStorage
  saveDailyProgress() {
    localStorage.setItem(DAILY_PROGRESS_KEY, JSON.stringify(this.dailyProgress));
  }

  // Load weekly progress from localStorage
  loadWeeklyProgress() {
    const currentWeek = this.getWeekString();
    const stored = localStorage.getItem(WEEKLY_PROGRESS_KEY);
    const progress = stored ? JSON.parse(stored) : {};

    // Initialize current week's progress if not present
    if (!progress[currentWeek]) {
      progress[currentWeek] = 0;
    }

    return progress;
  }

  // Save weekly progress to localStorage
  saveWeeklyProgress() {
    localStorage.setItem(WEEKLY_PROGRESS_KEY, JSON.stringify(this.weeklyProgress));
  }

  // Get today's date string in YYYY-MM-DD format
  getDateString() {
    const date = new Date();
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }

  // Get current week string (YYYY-WW format, Sunday as start of week)
  getWeekString() {
    const now = new Date();
    const dateString = now.toISOString().slice(0, 10);
    const date = new Date(dateString);

    // Find the previous Sunday
    const day = date.getDay();
    const diff = date.getDate() - day;
    const sunday = new Date(date);
    sunday.setDate(diff);

    // Get week number (1-53)
    const startOfYear = new Date(sunday.getFullYear(), 0, 1);
    const weekNumber = Math.ceil(((sunday - startOfYear) / 86400000 + 1) / 7);

    return `${sunday.getFullYear()}-${String(weekNumber).padStart(2, '0')}`;
  }

  // Setup DOM elements for progress bars
  setupElements() {
    this.createDailyProgressBar();
    this.createWeeklyProgressBar();
    this.updateProgressBarVisibility();
  }

  // Update the container creation functions to append to main-view instead of body
  createDailyProgressBar() {
    const container = document.createElement('div');
    container.className = 'progress-container daily-progress-container';
    container.innerHTML = `
      <div class="progress-bar-vertical">
        <div class="progress-content">
          <div class="progress-label">DAILY</div>
          <div class="progress-value">0/${this.settings.dailyTarget}</div>
        </div>
        <div class="progress-fill"></div>
      </div>
    `;
    document.querySelector('.main-view').appendChild(container);

    this.dailyProgressElement = container.querySelector('.progress-fill');
    this.dailyProgressValueElement = container.querySelector('.progress-value');
    this.dailyProgressContainer = container;

    this.updateDailyProgressDisplay();
  }

  createWeeklyProgressBar() {
    const container = document.createElement('div');
    container.className = 'progress-container weekly-progress-container';
    container.innerHTML = `
      <div class="progress-bar-vertical">
        <div class="progress-content">
          <div class="progress-label">WEEKLY</div>
          <div class="progress-value">0/${this.settings.weeklyTarget}</div>
        </div>
        <div class="progress-fill"></div>
      </div>
    `;
    document.querySelector('.main-view').appendChild(container);

    this.weeklyProgressElement = container.querySelector('.progress-fill');
    this.weeklyProgressValueElement = container.querySelector('.progress-value');
    this.weeklyProgressContainer = container;

    this.updateWeeklyProgressDisplay();
  }

  // Update the display functions to remove 'm' since space is tighter
  updateDailyProgressDisplay() {
    const today = this.getDateString();
    const minutes = this.dailyProgress[today] || 0;
    const percentage = Math.min(100, (minutes / this.settings.dailyTarget) * 100);

    this.dailyProgressElement.style.height = `${percentage}%`;
    this.dailyProgressValueElement.textContent = `${Math.round(minutes)}/${this.settings.dailyTarget}`;

    this.dailyProgressElement.className = 'progress-fill';
    if (percentage >= 100) {
      this.dailyProgressElement.classList.add('complete');
    } else if (percentage >= 50) {
      this.dailyProgressElement.classList.add('halfway');
    }
  }

  updateWeeklyProgressDisplay() {
    const currentWeek = this.getWeekString();
    const minutes = this.weeklyProgress[currentWeek] || 0;
    const percentage = Math.min(100, (minutes / this.settings.weeklyTarget) * 100);

    this.weeklyProgressElement.style.height = `${percentage}%`;
    this.weeklyProgressValueElement.textContent = `${Math.round(minutes)}/${this.settings.weeklyTarget}`;

    this.weeklyProgressElement.className = 'progress-fill';
    if (percentage >= 100) {
      this.weeklyProgressElement.classList.add('complete');
    } else if (percentage >= 50) {
      this.weeklyProgressElement.classList.add('halfway');
    }
  }

  // Add time spent to the progress trackers
  addTimeSpent(minutes, wasTimedQuestion = true) {
    // Skip if question was untimed and setting is disabled
    if (!wasTimedQuestion && !this.settings.includeUntimed) {
      return;
    }

    const today = this.getDateString();
    const currentWeek = this.getWeekString();

    // Update daily progress
    if (!this.dailyProgress[today]) {
      this.dailyProgress[today] = 0;
    }
    this.dailyProgress[today] += minutes;

    // Update weekly progress
    if (!this.weeklyProgress[currentWeek]) {
      this.weeklyProgress[currentWeek] = 0;
    }
    this.weeklyProgress[currentWeek] += minutes;

    // Save to localStorage
    this.saveDailyProgress();
    this.saveWeeklyProgress();

    // Update displays
    this.updateDailyProgressDisplay();
    this.updateWeeklyProgressDisplay();
  }

  // Add a new method to update progress bar visibility
  updateProgressBarVisibility() {
    if (this.dailyProgressContainer && this.weeklyProgressContainer) {
      const display = this.settings.showProgressBars ? 'flex' : 'none';
      this.dailyProgressContainer.style.display = display;
      this.weeklyProgressContainer.style.display = display;
    }
  }

  // Update progress tracker settings
  updateSettings(settings) {
    this.settings = { ...this.settings, ...settings };
    this.saveSettings();
    this.updateDailyProgressDisplay();
    this.updateWeeklyProgressDisplay();
    this.updateProgressBarVisibility();
  }
}

// Create CSS for progress bars
function setupProgressBarStyles() {
  const style = document.createElement('style');
  style.textContent = `
      .progress-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        position: absolute;
        top: 50%;
        transform: translateY(-50%);
        z-index: 100;
        font-family: "Espionage", sans-serif;
      }

      .main-view .progress-container.daily-progress-container {
        left: 0;
      }

      .main-view .progress-container.weekly-progress-container {
        right: 0;
      }

      .progress-bar-vertical {
        height: 400px;
        width: 24px;
        background: rgba(0, 0, 0, 0.5);
        border: 2px solid #3c6c64;
        position: relative;
        overflow: hidden;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .progress-fill {
        position: absolute;
        bottom: 0;
        width: 100%;
        background-color: #2bdef9;
        box-shadow: 0 0 10px rgba(43, 222, 249, 0.7);
        transition: height 0.5s ease;
      }

      .progress-fill.halfway {
        background-color: #4aa39a;
        box-shadow: 0 0 10px rgba(74, 163, 154, 0.7);
      }

      .progress-fill.complete {
        background-color: #eddb7e;
        box-shadow: 0 0 10px rgba(237, 219, 126, 0.7);
      }

      .progress-content {
        writing-mode: vertical-lr;
        transform: rotate(180deg);
        position: absolute;
        z-index: 1;
        height: 100%;
        width: 100%;
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
        padding: 12px 0;
        pointer-events: none;
        color: rgba(255, 255, 255, 0.8);
        text-shadow: 0 0 3px rgba(0, 0, 0, 0.7);
      }

      .progress-label {
        font-size: 14px;
        letter-spacing: 1px;
        text-transform: uppercase;
      }

      .progress-value {
        font-family: "Lato", sans-serif;
        font-size: 13px;
        white-space: nowrap;
        color: rgba(255, 255, 255, 0.9);
        text-shadow: 0 0 3px rgba(0, 0, 0, 0.5);
      }

      @media (max-width: 768px) {
        .progress-bar-vertical {
          height: 300px;
          width: 20px;
        }

        .progress-content {
          padding: 8px 0;
        }

        .progress-label {
          font-size: 12px;
        }

        .progress-value {
          font-size: 11px;
        }
      }
    `;
  document.head.appendChild(style);
}

// Initialize progress tracking when the window loads
window.addEventListener('load', () => {
  setupProgressBarStyles();
  window.progressTracker = new ProgressTracker();

  // Hook into the existing game logic to track time spent
  const originalStoreQuestionAndSave = storeQuestionAndSave;
  window.storeQuestionAndSave = function() {
    // Call original function
    originalStoreQuestionAndSave.apply(this, arguments);

    // Add time spent to progress tracker
    if (question && question.timeElapsed) {
      const minutesSpent = question.timeElapsed / (1000 * 60);
      const wasTimedQuestion = question.timerWasRunning;
      window.progressTracker.addTimeSpent(minutesSpent, wasTimedQuestion);
    }
  };
});

// Update the settings UI handler in your script
document.addEventListener('DOMContentLoaded', function() {
  const dailyTargetInput = document.getElementById('daily-target');
  const weeklyTargetInput = document.getElementById('weekly-target');
  const includeUntimedCheckbox = document.getElementById('include-untimed');
  const showProgressBarsCheckbox = document.getElementById('show-progress-bars');

  if (dailyTargetInput && weeklyTargetInput && includeUntimedCheckbox && showProgressBarsCheckbox) {
    // Load saved values when available
    const loadSettings = function() {
      const settings = localStorage.getItem(PROGRESS_SETTINGS_KEY);
      if (settings) {
        const parsed = JSON.parse(settings);
        dailyTargetInput.value = parsed.dailyTarget || 30;
        weeklyTargetInput.value = parsed.weeklyTarget || 90;
        includeUntimedCheckbox.checked = parsed.includeUntimed ?? true;
        showProgressBarsCheckbox.checked = parsed.showProgressBars ?? true;
      }
    };

    // Set up change handlers
    const updateSettings = function() {
      if (window.progressTracker) {
        window.progressTracker.updateSettings({
          dailyTarget: parseInt(dailyTargetInput.value) || 30,
          weeklyTarget: parseInt(weeklyTargetInput.value) || 90,
          includeUntimed: includeUntimedCheckbox.checked,
          showProgressBars: showProgressBarsCheckbox.checked
        });
      }
    };

    dailyTargetInput.addEventListener('change', updateSettings);
    weeklyTargetInput.addEventListener('change', updateSettings);
    includeUntimedCheckbox.addEventListener('change', updateSettings);
    showProgressBarsCheckbox.addEventListener('change', updateSettings);

    loadSettings();

    const checkTracker = setInterval(function() {
      if (window.progressTracker) {
        updateSettings();
        clearInterval(checkTracker);
      }
    }, 500);
  }
});