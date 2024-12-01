// Get rid of all the PWA stuff
if ('serviceWorker' in navigator)
    navigator.serviceWorker.getRegistrations()
        .then(registrations => {
            if (registrations.length) for (let r of registrations) r.unregister();
        });

const feedbackWrong = document.querySelector(".feedback--wrong");
const feedbackMissed = document.querySelector(".feedback--missed");
const feedbackRight = document.querySelector(".feedback--right");

const correctlyAnsweredEl = document.querySelector(".correctly-answered");
const nextLevelEl = document.querySelector(".next-level");

const backgroundDiv = document.querySelector('.background-image');
let imageChanged = true;

const timerInput = document.querySelector("#timer-input");
const timerToggle = document.querySelector("#timer-toggle");
const timerBar = document.querySelector(".timer__bar");
const customTimeInfo = document.querySelector(".custom-time-info");
let timerToggled = false;
let timerTime = 30;
let timerCount = 30;
let timerInstance;
let timerRunning = false;
let processingAnswer = false;

let quota

const historyList = document.getElementById("history-list");
const totalDisplay = document.getElementById("total-display");
const averageDisplay = document.getElementById("average-display");
const averageCorrectDisplay = document.getElementById("average-correct-display");
const percentCorrectDisplay = document.getElementById("percent-correct-display");

let carouselIndex = 0;
let carouselEnabled = false;
let question;
const carousel = document.querySelector(".carousel");
const carouselDisplayLabelType = carousel.querySelector(".carousel_display_label_type");
const carouselDisplayLabelProgress = carousel.querySelector(".carousel_display_label_progress");
const carouselDisplayText = carousel.querySelector(".carousel_display_text");
const carouselBackButton = carousel.querySelector("#carousel-back");
const carouselNextButton = carousel.querySelector("#carousel-next");

const display = document.querySelector(".display-outer");
const displayLabelType = display.querySelector(".display_label_type");
const displayLabelLevel = display.querySelector(".display_label_level");;
const displayText = display.querySelector(".display_text");;

const liveStyles = document.getElementById('live-styles');
const gameArea = document.getElementById('game-area');

const confirmationButtons = document.querySelector(".confirmation-buttons");
let imagePromise = Promise.resolve();

const keySettingMapInverse = Object.entries(keySettingMap)
    .reduce((a, b) => (a[b[1]] = b[0], a), {});

carouselBackButton.addEventListener("click", carouselBack);
carouselNextButton.addEventListener("click", carouselNext);

for (const key in keySettingMap) {
    const value = keySettingMap[key];
    const input = document.querySelector("#" + key);

    // Checkbox handler
    if (input.type === "checkbox") {
        input.addEventListener("input", evt => {
            savedata[value] = !!input.checked;
            save();
            init();
        });
    }

    // Number handler
    if (input.type === "number") {
        input.addEventListener("input", evt => {

            let num = input?.value;
            if (num === undefined || num === null || num === '')
                num = null;
            if (input.min && +num < +input.min)
                num = null;
            if (input.max && +num > +input.max)
                num = null;

            if (num == null) {
                if (key.endsWith("premises") || key.endsWith("time")) {
                    savedata[value] = null;
                } else {
                    // Fix infinite loop on mobile when changing # of premises
                    return;
                }
            } else {
                savedata[value] = +num;
            }
            save();
            init();
        });
    }

    // Image handler
    if (input.type === "file") {
        input.addEventListener("change", function() {
            const file = this.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(event) {
                    const base64String = event.target.result;
                    savedata[value] = imageKey;
                    imagePromise = imagePromise.then(() => storeImage(imageKey, base64String));
                    imageChanged = true;
                    save();
                    init();
                };
                reader.readAsDataURL(file);
            }
        });
    }

    if (input.type === "text") {
        input.addEventListener("input", function() {
            const color = this.value;
            savedata[value] = color;
            save();
            init();
        });
    }
}

// Functions
function save() {
    localStorage.setItem(
        localKey,
        JSON.stringify(savedata)
    );
}

function load() {
    const LSEntry = localStorage.getItem(localKey);

    let savedData;
    if (LSEntry) {
        savedData = JSON.parse(LSEntry);
    }
    if (!savedData) {
        return save();
    }

    Object.assign(savedata, savedData);

    for (let key in savedData) {
        if (!(key in keySettingMapInverse)) continue;
        let value = savedData[key];
        let id = keySettingMapInverse[key];
        
        const input = document.querySelector("#" + id);
        if (input.type === "checkbox")
            input.checked = value;
        else if (input.type === "number")
            input.value = value;
        else if (input.type === "text")
            input.value = value;
    }

    timerInput.value = savedData.timer;
    timerTime = timerInput.value;

    renderHQL();
}

