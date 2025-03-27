class ProgressGraph {
    constructor() {
        this.scoreChart = null;
        this.countChart = null;
        this.timeChart = null;
        this.colorIndex = 0;
        this.colorPalette = [
            '#00a8e8', // Cyan
            '#0077b6', // Deep Blue
            '#264653', // Dark Teal
            '#8ecae6', // Sky Blue
            '#023e8a', // Blue
            '#f4a261', // Orange
            '#e63946', // Red
            '#2a9d8f', // Teal
            '#6a4c93', // Violet
            '#ffb703'  // Amber
        ];
        this.startDate = null;
        this.endDate = null;
        this.excludedTypes = new Set();
        this.chartTypes = {
            'score': 'line',
            'count': 'line',
            'time': 'bar'
        };
        this.allQuestionTypes = new Set();
    }

    findDay(question) {
        const adjustedTimestamp = question.timestamp - (4 * 60 * 60 * 1000);
        const date = new Date(adjustedTimestamp);

        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');

        return `${year}-${month}-${day}`;
    }

    calculateTypeData(data, groupByPremises) {
        const groupedByType = {};

        data.forEach((question) => {
            const day = this.findDay(question);

            // Apply date range filter if set
            if (this.startDate || this.endDate) {
                const questionDate = new Date(question.timestamp);
                if (this.startDate && questionDate < this.startDate) return;
                if (this.endDate && questionDate > this.endDate) return;
            }

            const isRight = question.correctness === 'right';
            if (groupByPremises && !isRight) {
                return;
            }
            const timeElapsed = question.timeElapsed;

            let type = question.type + (groupByPremises ? (' p' + question.premises) : '');
            if (question.modifiers && question.modifiers.length > 0) {
                type += ` ${question.modifiers.join('-')}`;
            }
            if (question.tags && question.tags.length > 0) {
                type += ` ${question.tags.join('-')}`;
            }

            // Store all question types for filters
            this.allQuestionTypes.add(type);

            // Skip excluded types
            if (this.excludedTypes.has(type)) {
                return;
            }

            if (!groupedByType[type]) {
                groupedByType[type] = {};
            }

            if (!groupedByType[type][day]) {
                groupedByType[type][day] = { totalTime: 0, count: 0 };
            }

            groupedByType[type][day].totalTime += timeElapsed;
            groupedByType[type][day].count += 1;
        });

        const result = {};
        for (const type in groupedByType) {
            result[type] = [];
            for (const day in groupedByType[type]) {
                const count = groupedByType[type][day].count;
                const averageTime = groupedByType[type][day].totalTime / count;
                result[type].push({ day, count, averageTime: averageTime / 1000 });
            }
            result[type].sort((a, b) => new Date(a.day) - new Date(b.day));
        }

        return result;
    }

    calculateTimeSpentData(data) {
        const groupedByDay = {};

        data.forEach((question) => {
            // Apply date range filter if set
            if (this.startDate || this.endDate) {
                const questionDate = new Date(question.timestamp);
                if (this.startDate && questionDate < this.startDate) return;
                if (this.endDate && questionDate > this.endDate) return;
            }

            const day = this.findDay(question);
            if (!groupedByDay[day]) {
                groupedByDay[day] = 0;
            }

            groupedByDay[day] += question.timeElapsed / 1000 / 60;
        });

        const result = [];
        for (const day in groupedByDay) {
            result.push({ day, time: groupedByDay[day]});
        }

        result.sort((a, b) => new Date(a.day) - new Date(b.day));
        return result;
    }

    async plotData() {
        if (this.scoreChart) {
            this.scoreChart.destroy();
            this.scoreChart = null;
        }
        if (this.countChart) {
            this.countChart.destroy();
            this.countChart = null;
        }
        if (this.timeChart) {
            this.timeChart.destroy();
            this.timeChart = null;
        }
        await this.plotScore();
    }

    getNextColor() {
        const color = this.colorPalette[this.colorIndex % this.colorPalette.length];
        this.colorIndex++;
        return color;
    }

    resetColorIndex() {
        this.colorIndex = 0;
    }

    async plotScore() {
        let data = await getAllRRTProgress();
        data = data.filter(q => q.timeElapsed >= 1500);
        if (!data || data.length === 0) {
            // Show a message in each chart area that no data is available
            this.showNoDataMessage();
            return;
        }

        // Clear previous type list
        this.allQuestionTypes.clear();

        this.resetColorIndex();
        const typeData = this.calculateTypeData(data, false);
        const premiseLevelData = this.calculateTypeData(data, true);

        // Update the question type filter panel
        this.updateTypeFilterPanel();

        const labels = Object.values(typeData)[0]?.map((entry) => entry.day) || [];
        const premiseLevelLabels = Object.values(premiseLevelData)[0]?.map((entry) => entry.day) || [];

        if (Object.keys(premiseLevelData).length === 0) {
            // Show message that there's no data after filtering
            this.showFilteredNoDataMessage();
            return;
        }

        this.resetColorIndex();
        const scoreDatasets = Object.keys(premiseLevelData).map((type) => {
            const color = this.getNextColor();
            return {
                label: type,
                data: premiseLevelData[type].map((entry) => ({ x: entry.day, y: entry.averageTime })),
                borderColor: color,
                backgroundColor: this.getBackgroundColor(color, this.chartTypes['score']),
                fill: false,
                // For scatter chart
                pointRadius: this.chartTypes['score'] === 'scatter' ? 6 : undefined,
                pointHoverRadius: this.chartTypes['score'] === 'scatter' ? 8 : undefined,
            };
        });

        this.resetColorIndex();
        const countDatasets = Object.keys(typeData).map((type) => {
            const color = this.getNextColor();
            return {
                label: type,
                data: typeData[type].map((entry) => ({ x: entry.day, y: entry.count })),
                borderColor: color,
                backgroundColor: this.getBackgroundColor(color, this.chartTypes['count']),
                // For scatter chart
                pointRadius: this.chartTypes['count'] === 'scatter' ? 6 : undefined,
                pointHoverRadius: this.chartTypes['count'] === 'scatter' ? 8 : undefined,
            };
        });

        this.resetColorIndex();
        const timeColor = this.getNextColor();
        const timeData = this.calculateTimeSpentData(data);
        const timeDatasets = [{
            label: 'Time Spent (Minutes)',
            data: timeData.map(entry => ({ x: entry.day, y: entry.time })),
            borderColor: timeColor,
            backgroundColor: this.getBackgroundColor(timeColor, this.chartTypes['time']),
            // For scatter chart
            pointRadius: this.chartTypes['time'] === 'scatter' ? 6 : undefined,
            pointHoverRadius: this.chartTypes['time'] === 'scatter' ? 8 : undefined,
        }];

        const scoreCtx = canvasScore.getContext('2d');
        this.scoreChart = this.createChart(scoreCtx, premiseLevelLabels, scoreDatasets, this.chartTypes['score'], 'Average Correct Time (s)', 1, 2, 's');
        const countCtx = canvasCount.getContext('2d');
        this.countChart = this.createChart(countCtx, labels, countDatasets, this.chartTypes['count'], 'Count', 0, 0);
        const timeCtx = canvasTime.getContext('2d');
        this.timeChart = this.createChart(timeCtx, labels, timeDatasets, this.chartTypes['time'], 'Time Spent');
    }

    showNoDataMessage() {
        const message = 'No data available. Complete some timed exercises to see progress.';
        this.displayMessageOnCanvas(canvasScore, message);
        this.displayMessageOnCanvas(canvasCount, message);
        this.displayMessageOnCanvas(canvasTime, message);
    }

    showFilteredNoDataMessage() {
        const message = 'No data available with current filters. Try adjusting your filters.';
        this.displayMessageOnCanvas(canvasScore, message);
        this.displayMessageOnCanvas(canvasCount, message);
        this.displayMessageOnCanvas(canvasTime, message);
    }

    displayMessageOnCanvas(canvas, message) {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#aaa';
        ctx.font = '14px "Espionage", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(message, canvas.width / 2, canvas.height / 2);
    }

    updateTypeFilterPanel() {
        const typeFilterContainer = document.getElementById('type-filter-container');
        if (!typeFilterContainer) return;

        typeFilterContainer.innerHTML = '';

        // Skip if no question types are found
        if (this.allQuestionTypes.size === 0) {
            const emptyMessage = document.createElement('div');
            emptyMessage.className = 'type-filter-empty';
            emptyMessage.textContent = 'No question types found';
            typeFilterContainer.appendChild(emptyMessage);
            return;
        }

        // Add select/deselect all controls
        const filterControls = document.createElement('div');
        filterControls.className = 'type-filter-controls';

        const selectAllBtn = document.createElement('button');
        selectAllBtn.className = 'type-filter-btn';
        selectAllBtn.textContent = 'Select All';
        selectAllBtn.addEventListener('click', () => {
            this.excludedTypes.clear();
            this.updateTypeFilterPanel();
            this.plotData();
        });

        const deselectAllBtn = document.createElement('button');
        deselectAllBtn.className = 'type-filter-btn';
        deselectAllBtn.textContent = 'Deselect All';
        deselectAllBtn.addEventListener('click', () => {
            this.allQuestionTypes.forEach(type => {
                this.excludedTypes.add(type);
            });
            this.updateTypeFilterPanel();
            this.plotData();
        });

        filterControls.appendChild(selectAllBtn);
        filterControls.appendChild(deselectAllBtn);
        typeFilterContainer.appendChild(filterControls);

        // Create filter items for all found question types
        this.allQuestionTypes.forEach(type => {
            const filterItem = document.createElement('div');
            filterItem.className = 'type-filter-item';

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = `filter-${type.replace(/[^a-zA-Z0-9]/g, '-')}`;
            checkbox.checked = !this.excludedTypes.has(type);
            checkbox.addEventListener('change', () => {
                if (checkbox.checked) {
                    this.excludedTypes.delete(type);
                } else {
                    this.excludedTypes.add(type);
                }
                this.plotData();
            });

            const label = document.createElement('label');
            label.htmlFor = checkbox.id;
            label.textContent = type;

            filterItem.appendChild(checkbox);
            filterItem.appendChild(label);
            typeFilterContainer.appendChild(filterItem);
        });
    }

    createChart(ctx, labels, datasets, type, yAxisTitle, tickDecimals = 1, tooltipDecimals = 2, unit='') {
        // Add chart type specific options
        const typeOptions = {};

        if (type === 'bar') {
            typeOptions.barPercentage = 0.8;
            typeOptions.categoryPercentage = 0.9;
            typeOptions.maxBarThickness = 30;
        } else if (type === 'line') {
            // Ensure datasets have proper line styling
            datasets.forEach(dataset => {
                dataset.borderWidth = 2;
                dataset.tension = 0.1; // Slight curve for better readability
                dataset.pointRadius = 3;
                dataset.pointHoverRadius = 5;
            });
        } else if (type === 'scatter') {
            // Scatter specific options
            datasets.forEach(dataset => {
                dataset.borderWidth = 1;
                dataset.pointStyle = 'circle';
                // Point radius is already set in dataset
            });
        }

        return new Chart(ctx, {
            type: type,
            data: {
                labels,
                datasets,
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: {
                    duration: 0,
                },
                scales: {
                    x: {
                        type: 'time',
                        time: {
                            unit: 'day',
                            tooltipFormat: 'yyyy-MM-dd',
                        },
                        title: {
                            display: true,
                            text: 'Day',
                        },
                    },
                    y: {
                        title: {
                            display: true,
                            text: yAxisTitle,
                        },
                        ticks: {
                            callback: function (value) {
                                return value.toFixed(tickDecimals);
                            }
                        }
                    },
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(tooltipItem) {
                                let value = tooltipItem.raw;
                                return `${tooltipItem.dataset.label}: ${value.y.toFixed(tooltipDecimals)}${unit}`;
                            }
                        }
                    },
                    legend: {
                        display: true,
                        position: 'top',
                        align: 'start',
                        labels: {
                            color: '#ddd',
                            boxWidth: 12,
                            padding: 10,
                            font: {
                                size: 11 // Smaller font for legend
                            }
                        },
                        // Handle overflow by wrapping legend items
                        maxHeight: 80,
                        maxWidth: ctx.canvas.width,
                        overflow: 'wrap'
                    }
                },
                ...typeOptions
            },
        });
    }

    setDateRange(startDate, endDate) {
        this.startDate = startDate;
        this.endDate = endDate;
        this.plotData();
    }

    changeChartType(chartName, newType) {
        if (this.chartTypes[chartName] !== newType) {
            this.chartTypes[chartName] = newType;
            this.plotData();
        }
    }

    createGraph() {
        graphPopup.classList.add('visible');
        this.plotData();
    }

    clearGraph() {
        graphPopup.classList.remove('visible');
    }

    // Helper function to get appropriate background color based on chart type
    getBackgroundColor(color, chartType) {
        if (chartType === 'bar') {
            // More transparent for bar charts to make the colors less overwhelming
            return color + '60'; // 60 is more transparent than 80
        } else if (chartType === 'scatter') {
            return color;
        }
        return undefined; // For line charts
    }
}

