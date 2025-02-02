class ProgressGraph {
    constructor() {
        this.scoreChart = null;
        this.countChart = null;
        this.timeChart = null;
    }

    findDay(question) {
        const adjustedTimestamp = question.timestamp - (4 * 60 * 60 * 1000);
        return new Date(adjustedTimestamp).toISOString().split('T')[0];
    }

    calculateTypeData(data) {
        const groupedByType = {};

        data.forEach((question) => {
            const day = this.findDay(question);

            const isRight = question.correctness === 'right';
            const timeElapsed = question.timeElapsed;
            let bonus = 0;
            if (isRight) {
                bonus = Math.max(0, (-timeElapsed / 1000 + 30) / 20);
            } else {
                bonus = -0.5;
            }
            const score = question.premises + bonus;

            let type = question.type;
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
                groupedByType[type][day] = { totalScore: 0, count: 0 };
            }

            groupedByType[type][day].totalScore += score;
            groupedByType[type][day].count += 1;
        });

        const result = {};
        for (const type in groupedByType) {
            result[type] = [];
            for (const day in groupedByType[type]) {
                const count = groupedByType[type][day].count;
                const averageScore = groupedByType[type][day].totalScore / count;
                result[type].push({ day, count, score: averageScore });
            }
            for (const day in groupedByType[type]) {
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
        const typeData = this.calculateTypeData(data);

        const labels = Object.values(typeData)[0].map((entry) => entry.day);

        const scoreDatasets = Object.keys(typeData).map((type) => {
            return {
                label: type,
                data: typeData[type].map((entry) => entry.score),
                borderColor: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
                fill: false,
            };
        });

        const countDatasets = Object.keys(typeData).map((type) => {
            return {
                label: type,
                data: typeData[type].map((entry) => entry.count),
                borderColor: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
                fill: false,
            };
        });

        const timeData = this.calculateTimeSpentData(data);
        const timeDatasets = [{
            label: 'Time Spent (Minutes)',
            data: timeData.map(entry => entry.time),
            borderColor: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
            fill: false,
        }];

        const scoreCtx = canvasScore.getContext('2d');
        this.scoreChart = this.createChart(scoreCtx, labels, scoreDatasets, 'Score');
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
                                return `${tooltipItem.dataset.label}: ${value.toFixed(2)}`;
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