function carouselInit() {
    carouselIndex = 0;
    renderCarousel();
}

function displayInit() {
    const q = renderJunkEmojis(question);
    displayLabelType.textContent = q.category.split(":")[0];
    displayLabelLevel.textContent = q.premises.length + " ps";
    displayText.innerHTML = [
        ...q.premises.map(p => `<div class="formatted-premise">${p}</div>`),
        ...(q.operations ? q.operations.map(o => `<div class="formatted-operation">${o}</div>`) : []),
        '<div class="conclusion-padding"></div>',
        '<div class="formatted-conclusion">'+q.conclusion+'</div>'
    ].join('');
    imagePromise = imagePromise.then(() => updateCustomStyles());
    renderTimerBar();
}

function clearBackgroundImage() {
    const fileInput = document.getElementById('p-24');
    fileInput.value = '';
    delete savedata.backgroundImage;
    imageChanged = true;
    save();
    imagePromise = imagePromise.then(() => deleteImage(imageKey));
    imagePromise = imagePromise.then(() => updateCustomStyles());
}

async function updateCustomStyles() {
    let styles = '';
    if (imageChanged) {
        if (savedata.backgroundImage) {
            const base64String = await getImage(imageKey);
            const [prefix, base64Data] = base64String.split(',');
            const mimeType = prefix.match(/data:(.*?);base64/)[1];
            const binary = atob(base64Data);
            const len = binary.length;
            const bytes = new Uint8Array(len);
            for (let i = 0; i < len; i++) {
                bytes[i] = binary.charCodeAt(i);
            }

            const blob = new Blob([bytes], { type: mimeType });
            const objectURL = URL.createObjectURL(blob);

            backgroundDiv.style.backgroundImage = `url(${objectURL})`;
        } else {
            backgroundDiv.style.backgroundImage = ``;
        }
        imageChanged = false;
    }
    if (liveStyles.innerHTML !== styles) {
        liveStyles.innerHTML = styles;
    }

    const gameAreaColor = savedata.gameAreaColor;
    const gameAreaImage = `${gameAreaColor}`
    if (gameArea.style.background !== gameAreaImage) {
        gameArea.style.background = '';
        gameArea.style.background = gameAreaImage;
    }
}

function enableConfirmationButtons() {
    confirmationButtons.style.pointerEvents = "all";
    confirmationButtons.style.opacity = 1;
}

function disableConfirmationButtons() {
    confirmationButtons.style.pointerEvents = "none";
    confirmationButtons.style.opacity = 0;
}

function renderCarousel() {
    if (!savedata.enableCarouselMode) {
        display.classList.add("visible");
        carousel.classList.remove("visible");
        enableConfirmationButtons();
        return;
    }
    const q = renderJunkEmojis(question);

    carousel.classList.add("visible");
    display.classList.remove("visible");
    if (carouselIndex == 0) {
        carouselBackButton.disabled = true;
    } else {
        carouselBackButton.disabled = false;
    }
    
    if (carouselIndex < q.premises.length) {
        carouselNextButton.disabled = false;
        disableConfirmationButtons();
        carouselDisplayLabelType.textContent = "Premise";
        carouselDisplayLabelProgress.textContent = (carouselIndex + 1) + "/" + q.premises.length;
        carouselDisplayText.innerHTML = q.premises[carouselIndex];
    } else if (q.operations && carouselIndex < q.operations.length + q.premises.length) {
        carouselNextButton.disabled = false;
        const operationIndex = carouselIndex - q.premises.length;
        disableConfirmationButtons();
        carouselDisplayLabelType.textContent = "Transformation";
        carouselDisplayLabelProgress.textContent = (operationIndex + 1) + "/" + q.operations.length;
        carouselDisplayText.innerHTML = q.operations[operationIndex];
    } else {
        carouselNextButton.disabled = true;
        enableConfirmationButtons();
        carouselDisplayLabelType.textContent = "Conclusion";
        carouselDisplayLabelProgress.textContent = "";
        carouselDisplayText.innerHTML = q.conclusion;
    }
}

function carouselBack() {
    carouselIndex--;
    renderCarousel();
}
  
function carouselNext() {
    carouselIndex++;
    renderCarousel();
}