const graphPopup = document.getElementById('graph-popup');
const graphClose = document.getElementById('graph-close-popup');
const graphButton = document.getElementById('graph-label');

const graphTime = document.getElementById('graph-popup-time');
const graphCount = document.getElementById('graph-popup-count');
const graphScore = document.getElementById('graph-popup-score');

const canvasTime = document.getElementById('graph-canvas-time');
const canvasCount = document.getElementById('graph-canvas-count');
const canvasScore = document.getElementById('graph-canvas-score');

const graphTimeSelect = document.getElementById('graph-select-time');
const graphCountSelect = document.getElementById('graph-select-count');
const graphScoreSelect = document.getElementById('graph-select-score');

// Initialize date range pickers and chart type selectors
function initGraphControls() {
    // Add event listeners for date range inputs
    const startDateInput = document.getElementById('graph-start-date');
    const endDateInput = document.getElementById('graph-end-date');
    const resetDatesButton = document.getElementById('graph-reset-dates');

    if (startDateInput) {
        startDateInput.addEventListener('change', updateDateRange);
    }

    if (endDateInput) {
        endDateInput.addEventListener('change', updateDateRange);
    }

    if (resetDatesButton) {
        resetDatesButton.addEventListener('click', () => {
            if (startDateInput) startDateInput.value = '';
            if (endDateInput) endDateInput.value = '';
            updateDateRange();
        });
    }

    // Add event listeners for chart type selectors
    const chartTypeSelectors = document.querySelectorAll('.chart-type-selector');
    chartTypeSelectors.forEach(selector => {
        selector.addEventListener('change', function() {
            const chartName = this.getAttribute('data-chart');
            const newType = this.value;
            PROGRESS_GRAPH.changeChartType(chartName, newType);
        });
    });
}

