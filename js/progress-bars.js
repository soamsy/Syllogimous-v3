// progress-bars.js - Simple implementation of daily and weekly progress trackers

// Constants for local storage keys
const DAILY_PROGRESS_KEY = 'sllgms-v3-daily-progress';
const WEEKLY_PROGRESS_KEY = 'sllgms-v3-weekly-progress';
const PROGRESS_SETTINGS_KEY = 'sllgms-v3-progress-settings';

// Default settings
const DEFAULT_SETTINGS = {
  dailyTarget: 30, // in minutes
  weeklyTarget: 90, // in minutes
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
  }

  // Create the daily progress bar element
  createDailyProgressBar() {
    const container = document.createElement('div');
    container.className = 'progress-container daily-progress-container';
    container.innerHTML = `
      <div class="progress-label">Daily</div>
      <div class="progress-bar-vertical">
        <div class="progress-fill"></div>
      </div>
      <div class="progress-value">0/${this.settings.dailyTarget}m</div>
    `;
    document.body.appendChild(container);

    // Position between SETTINGS and INFO
    container.style.position = 'fixed';
    container.style.left = '10px';
    container.style.top = '50%';
    container.style.transform = 'translateY(-50%)';
    container.style.zIndex = '100';
    
    this.dailyProgressElement = container.querySelector('.progress-fill');
    this.dailyProgressValueElement = container.querySelector('.progress-value');
    
    // Update display
    this.updateDailyProgressDisplay();
  }

  // Create the weekly progress bar element
  createWeeklyProgressBar() {
    const container = document.createElement('div');
    container.className = 'progress-container weekly-progress-container';
    container.innerHTML = `
      <div class="progress-label">Weekly</div>
      <div class="progress-bar-vertical">
        <div class="progress-fill"></div>
      </div>
      <div class="progress-value">0/${this.settings.weeklyTarget}m</div>
    `;
    document.body.appendChild(container);

    // Position between HISTORY and GRAPH
    container.style.position = 'fixed';
    container.style.right = '10px';
    container.style.top = '50%';
    container.style.transform = 'translateY(-50%)';
    container.style.zIndex = '100';
    
    this.weeklyProgressElement = container.querySelector('.progress-fill');
    this.weeklyProgressValueElement = container.querySelector('.progress-value');
    
    // Update display
    this.updateWeeklyProgressDisplay();
  }

  // Update the daily progress bar display
  updateDailyProgressDisplay() {
    const today = this.getDateString();
    const minutes = this.dailyProgress[today] || 0;
    const percentage = Math.min(100, (minutes / this.settings.dailyTarget) * 100);
    
    this.dailyProgressElement.style.height = `${percentage}%`;
    this.dailyProgressValueElement.textContent = `${Math.round(minutes)}/${this.settings.dailyTarget}m`;
    
    // Add color class based on progress
    this.dailyProgressElement.className = 'progress-fill';
    if (percentage >= 100) {
      this.dailyProgressElement.classList.add('complete');
    } else if (percentage >= 50) {
      this.dailyProgressElement.classList.add('halfway');
    }
  }

  // Update the weekly progress bar display
  updateWeeklyProgressDisplay() {
    const currentWeek = this.getWeekString();
    const minutes = this.weeklyProgress[currentWeek] || 0;
    const percentage = Math.min(100, (minutes / this.settings.weeklyTarget) * 100);
    
    this.weeklyProgressElement.style.height = `${percentage}%`;
    this.weeklyProgressValueElement.textContent = `${Math.round(minutes)}/${this.settings.weeklyTarget}m`;
    
    // Add color class based on progress
    this.weeklyProgressElement.className = 'progress-fill';
    if (percentage >= 100) {
      this.weeklyProgressElement.classList.add('complete');
    } else if (percentage >= 50) {
      this.weeklyProgressElement.classList.add('halfway');
    }
  }

  // Add time spent to the progress trackers
  addTimeSpent(minutes) {
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

  // Update progress tracker settings
  updateSettings(settings) {
    this.settings = { ...this.settings, ...settings };
    this.saveSettings();
    this.updateDailyProgressDisplay();
    this.updateWeeklyProgressDisplay();
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
      color: #eddb7e;
      font-family: "Espionage", sans-serif;
      text-shadow: 0 0 10px rgba(237, 219, 126, 0.7);
    }
    
    .progress-label {
      margin-bottom: 5px;
      font-size: 14px;
      letter-spacing: 1px;
    }
    
    .progress-bar-vertical {
      height: 200px;
      width: 20px;
      background: rgba(0, 0, 0, 0.5);
      border: 2px solid #3c6c64;
      border-radius: 4px;
      position: relative;
      overflow: hidden;
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
    
    .progress-value {
      margin-top: 5px;
      font-size: 12px;
      font-family: monospace;
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
      window.progressTracker.addTimeSpent(minutesSpent);
    }
  };
});