function switchButtons() {
    const parent = document.querySelectorAll(".confirmation-buttons");
    for (let p of parent) {
        const firstChild = p.firstElementChild;
        p.removeChild(firstChild);
        p.appendChild(firstChild);
    }
}

function startCountDown() {
    timerRunning = true;
    question.startedAt = new Date().getTime();
    timerCount = findStartingTimerCount();
    animateTimerBar();
}

function stopCountDown() {
    timerRunning = false;
    timerCount = findStartingTimerCount();
    timerBar.style.width = '100%';
    clearTimeout(timerInstance);
}

function renderTimerBar() {
    const [mode, startingTimerCount] = findStartingTimerState();
    if (mode === 'override') {
        timerBar.classList.add('override');
        customTimeInfo.classList.add('visible');
        customTimeInfo.innerHTML =  '' + startingTimerCount + 's';
    } else {
        timerBar.classList.remove('override');
        customTimeInfo.classList.remove('visible');
        customTimeInfo.innerHTML = '';
    }
    timerBar.style.width = (timerCount / startingTimerCount * 100) + '%';
}

function animateTimerBar() {
    renderTimerBar();
    if (timerCount > 0) {
        timerCount--;
        timerInstance = setTimeout(animateTimerBar, 1000);
    }
    else {
        timeElapsed();
    }
}

function findStartingTimerCount() {
    const [_, count] = findStartingTimerState();
    return count;
}

function findStartingTimerState() {
    if (question) {
        if (question.countdown) {
            return ['override', Math.max(1, question.countdown)];
        } else if (question.timeOffset) {
            return ['override', Math.max(1, +timerTime + question.timeOffset)];
        }
    }
    return ['default', Math.max(1, +timerTime)];
}

function init() {
    stopCountDown();

    const analogyEnable = [
        savedata.enableDistinction,
        savedata.enableComparison,
        savedata.enableTemporal,
        savedata.enableDirection,
        savedata.enableDirection3D,
        savedata.enableDirection4D
    ].reduce((a, c) => a + +c, 0) > 0;

    const binaryEnable = [
        savedata.enableDistinction,
        savedata.enableComparison,
        savedata.enableTemporal,
        savedata.enableDirection,
        savedata.enableDirection3D,
        savedata.enableDirection4D,
        savedata.enableSyllogism
    ].reduce((a, c) => a + +c, 0) > 1;

    const choices = [];
    quota = savedata.premises
    quota = Math.min(quota, maxStimuliAllowed());

    if (savedata.enableDistinction && !(savedata.onlyAnalogy || savedata.onlyBinary))
        choices.push(createSameOpposite(getPremisesFor('overrideDistinctionPremises', quota)));
    if (savedata.enableComparison && !(savedata.onlyAnalogy || savedata.onlyBinary))
        choices.push(createMoreLess(getPremisesFor('overrideComparisonPremises', quota)));
    if (savedata.enableTemporal && !(savedata.onlyAnalogy || savedata.onlyBinary))
        choices.push(createBeforeAfter(getPremisesFor('overrideTemporalPremises', quota)));
    if (savedata.enableSyllogism && !(savedata.onlyAnalogy || savedata.onlyBinary))
        choices.push(createSyllogism(getPremisesFor('overrideSyllogismPremises', quota)));
    if (savedata.enableDirection && !(savedata.onlyAnalogy || savedata.onlyBinary))
        choices.push(createDirectionQuestion(getPremisesFor('overrideDirectionPremises', quota)));
    if (savedata.enableDirection3D && !(savedata.onlyAnalogy || savedata.onlyBinary))
        choices.push(createDirectionQuestion3D(getPremisesFor('overrideDirection3DPremises', quota)));
    if (savedata.enableDirection4D && !(savedata.onlyAnalogy || savedata.onlyBinary))
        choices.push(createDirectionQuestion4D(getPremisesFor('overrideDirection4DPremises', quota)));
    if (
     savedata.enableAnalogy
     && !savedata.onlyBinary
     && analogyEnable
    ) {
        choices.push(createSameDifferent(quota));
    }

    const binaryQuota = getPremisesFor('overrideBinaryPremises', quota);
    if (
     savedata.enableBinary
     && !savedata.onlyAnalogy
     && binaryEnable
    ) {
        if ((savedata.maxNestedBinaryDepth ?? 1) <= 1)
            choices.push(createBinaryQuestion(binaryQuota));
        else
            choices.push(createNestedBinaryQuestion(binaryQuota));
    }

    if (savedata.enableAnalogy && !analogyEnable) {
        alert('ANALOGY needs at least 1 other question class (SYLLOGISM and BINARY do not count).');
        if (savedata.onlyAnalogy)
            return;
    }

    if (savedata.enableBinary && !binaryEnable) {
        alert('BINARY needs at least 2 other question class (ANALOGY do not count).');
        if (savedata.onlyBinary)
            return;
    }
    if (choices.length === 0)
        return;

    question = choices[Math.floor(Math.random() * choices.length)];

    if (!savedata.removeNegationExplainer && /is-negated/.test(JSON.stringify(question)))
        question.premises.unshift('<span class="negation-explainer">Invert the <span class="is-negated">Red</span> text</span>');

    // Switch confirmation buttons a random amount of times
    for (let i = Math.floor(Math.random()*10); i > 0; i--) {
        switchButtons();
    }

    stopCountDown();
    if (timerToggled) 
        startCountDown();

    carouselInit();
    displayInit();
}

