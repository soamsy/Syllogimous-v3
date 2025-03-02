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

const historyList = document.getElementById("history-list");
const historyButton = document.querySelector(`label.open[for="offcanvas-history"]`);
const historyCheckbox = document.getElementById("offcanvas-history");
const settingsButton = document.querySelector(`label.open[for="offcanvas-settings"]`);
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
const spoilerArea = document.getElementById('spoiler-area');

const confirmationButtons = document.querySelector(".confirmation-buttons");
let imagePromise = Promise.resolve();

const keySettingMapInverse = Object.entries(keySettingMap)
    .reduce((a, b) => (a[b[1]] = b[0], a), {});

carouselBackButton.addEventListener("click", carouselBack);
carouselNextButton.addEventListener("click", carouselNext);

function isKeyNullable(key) {
    return key.endsWith("premises") || key.endsWith("time") || key.endsWith("optional");
}

function registerEventHandlers() {
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
                    if (isKeyNullable(key)) {
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

        if (input.type === "select-one") {
            input.addEventListener("change", evt => {
                savedata[value] = input.value;
                save();
                init();
            })
        }
    }
}

function save() {
    PROFILE_STORE.saveProfiles();
    setLocalStorageObj(appStateKey, appState);
}

function appStateStartup() {
    const appStateObj = getLocalStorageObj(appStateKey);
    if (appStateObj) {
        Object.assign(appState, appStateObj);
        setLocalStorageObj(appStateKey, appState);
    }
}

function load() {
    appStateStartup();
    PROFILE_STORE.startup();

    renderHQL();
    renderFolders();
    populateSettings();
}

function populateSettings() {
    for (let key in savedata) {
        if (!(key in keySettingMapInverse)) continue;
        let value = savedata[key];
        let id = keySettingMapInverse[key];
        
        const input = document.querySelector("#" + id);
        if (input.type === "checkbox") {
            if (value === true || value === false) {
                input.checked = value;
            }
        }
        else if (input.type === "number") {
            if (!value && isKeyNullable(id)) {
                input.value = '';
            } else if (typeof value === "number") {
                input.value = +value;
            }
        }
        else if (input.type === "text") {
            input.value = value;
        } else if (input.type === "select-one") {
            input.value = value;
        }
    }

    populateLinearDropdown();
    populateAppearanceSettings();

    timerInput.value = savedata.timer;
    timerTime = timerInput.value;
}

function carouselInit() {
    carouselIndex = 0;
    renderCarousel();
}

function displayInit() {
    const q = renderJunkEmojis(question);
    displayLabelType.textContent = q.category.split(":")[0];
    displayLabelLevel.textContent = q.premises.length + "p";
    const easy = savedata.scrambleLimit === 0 ? ' (easy)' : '';
    displayText.innerHTML = [
        `<div class="preamble">Premises${easy}</div>`,
        ...q.premises.map(p => `<div class="formatted-premise">${p}</div>`),
        ...((q.operations && q.operations.length > 0) ? ['<div class="transform-header">Transformations</div>'] : []),
        ...(q.operations ? q.operations.map(o => `<div class="formatted-operation">${o}</div>`) : []),
        '<div class="postamble">Conclusion</div>',
        '<div class="formatted-conclusion">'+q.conclusion+'</div>',
    ].join('');
    const isAnalogy = question?.tags?.includes('analogy');
    const isBinary = question.type === 'binary';
    if (savedata.minimalMode && question.type !== 'syllogism') {
        displayText.classList.add('minimal');
    } else {
        displayText.classList.remove('minimal');
    }
    if (isAnalogy || isBinary) {
        displayText.classList.add('complicated-conclusion');
    } else {
        displayText.classList.remove('complicated-conclusion');
    }
    imagePromise = imagePromise.then(() => updateCustomStyles());
}

function clearBackgroundImage() {
    const fileInput = document.getElementById('image-upload');
    fileInput.value = '';
    delete appState.backgroundImage;
    imageChanged = true;
    save();
    imagePromise = imagePromise.then(() => deleteImage(imageKey));
    imagePromise = imagePromise.then(() => updateCustomStyles());
}

function handleImageChange(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(event) {
            const base64String = event.target.result;
            appState.backgroundImage = imageKey;
            imagePromise = imagePromise.then(() => storeImage(imageKey, base64String));
            imageChanged = true;
            save();
            init();
        };
        reader.readAsDataURL(file);
    }
}

function populateAppearanceSettings() {
    document.getElementById('color-input').value = appState.gameAreaColor;
    document.getElementById('p-sfx').value = appState.sfx;
    document.getElementById('p-fast-ui').checked = appState.fastUi;
}

