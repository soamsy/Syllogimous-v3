class ProgressGraph {
    constructor() {
        this.scoreChart = null;
        this.countChart = null;
        this.timeChart = null;
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

            const isRight = question.correctness === 'right';
            const timeElapsed = question.timeElapsed;

            let type = question.type + (groupByPremises ? (' p' + question.premises) : '');
            if (question.modifiers && question.modifiers.length > 0) {
                type += ` ${question.modifiers.join('-')}`;
            }
            if (question.tags && question.tags.length > 0) {
                type += ` ${question.tags.join('-')}`;
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

    async plotScore() {
        const data = await getAllRRTProgress();
        if (!data || data.length === 0) {
            return;
        }
        const typeData = this.calculateTypeData(data, false);
        const premiseLevelData = this.calculateTypeData(data, true);

        const labels = Object.values(typeData)[0].map((entry) => entry.day);
        const premiseLevelLabels = Object.values(premiseLevelData)[0].map((entry) => entry.day);

        const scoreDatasets = Object.keys(premiseLevelData).map((type) => {
            return {
                label: type,
                data: premiseLevelData[type].map((entry) => ({ x: entry.day, y: entry.averageTime })),
                borderColor: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
                fill: false,
            };
        });

        const countDatasets = Object.keys(typeData).map((type) => {
            return {
                label: type,
                data: typeData[type].map((entry) => ({ x: entry.day, y: entry.count })),
                borderColor: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
                fill: false,
            };
        });

        const timeData = this.calculateTimeSpentData(data);
        const timeDatasets = [{
            label: 'Time Spent (Minutes)',
            data: timeData.map(entry => ({ x: entry.day, y: entry.time })),
            borderColor: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
            fill: false,
        }];

        const scoreCtx = canvasScore.getContext('2d');
        this.scoreChart = this.createChart(scoreCtx, premiseLevelLabels, scoreDatasets, 'Average Time');
        const countCtx = canvasCount.getContext('2d');
        this.countChart = this.createChart(countCtx, labels, countDatasets, 'Count', 0, 0);
        const timeCtx = canvasTime.getContext('2d');
        this.timeChart = this.createChart(timeCtx, labels, timeDatasets, 'Time Spent');
    }

    createChart(ctx, labels, datasets, yAxisTitle, tickDecimals = 1, tooltipDecimals = 2) {
        return new Chart(ctx, {
            type: 'line',
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
                                return value.toFixed(1);
                            }
                        }
                    },
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(tooltipItem) {
                                let value = tooltipItem.raw;
                                return `${tooltipItem.dataset.label}: ${value.y.toFixed(2)}`;
                            }
                        }
                    }
                },
            },
        });
    }

    createGraph() {
        graphPopup.classList.add('visible');
        this.plotData();
    }

    clearGraph() {
        graphPopup.classList.remove('visible');
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