function wowFeedbackRight(cb) {
    feedbackRight.style.transitionDuration = "0.5s";
    feedbackRight.classList.add("active");
    setTimeout(() => {
        feedbackRight.classList.remove("active");
        cb();
        processingAnswer = false;
    }, 1200);
}

function wowFeedbackWrong(cb) {
    feedbackWrong.style.transitionDuration = "0.5s";
    feedbackWrong.classList.add("active");
    setTimeout(() => {
        feedbackWrong.classList.remove("active");
        cb();
        processingAnswer = false;
    }, 1200);
}

function wowFeedbackMissed(cb) {
    feedbackMissed.style.transitionDuration = "0.5s";
    feedbackMissed.classList.add("active");
    setTimeout(() => {
        feedbackMissed.classList.remove("active");
        cb();
        processingAnswer = false;
    }, 1200);
}

function removeAppStateAndSave() {
    savedata.questions.push(question);
    save();
}

function checkIfTrue() {
    if (processingAnswer) {
        return;
    }
    processingAnswer = true;
    question.answerUser = true;
    if (question.isValid) {
        savedata.score++;
        question.correctness = 'right';
        wowFeedbackRight(init);
    } else {
        savedata.score--;
        question.correctness = 'wrong';
        wowFeedbackWrong(init);
    }
    question.answeredAt = new Date().getTime();
    removeAppStateAndSave();
    renderHQL(true);
}

function checkIfFalse() {
    if (processingAnswer) {
        return;
    }
    processingAnswer = true;
    question.answerUser = false;
    if (!question.isValid) {
        savedata.score++;
        question.correctness = 'right';
        wowFeedbackRight(init);
    } else {
        savedata.score--;
        question.correctness = 'wrong';
        wowFeedbackWrong(init);
    }
    question.answeredAt = new Date().getTime();
    removeAppStateAndSave();
    renderHQL(true);
}

function timeElapsed() {
    if (processingAnswer) {
        return;
    }
    processingAnswer = true;
    savedata.score--;
    question.correctness = 'missed';
    question.answerUser = undefined;
    question.answeredAt = new Date().getTime();
    removeAppStateAndSave();
    renderHQL(true);

    wowFeedbackMissed(init);
}

function resetApp() {
    const confirmed = confirm("Are you sure?");
    if (confirmed) {
        localStorage.removeItem(localKey);
        localStorage.removeItem(imageKey);
        window.location.reload();
    }
}

function clearHistory() {
    const confirmed = confirm("Are you sure?");
    if (confirmed) {
        savedata.questions = [];
        savedata.score = 0;
        save();
        renderHQL();
    }
}

function deleteQuestion(i, isRight) {
    savedata.score += (isRight ? -1 : 1);
    savedata.questions.splice(i, 1);
    save();
    renderHQL();
}

function renderHQL(didAddSingleQuestion=false) {
    if (didAddSingleQuestion) {
        const index = savedata.questions.length - 1;
        const recentQuestion = savedata.questions[index];
        const firstChild = historyList.firstElementChild;
        historyList.insertBefore(createHQLI(recentQuestion, index), firstChild);
    } else {
        historyList.innerHTML = "";

        const len = savedata.questions.length;
        const reverseChronological = savedata.questions.slice().reverse();

        reverseChronological
            .map((q, i) => {
                const el = createHQLI(q, len - i - 1);
                return el;
            })
            .forEach(el => historyList.appendChild(el));
    }

    updateAverage(savedata.questions);
    correctlyAnsweredEl.innerText = savedata.score;
    nextLevelEl.innerText = savedata.questions.length;
}