function handleColorChange(event) {
    const color = event.target.value;
    appState.gameAreaColor = color;
    save();
    init();
}

function handleSfxChange(event) {
    appState.sfx = event.target.value;
    save();
    init();
}

function handleFastUiChange(event) {
    appState.fastUi = event.target.checked;
    appState.staticButtons = event.target.checked;
    removeFastFeedback();
    switchButtons();
    save();
    init();
}

async function updateCustomStyles() {
    let styles = '';
    if (imageChanged) {
        if (appState.backgroundImage) {
            const base64String = await getImage(imageKey);
            if (base64String) {
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
            }
        } else {
            backgroundDiv.style.backgroundImage = ``;
        }
        imageChanged = false;
    }
    if (liveStyles.innerHTML !== styles) {
        liveStyles.innerHTML = styles;
    }

    const gameAreaColor = appState.gameAreaColor;
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
        if (appState.staticButtons && firstChild.classList.contains('confirmation-true')) {
            return;
        }
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

function generateQuestion() {
    const analogyEnable = [
        savedata.enableDistinction,
        savedata.enableLinear,
        savedata.enableDirection,
        savedata.enableDirection3D,
        savedata.enableDirection4D,
        savedata.enableAnchorSpace
    ].reduce((a, c) => a + +c, 0) > 0;

    const binaryEnable = [
        savedata.enableDistinction,
        savedata.enableLinear,
        savedata.enableDirection,
        savedata.enableDirection3D,
        savedata.enableDirection4D,
        savedata.enableSyllogism
    ].reduce((a, c) => a + +c, 0) > 1;

    const generators = [];
    let quota = savedata.premises
    quota = Math.min(quota, maxStimuliAllowed());

    const banNormalModes = savedata.onlyAnalogy || savedata.onlyBinary;
    if (!banNormalModes) {
        if (savedata.enableDistinction)
            generators.push(createDistinctionGenerator(quota));
        if (savedata.enableLinear)
            generators.push(...createLinearGenerators(quota));
        if (savedata.enableSyllogism)
            generators.push(createSyllogismGenerator(quota));
        if (savedata.enableDirection)
            generators.push(createDirectionGenerator(quota));
        if (savedata.enableDirection3D)
            generators.push(createDirection3DGenerator(quota));
        if (savedata.enableDirection4D)
            generators.push(createDirection4DGenerator(quota));
        if (savedata.enableAnchorSpace)
            generators.push(createAnchorSpaceGenerator(quota));
    }
    if (
     savedata.enableAnalogy
     && !savedata.onlyBinary
     && analogyEnable
    ) {
        generators.push(createAnalogyGenerator(quota));
    }

    const binaryQuota = getPremisesFor('overrideBinaryPremises', quota);
    if (
     savedata.enableBinary
     && !savedata.onlyAnalogy
     && binaryEnable
    ) {
        if ((savedata.maxNestedBinaryDepth ?? 1) <= 1)
            generators.push(createBinaryGenerator(quota));
        else
            generators.push(createNestedBinaryGenerator(quota));
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
    if (generators.length === 0)
        return;

    const totalWeight = generators.reduce((sum, item) => sum + item.weight, 0);
    const randomValue = Math.random() * totalWeight;
    let cumulativeWeight = 0;
    let q;
    for (let generator of generators) {
        cumulativeWeight += generator.weight;
        if (randomValue < cumulativeWeight) {
            q = generator.question.create(generator.premiseCount);
            break;
        }
    }

    if (!savedata.removeNegationExplainer && /is-negated/.test(JSON.stringify(q)))
        q.premises.unshift('<span class="negation-explainer">Invert the <span class="is-negated">Red</span> text</span>');

    return q;
}

function init() {
    stopCountDown();
    question = generateQuestion();
    if (!question) {
        return;
    }

    if (coinFlip()) {
        switchButtons();
    }

    stopCountDown();
    if (timerToggled) {
        startCountDown();
    } else {
        renderTimerBar();
    }

    carouselInit();
    displayInit();
    PROGRESS_STORE.renderCurrentProgress(question);
    renderConclusionSpoiler();
}

function renderConclusionSpoiler() {
    if (savedata.spoilerConclusion) {
        spoilerArea.classList.add('spoiler');
    } else {
        spoilerArea.classList.remove('spoiler');
    }
}

const DEFAULT_SOUNDS = {
    success: { audio: new Audio('sounds/default/success.mp3'), time: 2000},
    failure: { audio: new Audio('sounds/default/failure.mp3'), time: 1400},
    missed: { audio: new Audio('sounds/default/missed.mp3'), time: 1400},
}

const ZEN_SOUNDS = {
    success: { audio: new Audio('sounds/zen/success.mp3'), time: 2000 },
    failure: { audio: new Audio('sounds/zen/failure.mp3'), time: 1400 },
    missed: { audio: new Audio('sounds/zen/missed.mp3'), time: 1400 },
}

function playSoundFor(sound, duration) {
    sound.currentTime = 0;
    sound.volume = 0.6;
    sound.play();

    setTimeout(() => {
        let fadeOut = setInterval(() => {
            if (sound.volume > 0.10) {
                sound.volume -= 0.10;
            } else {
                clearInterval(fadeOut);
                sound.pause();
                sound.currentTime = 0;
                sound.volume = 0.6;
            }
        }, 100);
    }, duration - 600);
}

function getCurrentSoundPack() {
    if (appState.sfx === 'sfx1') {
        return DEFAULT_SOUNDS;
    } else if (appState.sfx === 'sfx2') {
        return ZEN_SOUNDS;
    }
    return null;
}

function playSound(property) {
    const sounds = getCurrentSoundPack();
    if (sounds) {
        playSoundFor(sounds[property].audio, sounds[property].time);
    }
}

function removeFastFeedback() {
    gameArea.classList.remove('right');
    gameArea.classList.remove('wrong');
    gameArea.classList.remove('missed');
}

let fastFeedbackTimer = null;
function fastFeedback(cb, className) {
    if (fastFeedbackTimer) {
        clearTimeout(fastFeedbackTimer);
        fastFeedbackTimer = null;
    }
    removeFastFeedback();
    gameArea.classList.add(className);
    setTimeout(() => {
        cb();
        processingAnswer = false;
        fastFeedbackTimer = setTimeout(() => {
            removeFastFeedback();
        }, 1000);
    }, 350);
}

function wowFeedbackRight(cb) {
    playSound('success');
    if (appState.fastUi) {
        fastFeedback(cb, 'right');
    } else {
        feedbackRight.classList.add("active");
        setTimeout(() => {
            feedbackRight.classList.remove("active");
            cb();
            processingAnswer = false;
        }, 1000);
    }
}

function wowFeedbackWrong(cb) {
    playSound('failure');
    if (appState.fastUi) {
        fastFeedback(cb, 'wrong');
    } else {
        feedbackWrong.classList.add("active");
        setTimeout(() => {
            feedbackWrong.classList.remove("active");
            cb();
            processingAnswer = false;
        }, 1000);
    }
}

function wowFeedbackMissed(cb) {
    playSound('missed');
    if (appState.fastUi) {
        fastFeedback(cb, 'missed');
    } else {
        feedbackMissed.classList.add("active");
        setTimeout(() => {
            feedbackMissed.classList.remove("active");
            cb();
            processingAnswer = false;
        }, 1000);
    }
}

function wowFeedback() {
    if (question.correctness === 'right') {
        wowFeedbackRight(init);
    } else if (question.correctness === 'wrong') {
        wowFeedbackWrong(init);
    } else {
        wowFeedbackMissed(init);
    }
}

function storeQuestionAndSave() {
    appState.questions.push(question);
    if (timerToggle.checked) {
        PROGRESS_STORE.storeCompletedQuestion(question)
    }
    save();
}

function checkIfTrue() {
    if (processingAnswer) {
        return;
    }
    processingAnswer = true;
    question.answerUser = true;
    if (question.isValid) {
        appState.score++;
        question.correctness = 'right';
    } else {
        appState.score--;
        question.correctness = 'wrong';
    }
    question.answeredAt = new Date().getTime();
    storeQuestionAndSave();
    renderHQL(true);
    wowFeedback();
}

function checkIfFalse() {
    if (processingAnswer) {
        return;
    }
    processingAnswer = true;
    question.answerUser = false;
    if (!question.isValid) {
        appState.score++;
        question.correctness = 'right';
    } else {
        appState.score--;
        question.correctness = 'wrong';
    }
    question.answeredAt = new Date().getTime();
    storeQuestionAndSave();
    renderHQL(true);
    wowFeedback();
}

function timeElapsed() {
    if (processingAnswer) {
        return;
    }
    processingAnswer = true;
    appState.score--;
    question.correctness = 'missed';
    question.answerUser = undefined;
    question.answeredAt = new Date().getTime();
    storeQuestionAndSave();
    renderHQL(true);
    wowFeedback();
}

function resetApp() {
    const confirmed = confirm("Are you sure?");
    if (confirmed) {
        localStorage.removeItem(oldSettingsKey);
        localStorage.removeItem(imageKey);
        localStorage.removeItem(profilesKey);
        localStorage.removeItem(selectedProfileKey);
        localStorage.removeItem(appStateKey);
        document.getElementById("reset-app").innerText = 'Resetting...';
        deleteDatabase("SyllDB").then(() => {
            window.location.reload();
        });
    }
}

function clearHistory() {
    const confirmed = confirm("Are you sure? (does not remove progress graph history)");
    if (confirmed) {
        appState.questions = [];
        appState.score = 0;
        save();
        renderHQL();
    }
}

function deleteQuestion(i, isRight) {
    appState.score += (isRight ? -1 : 1);
    appState.questions.splice(i, 1);
    save();
    renderHQL();
}

function renderHQL(didAddSingleQuestion=false) {
    if (didAddSingleQuestion) {
        const index = appState.questions.length - 1;
        const recentQuestion = appState.questions[index];
        const firstChild = historyList.firstElementChild;
        historyList.insertBefore(createHQLI(recentQuestion, index), firstChild);
    } else {
        historyList.innerHTML = "";

        const len = appState.questions.length;
        const reverseChronological = appState.questions.slice().reverse();

        reverseChronological
            .map((q, i) => {
                const el = createHQLI(q, len - i - 1);
                return el;
            })
            .forEach(el => historyList.appendChild(el));
    }

    updateAverage(appState.questions);
    correctlyAnsweredEl.innerText = appState.score;
    nextLevelEl.innerText = appState.questions.length;
}

function updateAverage(reverseChronological) {
    let questions = reverseChronological.filter(q => q.answeredAt && q.startedAt);
    let times = questions.map(q => (q.answeredAt - q.startedAt) / 1000);
    if (times.length == 0) {
        return;
    }
    const totalTime = times.reduce((a,b) => a + b, 0);
    const minutes = Math.floor(totalTime / 60);
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
            <div class="hqli-preamble">Premises</div>
            ${htmlPremises}
            ${htmlOperations ? '<div class="hqli-transform-header">Transformations</div>' : ''}
            ${htmlOperations}
        </div>
        <div class="hqli-postamble">Conclusion</div>
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

function toggleLegacyFolder() {
    appState.isLegacyOpen = !appState.isLegacyOpen;
    renderFolders();
    save();
}

function toggleExperimentalFolder() {
    appState.isExperimentalOpen = !appState.isExperimentalOpen;
    renderFolders();
    save();
}

function renderFolders() {
    renderFolder('legacy-folder-arrow', 'legacy-folder-content', appState.isLegacyOpen);
    renderFolder('experimental-folder-arrow', 'experimental-folder-content', appState.isExperimentalOpen);
}

function renderFolder(arrowId, contentId, isOpen) {
    const folderArrow = document.getElementById(arrowId);
    const folderContent = document.getElementById(contentId);
    if (isOpen) {
        folderContent.style.display = 'block';
        folderArrow.classList.add('open');
    } else {
        folderContent.style.display = 'none';
        folderArrow.classList.remove('open');
    }
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

function handleCountDown() {
    timerToggled = timerToggle.checked;
    if (timerToggled)
        startCountDown();
    else
        stopCountDown();
}

timerToggle.addEventListener("click", evt => {
    handleCountDown();
});

let dehoverQueue = [];
function handleKeyPress(event) {
    const tagName = event.target.tagName.toLowerCase();
    const isEditable = event.target.isContentEditable;
    if (tagName === "button" || tagName === "input" || tagName === "textarea" || isEditable) {
        return;
    }
    switch (event.code) {
        case "KeyH":
            historyButton.click();
            if (historyCheckbox.checked) {
                const firstEntry = historyList.firstElementChild;
                if (firstEntry) {
                    const explanationButton = firstEntry.querySelector(`button.explanation-button`);
                    explanationButton.dispatchEvent(new Event("mouseenter"));
                    dehoverQueue.push(() => {
                        explanationButton.dispatchEvent(new Event("mouseleave"));
                    });
                }
            } else {
                dehoverQueue.forEach(callback => {
                    callback();
                });
            }
            break;
        case "KeyS":
            settingsButton.click();
            break;
        case "KeyJ":
        case "Digit1":
        case "ArrowLeft":
            checkIfTrue();
            break;
        case "KeyK":
        case "Digit2":
        case "ArrowRight":
            checkIfFalse();
            break;
        case "Space":
            timerToggle.checked = !timerToggle.checked;
            handleCountDown();
            break;
        default:
            break;
    }
}

document.addEventListener("keydown", handleKeyPress);

registerEventHandlers();
load();
switchButtons();
init();
