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

function resetBackgroundColor() {
    appState.gameAreaColor = "#1A1A1AFF"; // Or whatever your initial default is
    document.getElementById('color-input').value = appState.gameAreaColor;
    save();
    imagePromise = imagePromise.then(() => updateCustomStyles());
}

function removeImage() {
    const fileInput = document.getElementById('image-upload');
    fileInput.value = '';
    delete appState.backgroundImage; //Remove the image from memory
    save();
    imagePromise = imagePromise.then(() => deleteImage(imageKey)).then(() => updateCustomStyles());
    imageChanged = true; //Ensure the change takes effect immediately.
}

function getDefaultBackgroundColor() {
    // Create a temporary element to apply the CSS class
    const tempElement = document.createElement('div');
    tempElement.className = 'background-image';
    tempElement.style.display = 'none'; // Hide it from view
    document.body.appendChild(tempElement); // Required for getComputedStyle

    // Get the computed background-color style
    const defaultColor = window.getComputedStyle(tempElement).backgroundColor;

    // Remove the temporary element
    document.body.removeChild(tempElement);

    return defaultColor;
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
    document.getElementById('p-sfx').checked = appState.sfx === 'sfx1';
    document.getElementById('p-fast-ui').checked = appState.fastUi;
}

function handleColorChange(event) {
    const color = event.target.value;
    appState.gameAreaColor = color;
    save();
    init();
}