function updateAverage(reverseChronological) {
    let questions = reverseChronological.filter(q => q.answeredAt && q.startedAt);
    let times = questions.map(q => (q.answeredAt - q.startedAt) / 1000);
    if (times.length == 0) {
        return;
    }
    const totalTime = times.reduce((a,b) => a + b, 0);
    const minutes = totalTime / 60;
    const seconds = totalTime % 60;
    totalDisplay.innerHTML = minutes.toFixed(0) + 'm ' + seconds.toFixed(0) + 's';
    
    const average =  totalTime / times.length;
    averageDisplay.innerHTML = average.toFixed(1) + 's';

    const correctQuestions = questions.filter(q => q.correctness == 'right');
    const percentCorrect = 100 * correctQuestions.length / questions.length;
    percentCorrectDisplay.innerHTML = percentCorrect.toFixed(1) + '%';
    const correctTimes = correctQuestions.map(q => (q.answeredAt - q.startedAt) / 1000);
    if (correctTimes.length == 0) {
        averageCorrectDisplay.innerHTML = 'None yet';
        return;
    }
    const totalTimeBeingCorrect = correctTimes.reduce((a,b) => a + b, 0);
    const averageCorrect = totalTimeBeingCorrect / correctTimes.length;
    averageCorrectDisplay.innerHTML = averageCorrect.toFixed(1) + 's';
}

function createHQLI(question, i) {
    const q = renderJunkEmojis(question);
    const parent = document.createElement("DIV");

    const answerUser = q.answerUser;
    const answerUserClassName = {
        'missed': '',
        'right': answerUser,
        'wrong': answerUser,
    }[q.correctness];
    
    const answer = q.isValid;
    let classModifier = {
        'missed': '',
        'right': 'hqli--right',
        'wrong': 'hqli--wrong'
    }[q.correctness];
    
    let answerDisplay = ('' + answer).toUpperCase();
    let answerUserDisplay = {
        'missed': '(TIMED OUT)',
        'right': ('' + answerUser).toUpperCase(),
        'wrong': ('' + answerUser).toUpperCase()
    }[q.correctness];

    const htmlPremises = q.premises
        .map(p => `<div class="hqli-premise">${p}</div>`)
        .join("\n");

    const htmlOperations = q.operations ? q.operations.map(o => `<div class="hqli-operation">${o}</div>`).join("\n") : '';

    let responseTimeHtml = '';
    if (q.startedAt && q.answeredAt)
        responseTimeHtml =
`
        <div class="hqli-response-time">${Math.round((q.answeredAt - q.startedAt) / 1000)} sec</div>
`;
    
    const html =
`<div class="hqli ${classModifier}">
    <div class="inner">
        <div class="index"></div>
        <div class="hqli-premises">
            ${htmlPremises}
            ${htmlOperations}
        </div>
        <div class="hqli-conclusion">${q.conclusion}</div>
        <div class="hqli-answer-user ${answerUserClassName}">${answerUserDisplay}</div>
        <div class="hqli-answer ${answer}">${answerDisplay}</div>
        ${responseTimeHtml}
        <div class="hqli-footer">
            <div>${q.category}</div>
            ${createExplanationButton(q)}
            <button class="delete">X</button>
        </div>
    </div>
</div>`;
    parent.innerHTML = html;
    parent.querySelector(".index").textContent = i + 1;
    parent.querySelector(".delete").addEventListener('click', () => {
        deleteQuestion(i, q.correctness === 'right');
    });
    const explanationButton = parent.querySelector(".explanation-button");
    if (explanationButton) {
        explanationButton.addEventListener('mouseenter', (e) => {
            createExplanationPopup(q, e);
        });
        explanationButton.addEventListener('mouseleave', () => {
            removeExplanationPopup();
        });
    }
    return parent.firstElementChild;
}

// Events
timerInput.addEventListener("input", evt => {
    const el = evt.target;
    timerTime = el.value;
    timerCount = findStartingTimerCount();
    el.style.width = (el.value.length + 4) + 'ch';
    savedata.timer = el.value;
    if (timerToggle.checked) {
        stopCountDown();
        startCountDown();
    }
    save();
});

timerToggle.addEventListener("click", evt => {
    timerToggled = evt.target.checked;
    if (timerToggled) startCountDown();
    else stopCountDown();
});

load();
switchButtons();
init();