function updateDateRange() {
    const startDateInput = document.getElementById('graph-start-date');
    const endDateInput = document.getElementById('graph-end-date');

    let startDate = null;
    let endDate = null;

    if (startDateInput && startDateInput.value) {
        startDate = new Date(startDateInput.value);
        startDate.setHours(0, 0, 0, 0);
    }

    if (endDateInput && endDateInput.value) {
        endDate = new Date(endDateInput.value);
        endDate.setHours(23, 59, 59, 999);
    }

    PROGRESS_GRAPH.setDateRange(startDate, endDate);
}

graphTimeSelect.addEventListener('click', () => {
    graphTime.classList.add('visible');
    graphScore.classList.remove('visible');
    graphCount.classList.remove('visible');
    graphTimeSelect.classList.add('selected');
    graphScoreSelect.classList.remove('selected');
    graphCountSelect.classList.remove('selected');
});

graphCountSelect.addEventListener('click', () => {
    graphTime.classList.remove('visible');
    graphScore.classList.remove('visible');
    graphCount.classList.add('visible');
    graphTimeSelect.classList.remove('selected');
    graphScoreSelect.classList.remove('selected');
    graphCountSelect.classList.add('selected');
});

graphScoreSelect.addEventListener('click', () => {
    graphTime.classList.remove('visible');
    graphScore.classList.add('visible');
    graphCount.classList.remove('visible');
    graphTimeSelect.classList.remove('selected');
    graphScoreSelect.classList.add('selected');
    graphCountSelect.classList.remove('selected');
});

const PROGRESS_GRAPH = new ProgressGraph();

graphClose.addEventListener('click', () => {
    PROGRESS_GRAPH.clearGraph();
});

graphButton.addEventListener('click', () => {
    PROGRESS_GRAPH.createGraph();
});

// Initialize controls when the DOM is loaded
document.addEventListener('DOMContentLoaded', initGraphControls);