function handleSfxChange(event) {
    const isEnabled = event.target.checked;
    appState.sfx = isEnabled ? 'sfx1' : 'none';
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
    //if (imageChanged) { // Removed this check
    if (appState.backgroundImage) {
        //Only do the background load if backgroundImage is not null
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
//   imageChanged = false; // No longer needed here
    //} //Removed this bracket
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
        savedata.enableDirection4D
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
    if (savedata.enableDistinction && !banNormalModes)
        generators.push(() => createSameOpposite(getPremisesFor('overrideDistinctionPremises', quota)));
    if (savedata.enableLinear && !banNormalModes) {
        for (let i = 0; i < getLinearQuestionsCount(); i++) {
            generators.push(() => createBasicLinear(getPremisesFor('overrideLinearPremises', quota)));
        }
    }
    if (savedata.enableSyllogism && !banNormalModes)
        generators.push(() => createSyllogism(getPremisesFor('overrideSyllogismPremises', quota)));
    if (savedata.enableDirection && !banNormalModes)
        generators.push(() => createDirectionQuestion(getPremisesFor('overrideDirectionPremises', quota)));
    if (savedata.enableDirection3D && !banNormalModes)
        generators.push(() => createDirectionQuestion3D(getPremisesFor('overrideDirection3DPremises', quota)));
    if (savedata.enableDirection4D && !banNormalModes)
        generators.push(() => createDirectionQuestion4D(getPremisesFor('overrideDirection4DPremises', quota)));
    if (savedata.enableAnchorSpace && !banNormalModes)
        generators.push(() => createDirectionQuestionAnchor(getPremisesFor('overrideAnchorSpacePremises', quota)));
    if (
     savedata.enableAnalogy
     && !savedata.onlyBinary
     && analogyEnable
    ) {
        generators.push(() => createSameDifferent(quota));
    }

    const binaryQuota = getPremisesFor('overrideBinaryPremises', quota);
    if (
     savedata.enableBinary
     && !savedata.onlyAnalogy
     && binaryEnable
    ) {
        if ((savedata.maxNestedBinaryDepth ?? 1) <= 1)
            generators.push(() => createBinaryQuestion(binaryQuota));
        else
            generators.push(() => createNestedBinaryQuestion(binaryQuota));
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

    let q = generators[Math.floor(Math.random() * generators.length)]();

    if (!savedata.removeNegationExplainer && /is-negated/.test(JSON.stringify(q)))
        q.premises.unshift('<span class="negation-explainer">Invert the <span class="is-negated">Red</span> text</span>');

    return q;
}

function init() {
    stopCountDown();
    question = generateQuestion();
    console.log("Correct answer:", question.isValid); 
    if (!question) {
        return;
    }
    // Initialize the timer status property
    question.timerWasRunning = false;
    
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

const successSound = new Audio('sounds/success.mp3');
const failureSound = new Audio('sounds/failure.mp3');
const missedSound = new Audio('sounds/missed.mp3');

function playSoundFor(sound, duration) {
    sound.currentTime = 0;
    sound.volume = 0.6;
    sound.play();

    setTimeout(() => {
        sound.pause();
        sound.currentTime = 0;
    }, duration);
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
    if (appState.sfx === 'sfx1') {
        playSoundFor(successSound, 1400);
    }
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
    if (appState.sfx === 'sfx1') {
        playSoundFor(failureSound, 1400);
    }
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
    if (appState.sfx === 'sfx1') {
        playSoundFor(missedSound, 1400);
    }
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

function getCurrentProfileName() {
    try {
        const profileInput = document.getElementById('profile-input');
        if (profileInput && profileInput.value) {
            return profileInput.value.trim() || "Default";
        }
    } catch (error) {
    }
    
    // Default fallback
    return "Default";
}

function storeQuestionAndSave() {
    question.timerWasRunning = timerRunning;
    question.profileName = getCurrentProfileName();
    
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
    question.timeElapsed = question.answeredAt - question.startedAt;
    console.log("checkIfTrue Question before store:", question); // ADDED CONSOLE LOG
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
    question.timeElapsed = question.answeredAt - question.startedAt;
    console.log("checkIfFalse Question before store:", question); // ADDED CONSOLE LOG
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
    question.timeElapsed = question.answeredAt - question.startedAt;
    console.log("timeElapsed Question before store:", question); // ADDED CONSOLE LOG
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

function clearHistory() {
    const confirmed = confirm("Are you sure? (This will clear the displayed history but preserve data for CSV export)");
    if (confirmed) {
        // Store the questions in a separate array for CSV export
        if (!appState.archivedQuestions) {
            appState.archivedQuestions = [];
        }
        
        // Move current questions to archive instead of deleting them
        appState.archivedQuestions = [...appState.archivedQuestions, ...appState.questions];
        
        // Clear the visible questions and reset the score
        appState.questions = [];
        appState.score = 0;
        
        save();
        renderHQL();
    }
}

// Modify the exportHistoryToCSV function to include archived questions
// Function to strip HTML tags and clean premise text
function cleanPremiseText(text) {
    // Remove all HTML tags
    const withoutTags = text.replace(/<\/?[^>]+(>|$)/g, "");
    
    // Remove extra whitespace
    const cleanedText = withoutTags.replace(/\s+/g, " ").trim();
    
    return cleanedText;
}

// Update the exportHistoryToCSV function to clean premises
// Function to clean premise text while preserving negated elements
function cleanPremiseText(text) {
    // Replace negated spans with content in *asterisks* to show they're negated
    let result = text.replace(/<span class="is-negated">(.*?)<\/span>/g, "*$1*");
    
    // Handle subject spans - just keep the content
    result = result.replace(/<span class="subject">(.*?)<\/span>/g, "$1");
    
    // Handle relation spans - just keep the content
    result = result.replace(/<span class="relation">(.*?)<\/span>/g, "$1");
    
    // Handle meta spans - just keep the content
    result = result.replace(/<span class="is-meta">(.*?)<\/span>/g, "$1");
    
    // Remove negation explainer span entirely
    result = result.replace(/<span class="negation-explainer">.*?<\/span>;?/g, "");
    
    // Remove any remaining HTML tags
    result = result.replace(/<\/?[^>]+(>|$)/g, "");
    
    // Clean up multiple spaces and trim
    result = result.replace(/\s+/g, " ").trim();
    
    return result;
}

// Update the exportHistoryToCSV function
// Function to clean premise text while preserving negated elements
function cleanPremiseText(text) {
    // Replace negated spans with content in *asterisks* to show they're negated
    let result = text.replace(/<span class="is-negated">(.*?)<\/span>/g, "*$1*");
    
    // Handle subject spans - just keep the content
    result = result.replace(/<span class="subject">(.*?)<\/span>/g, "$1");
    
    // Handle relation spans - just keep the content
    result = result.replace(/<span class="relation">(.*?)<\/span>/g, "$1");
    
    // Handle meta spans - just keep the content
    result = result.replace(/<span class="is-meta">(.*?)<\/span>/g, "$1");
    
    // Remove negation explainer span entirely
    result = result.replace(/<span class="negation-explainer">.*?<\/span>;?/g, "");
    
    // Remove any remaining HTML tags
    result = result.replace(/<\/?[^>]+(>|$)/g, "");
    
    // Clean up multiple spaces and trim
    result = result.replace(/\s+/g, " ").trim();
    
    return result;
}

function exportHistoryToCSV() {
    // Combine current and archived questions for export
    const allQuestions = [...(appState.archivedQuestions || []), ...appState.questions];
    
    if (allQuestions.length === 0) {
        alert("No history to export.");
        return;
    }
    
    // 1. Prepare CSV Header
    const csvHeader = [
        "Profile",
        "Category",
        "Type",
        "Number of Premises",
        "Premises",
        "Conclusion",
        "User Answer",
        "Correct Answer",
        "Response Time (s)",
        "Timer On",
        "Timestamp"
    ].join(",") + "\n";
    
    // 2. Format Data to CSV
    const csvRows = allQuestions.map(question => {

        const profileName = (question.profileName || "Default").replace(/"/g, '""');
        
        const category = question.category.replace(/"/g, '""');
        const type = question.type;
        const numPremises = question.premises.length;
        
        // Clean each premise but preserve negation with *asterisks*
        const cleanedPremises = question.premises
            .map(premise => cleanPremiseText(premise))
            .join(" | ")
            .replace(/"/g, '""');
            
        const cleanedConclusion = cleanPremiseText(question.conclusion).replace(/"/g, '""');
        const userAnswer = question.answerUser === undefined ? "MISSED" : (question.answerUser ? "TRUE" : "FALSE");
        const correctAnswer = question.isValid ? "TRUE" : "FALSE";
        const responseTime = question.timeElapsed !== undefined ? (question.timeElapsed / 1000).toFixed(2) : "";
        const timerOn = question.timerWasRunning === true ? "TRUE" : "FALSE";
        
        // Convert timestamp to human-readable format without milliseconds
        let formattedTimestamp = "";
        if (question.startedAt) {
            const date = new Date(question.startedAt);
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            const seconds = String(date.getSeconds()).padStart(2, '0');
            formattedTimestamp = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
        }
        
        return `"${profileName}","${category}","${type}","${numPremises}","${cleanedPremises}","${cleanedConclusion}","${userAnswer}","${correctAnswer}","${responseTime}","${timerOn}","${formattedTimestamp}"`;
    });
    
    // 3. Combine Header and Rows
    const csvContent = csvHeader + csvRows.join("\n");
    
    // 4. Create Download Link (Data URL)
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    
    // 5. Create and Trigger Download
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "syllogimous_v3_history.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url); // release the object URL
}

document.addEventListener("keydown", handleKeyPress);

registerEventHandlers();
load();
switchButtons();
init();
