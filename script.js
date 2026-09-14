/* =========================================================
   LINGUAVOICE - LANGUAGE TRANSLATOR
   Complete JavaScript
========================================================= */

"use strict";

/* =========================================================
   ELEMENTS
========================================================= */

const sourceLanguage = document.getElementById("sourceLanguage");
const targetLanguage = document.getElementById("targetLanguage");

const swapBtn = document.getElementById("swapBtn");

const sourceText = document.getElementById("sourceText");
const targetText = document.getElementById("targetText");

const characterCount = document.getElementById("characterCount");

const micBtn = document.getElementById("micBtn");
const micIcon = document.getElementById("micIcon");

const voiceStatus = document.getElementById("voiceStatus");
const voiceStatusText = document.getElementById("voiceStatusText");

const clearBtn = document.getElementById("clearBtn");

const speakBtn = document.getElementById("speakBtn");
const stopSpeakBtn = document.getElementById("stopSpeakBtn");
const copyBtn = document.getElementById("copyBtn");

const translateBtn = document.getElementById("translateBtn");
const translateIcon = document.getElementById("translateIcon");
const translateBtnText = document.getElementById("translateBtnText");

const translationStatus = document.getElementById("translationStatus");

const statusMessage = document.getElementById("statusMessage");

const themeBtn = document.getElementById("themeBtn");

const historyBtn = document.getElementById("historyBtn");
const historyPanel = document.getElementById("historyPanel");
const closeHistoryBtn = document.getElementById("closeHistoryBtn");
const historyOverlay = document.getElementById("historyOverlay");

const historySearch = document.getElementById("historySearch");
const historyCount = document.getElementById("historyCount");
const clearHistoryBtn = document.getElementById("clearHistoryBtn");
const historyList = document.getElementById("historyList");
const emptyHistory = document.getElementById("emptyHistory");

const toast = document.getElementById("toast");


/* =========================================================
   CONFIGURATION
========================================================= */

const STORAGE_KEY = "linguavoice_translation_history";
const THEME_KEY = "linguavoice_theme";

const MAX_TEXT_LENGTH = 5000;


/* =========================================================
   LANGUAGE INFORMATION
========================================================= */

const languages = {

    "en-US": {
        name: "English",
        code: "en",
        speechCode: "en-US"
    },

    "ta-IN": {
        name: "Tamil",
        code: "ta",
        speechCode: "ta-IN"
    },

    "hi-IN": {
        name: "Hindi",
        code: "hi",
        speechCode: "hi-IN"
    },

    "te-IN": {
        name: "Telugu",
        code: "te",
        speechCode: "te-IN"
    },

    "ml-IN": {
        name: "Malayalam",
        code: "ml",
        speechCode: "ml-IN"
    },

    "kn-IN": {
        name: "Kannada",
        code: "kn",
        speechCode: "kn-IN"
    },

    "mr-IN": {
        name: "Marathi",
        code: "mr",
        speechCode: "mr-IN"
    },

    "bn-IN": {
        name: "Bengali",
        code: "bn",
        speechCode: "bn-IN"
    },

    "gu-IN": {
        name: "Gujarati",
        code: "gu",
        speechCode: "gu-IN"
    },

    "fr-FR": {
        name: "French",
        code: "fr",
        speechCode: "fr-FR"
    },

    "de-DE": {
        name: "German",
        code: "de",
        speechCode: "de-DE"
    },

    "es-ES": {
        name: "Spanish",
        code: "es",
        speechCode: "es-ES"
    },

    "it-IT": {
        name: "Italian",
        code: "it",
        speechCode: "it-IT"
    },

    "pt-PT": {
        name: "Portuguese",
        code: "pt",
        speechCode: "pt-PT"
    },

    "ru-RU": {
        name: "Russian",
        code: "ru",
        speechCode: "ru-RU"
    },

    "ja-JP": {
        name: "Japanese",
        code: "ja",
        speechCode: "ja-JP"
    },

    "ko-KR": {
        name: "Korean",
        code: "ko",
        speechCode: "ko-KR"
    },

    "zh-CN": {
        name: "Chinese",
        code: "zh-CN",
        speechCode: "zh-CN"
    },

    "ar-SA": {
        name: "Arabic",
        code: "ar",
        speechCode: "ar-SA"
    }
};


/* =========================================================
   GLOBAL VARIABLES
========================================================= */

let recognition = null;

let isListening = false;

let isTranslating = false;

let historyData = [];

let availableVoices = [];


/* =========================================================
   INITIALIZATION
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    initializeTheme();

    loadHistory();

    initializeSpeechRecognition();

    loadSpeechVoices();

    updateCharacterCount();

    updateButtonStates();

    renderHistory();

});


/* =========================================================
   CHARACTER COUNT
========================================================= */

function updateCharacterCount() {

    if (!characterCount) {
        return;
    }

    const length = sourceText.value.length;

    characterCount.textContent =
        `${length}/${MAX_TEXT_LENGTH}`;
}


/* =========================================================
   TEXT INPUT
========================================================= */

sourceText.addEventListener("input", () => {

    if (sourceText.value.length > MAX_TEXT_LENGTH) {

        sourceText.value =
            sourceText.value.substring(0, MAX_TEXT_LENGTH);

        showToast(
            `Maximum ${MAX_TEXT_LENGTH} characters allowed.`,
            "warning"
        );
    }

    updateCharacterCount();

    updateButtonStates();

});


/* =========================================================
   BUTTON STATE
========================================================= */

function updateButtonStates() {

    const hasSourceText =
        sourceText.value.trim().length > 0;

    const hasTargetText =
        targetText.value.trim().length > 0;

    if (translateBtn) {
        translateBtn.disabled =
            !hasSourceText || isTranslating;
    }

    if (speakBtn) {
        speakBtn.disabled =
            !hasTargetText;
    }

    if (copyBtn) {
        copyBtn.disabled =
            !hasTargetText;
    }

    if (stopSpeakBtn) {
        stopSpeakBtn.disabled =
            !("speechSynthesis" in window);
    }
}


/* =========================================================
   TRANSLATION
========================================================= */

translateBtn.addEventListener("click", () => {

    translateText();

});


sourceText.addEventListener("keydown", (event) => {

    /*
       Ctrl + Enter / Cmd + Enter
       translates the text
    */

    if (
        (event.ctrlKey || event.metaKey) &&
        event.key === "Enter"
    ) {

        event.preventDefault();

        translateText();
    }

});


async function translateText() {

    const text = sourceText.value.trim();

    if (!text) {

        showStatus(
            "Please enter some text to translate.",
            "error"
        );

        showToast(
            "Enter text first.",
            "warning"
        );

        sourceText.focus();

        return;
    }

    if (sourceLanguage.value === targetLanguage.value) {

        targetText.value = text;

        showStatus(
            "Source and target languages are the same.",
            "success"
        );

        updateButtonStates();

        return;
    }

    const sourceInfo =
        languages[sourceLanguage.value];

    const targetInfo =
        languages[targetLanguage.value];

    if (!sourceInfo || !targetInfo) {

        showStatus(
            "Selected language is not supported.",
            "error"
        );

        return;
    }

    setTranslationLoading(true);

    try {

        const url =
            `https://api.mymemory.translated.net/get` +
            `?q=${encodeURIComponent(text)}` +
            `&langpair=${sourceInfo.code}|${targetInfo.code}`;

        const response =
            await fetch(url);

        if (!response.ok) {

            throw new Error(
                `Translation server returned ${response.status}`
            );
        }

        const data =
            await response.json();

        if (
            !data ||
            !data.responseData ||
            !data.responseData.translatedText
        ) {

            throw new Error(
                "No translation was returned."
            );
        }

        let translatedText =
            data.responseData.translatedText;

        /*
           MyMemory can sometimes return HTML entities.
        */

        translatedText =
            decodeHtmlEntities(translatedText);

        targetText.value =
            translatedText;

        showStatus(
            "Translation completed successfully.",
            "success"
        );

        saveTranslationHistory(
            text,
            translatedText
        );

        updateButtonStates();

    } catch (error) {

        console.error(
            "Translation error:",
            error
        );

        showStatus(
            "Unable to translate right now. Please try again.",
            "error"
        );

        showToast(
            "Translation failed. Check your internet connection.",
            "error"
        );

    } finally {

        setTranslationLoading(false);

    }
}


/* =========================================================
   TRANSLATION LOADING STATE
========================================================= */

function setTranslationLoading(loading) {

    isTranslating = loading;

    if (!translateBtn) {
        return;
    }

    if (loading) {

        translateBtn.disabled = true;

        translateBtn.classList.add("loading");

        if (translateIcon) {
            translateIcon.className =
                "fa-solid fa-spinner";
        }

        if (translateBtnText) {
            translateBtnText.textContent =
                "Translating...";
        }

        showStatus(
            "Translating your text...",
            "loading"
        );

    } else {

        translateBtn.classList.remove("loading");

        if (translateIcon) {
            translateIcon.className =
                "fa-solid fa-language";
        }

        if (translateBtnText) {
            translateBtnText.textContent =
                "Translate";
        }

        updateButtonStates();
    }
}


/* =========================================================
   HTML ENTITY DECODER
========================================================= */

function decodeHtmlEntities(text) {

    const textarea =
        document.createElement("textarea");

    textarea.innerHTML = text;

    return textarea.value;
}


/* =========================================================
   SWAP LANGUAGES
========================================================= */

swapBtn.addEventListener("click", () => {

    const oldSource =
        sourceLanguage.value;

    const oldText =
        sourceText.value;

    sourceLanguage.value =
        targetLanguage.value;

    targetLanguage.value =
        oldSource;

    sourceText.value =
        targetText.value;

    targetText.value =
        oldText;

    updateCharacterCount();

    updateButtonStates();

    updateVoiceLanguage();

    showToast(
        "Languages swapped.",
        "success"
    );

});


/* =========================================================
   CLEAR TEXT
========================================================= */

clearBtn.addEventListener("click", () => {

    stopListening();

    stopSpeaking();

    sourceText.value = "";

    targetText.value = "";

    updateCharacterCount();

    updateButtonStates();

    showStatus(
        "",
        ""
    );

    if (voiceStatusText) {
        voiceStatusText.textContent =
            "Ready for voice input";
    }

    showToast(
        "Text cleared.",
        "success"
    );

});


/* =========================================================
   SPEECH RECOGNITION
========================================================= */

function initializeSpeechRecognition() {

    const SpeechRecognition =
        window.SpeechRecognition ||
        window.webkitSpeechRecognition;

    if (!SpeechRecognition) {

        console.warn(
            "Speech Recognition API is not supported."
        );

        if (micBtn) {
            micBtn.title =
                "Voice input is not supported in this browser";
        }

        if (voiceStatusText) {
            voiceStatusText.textContent =
                "Voice input not supported in this browser";
        }

        return;
    }

    recognition =
        new SpeechRecognition();

    /*
       Important settings for reliable voice recognition
    */

    recognition.continuous = false;

    recognition.interimResults = true;

    recognition.maxAlternatives = 1;

    updateVoiceLanguage();

    /* ---------- START ---------- */

    recognition.onstart = () => {

        isListening = true;

        micBtn.classList.add("listening");

        if (micIcon) {
            micIcon.className =
                "fa-solid fa-stop";
        }

        if (voiceStatus) {
            voiceStatus.classList.add("active");
        }

        if (voiceStatusText) {
            voiceStatusText.textContent =
                "Listening... Speak now";
        }

        showToast(
            "Listening... Speak now.",
            "success"
        );
    };


    /* ---------- RESULT ---------- */

    recognition.onresult = (event) => {

        let finalTranscript = "";

        let interimTranscript = "";

        for (
            let i = event.resultIndex;
            i < event.results.length;
            i++
        ) {

            const transcript =
                event.results[i][0].transcript;

            if (
                event.results[i].isFinal
            ) {

                finalTranscript +=
                    transcript;

            } else {

                interimTranscript +=
                    transcript;
            }
        }

        /*
           Keep existing text and add new speech
           only when appropriate.
        */

        if (finalTranscript) {

            const existingText =
                sourceText.value.trim();

            if (existingText) {

                sourceText.value =
                    `${existingText} ${finalTranscript}`.trim();

            } else {

                sourceText.value =
                    finalTranscript.trim();
            }

            updateCharacterCount();

            updateButtonStates();

            /*
               Automatically translate after speech
               has produced final text.
            */

            setTimeout(() => {

                if (
                    sourceText.value.trim()
                ) {
                    translateText();
                }

            }, 300);
        }

        /*
           Show interim speech in status.
        */

        if (interimTranscript && voiceStatusText) {

            voiceStatusText.textContent =
                `Hearing: ${interimTranscript}`;
        }

    };


    /* ---------- END ---------- */

    recognition.onend = () => {

        isListening = false;

        micBtn.classList.remove("listening");

        if (micIcon) {
            micIcon.className =
                "fa-solid fa-microphone";
        }

        if (voiceStatus) {
            voiceStatus.classList.remove("active");
        }

        if (voiceStatusText) {
            voiceStatusText.textContent =
                "Ready for voice input";
        }
    };


    /* ---------- ERROR ---------- */

    recognition.onerror = (event) => {

        console.error(
            "Speech recognition error:",
            event.error
        );

        isListening = false;

        micBtn.classList.remove("listening");

        if (micIcon) {
            micIcon.className =
                "fa-solid fa-microphone";
        }

        if (voiceStatus) {
            voiceStatus.classList.remove("active");
        }

        let message =
            "Voice input failed.";

        switch (event.error) {

            case "not-allowed":
                message =
                    "Microphone permission was denied. Please allow microphone access.";
                break;

            case "service-not-allowed":
                message =
                    "Speech recognition service is not allowed.";
                break;

            case "no-speech":
                message =
                    "No speech detected. Please try again.";
                break;

            case "audio-capture":
                message =
                    "No microphone was detected.";
                break;

            case "network":
                message =
                    "Speech recognition needs an internet connection.";
                break;

            case "aborted":
                message =
                    "Voice input was stopped.";
                break;

            default:
                message =
                    `Voice input error: ${event.error}`;
        }

        if (voiceStatusText) {
            voiceStatusText.textContent =
                message;
        }

        showToast(
            message,
            "error"
        );
    };
}


/* =========================================================
   UPDATE SPEECH LANGUAGE
========================================================= */

function updateVoiceLanguage() {

    if (!recognition) {
        return;
    }

    const language =
        languages[sourceLanguage.value];

    if (language) {

        recognition.lang =
            language.speechCode;
    }
}


/* =========================================================
   MICROPHONE BUTTON
========================================================= */

micBtn.addEventListener("click", () => {

    if (!recognition) {

        showToast(
            "Voice input is not supported. Try Google Chrome or Microsoft Edge.",
            "error"
        );

        return;
    }

    updateVoiceLanguage();

    if (isListening) {

        stopListening();

    } else {

        startListening();
    }

});


/* =========================================================
   START LISTENING
========================================================= */

function startListening() {

    if (!recognition) {
        return;
    }

    /*
       Stop any currently running speech synthesis
       so the microphone does not hear the computer.
    */

    stopSpeaking();

    try {

        recognition.start();

    } catch (error) {

        console.warn(
            "Recognition start warning:",
            error
        );

        /*
           Sometimes calling start() twice produces
           InvalidStateError. We safely ignore it.
        */

        if (
            error.name !== "InvalidStateError"
        ) {

            showToast(
                "Unable to start microphone.",
                "error"
            );
        }
    }
}


/* =========================================================
   STOP LISTENING
========================================================= */

function stopListening() {

    if (
        recognition &&
        isListening
    ) {

        try {

            recognition.stop();

        } catch (error) {

            console.warn(
                "Recognition stop error:",
                error
            );
        }
    }

    isListening = false;

    if (micBtn) {
        micBtn.classList.remove("listening");
    }

    if (micIcon) {
        micIcon.className =
            "fa-solid fa-microphone";
    }

    if (voiceStatus) {
        voiceStatus.classList.remove("active");
    }

    if (voiceStatusText) {
        voiceStatusText.textContent =
            "Ready for voice input";
    }
}


/* =========================================================
   TEXT TO SPEECH
========================================================= */

speakBtn.addEventListener("click", () => {

    speakTranslation();

});


function speakTranslation() {

    const text =
        targetText.value.trim();

    if (!text) {

        showToast(
            "There is no translated text to speak.",
            "warning"
        );

        return;
    }

    if (!("speechSynthesis" in window)) {

        showToast(
            "Text-to-speech is not supported in this browser.",
            "error"
        );

        return;
    }

    stopSpeaking();

    const speech =
        new SpeechSynthesisUtterance(text);

    const language =
        languages[targetLanguage.value];

    if (language) {

        speech.lang =
            language.speechCode;
    }

    /*
       Select the best matching voice.
    */

    const matchingVoice =
        findBestVoice(
            language ? language.speechCode : targetLanguage.value
        );

    if (matchingVoice) {

        speech.voice =
            matchingVoice;
    }

    speech.rate = 0.95;

    speech.pitch = 1;

    speech.volume = 1;


    speech.onstart = () => {

        showToast(
            "Speaking translation...",
            "success"
        );

        speakBtn.disabled = true;

        stopSpeakBtn.disabled = false;
    };


    speech.onend = () => {

        speakBtn.disabled = false;

        updateButtonStates();
    };


    speech.onerror = (event) => {

        console.error(
            "Speech synthesis error:",
            event
        );

        speakBtn.disabled = false;

        updateButtonStates();

        showToast(
            "Unable to speak the translation.",
            "error"
        );
    };


    window.speechSynthesis.speak(
        speech
    );
}


/* =========================================================
   FIND BEST SPEECH VOICE
========================================================= */

function findBestVoice(languageCode) {

    if (!availableVoices.length) {
        return null;
    }

    /*
       Exact match
    */

    let voice =
        availableVoices.find(
            v => v.lang.toLowerCase() ===
                languageCode.toLowerCase()
        );

    if (voice) {
        return voice;
    }

    /*
       Language-only match
       Example:
       ta-IN -> ta
    */

    const shortLanguage =
        languageCode
            .split("-")[0]
            .toLowerCase();

    voice =
        availableVoices.find(
            v =>
                v.lang
                    .toLowerCase()
                    .startsWith(shortLanguage)
        );

    return voice || null;
}


/* =========================================================
   LOAD SPEECH VOICES
========================================================= */

function loadSpeechVoices() {

    if (
        !("speechSynthesis" in window)
    ) {
        return;
    }

    availableVoices =
        window.speechSynthesis.getVoices();

    /*
       Chrome often loads voices asynchronously.
    */

    window.speechSynthesis.onvoiceschanged =
        () => {

            availableVoices =
                window.speechSynthesis.getVoices();
        };
}


/* =========================================================
   STOP SPEECH
========================================================= */

stopSpeakBtn.addEventListener("click", () => {

    stopSpeaking();

});


function stopSpeaking() {

    if (
        "speechSynthesis" in window
    ) {

        window.speechSynthesis.cancel();
    }

    if (speakBtn) {
        speakBtn.disabled = false;
    }

    updateButtonStates();
}


/* =========================================================
   COPY TRANSLATION
========================================================= */

copyBtn.addEventListener("click", async () => {

    const text =
        targetText.value.trim();

    if (!text) {

        showToast(
            "Nothing to copy.",
            "warning"
        );

        return;
    }

    try {

        /*
           Modern clipboard API
        */

        await navigator.clipboard.writeText(
            text
        );

        showToast(
            "Translation copied to clipboard.",
            "success"
        );

    } catch (error) {

        /*
           Fallback method
        */

        try {

            const temporaryTextarea =
                document.createElement("textarea");

            temporaryTextarea.value =
                text;

            temporaryTextarea.style.position =
                "fixed";

            temporaryTextarea.style.opacity =
                "0";

            document.body.appendChild(
                temporaryTextarea
            );

            temporaryTextarea.select();

            document.execCommand("copy");

            temporaryTextarea.remove();

            showToast(
                "Translation copied.",
                "success"
            );

        } catch (fallbackError) {

            showToast(
                "Unable to copy translation.",
                "error"
            );
        }
    }
});


/* =========================================================
   TRANSLATION HISTORY
========================================================= */

function loadHistory() {

    try {

        const stored =
            localStorage.getItem(
                STORAGE_KEY
            );

        if (!stored) {

            historyData = [];

            return;
        }

        const parsed =
            JSON.parse(stored);

        if (Array.isArray(parsed)) {

            historyData = parsed;

        } else {

            historyData = [];
        }

    } catch (error) {

        console.error(
            "History loading error:",
            error
        );

        historyData = [];
    }
}


/* =========================================================
   SAVE HISTORY
========================================================= */

function saveTranslationHistory(
    originalText,
    translatedText
) {

    const source =
        languages[sourceLanguage.value];

    const target =
        languages[targetLanguage.value];

    if (!source || !target) {
        return;
    }

    /*
       Prevent duplicate history entries
       when exactly the same translation is repeated.
    */

    const latest =
        historyData[0];

    if (
        latest &&
        latest.sourceText === originalText &&
        latest.translatedText === translatedText &&
        latest.sourceCode === source.code &&
        latest.targetCode === target.code
    ) {

        /*
           Update time instead of creating
           unnecessary duplicate.
        */

        latest.dateTime =
            new Date().toISOString();

        latest.timestamp =
            Date.now();

        saveHistoryToStorage();

        renderHistory();

        return;
    }

    const historyItem = {

        id:
            Date.now().toString() +
            Math.random()
                .toString(36)
                .substring(2, 8),

        sourceLanguage:
            source.name,

        targetLanguage:
            target.name,

        sourceCode:
            source.code,

        targetCode:
            target.code,

        speechSourceCode:
            source.speechCode,

        speechTargetCode:
            target.speechCode,

        sourceText:
            originalText,

        translatedText:
            translatedText,

        dateTime:
            new Date().toISOString(),

        timestamp:
            Date.now()
    };

    /*
       Newest item first.
    */

    historyData.unshift(
        historyItem
    );

    /*
       Keep the latest 100 translations.
    */

    if (historyData.length > 100) {

        historyData =
            historyData.slice(0, 100);
    }

    saveHistoryToStorage();

    renderHistory();
}


/* =========================================================
   SAVE HISTORY TO LOCAL STORAGE
========================================================= */

function saveHistoryToStorage() {

    try {

        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(historyData)
        );

    } catch (error) {

        console.error(
            "Unable to save history:",
            error
        );

        showToast(
            "Unable to save translation history.",
            "error"
        );
    }
}


/* =========================================================
   RENDER HISTORY
========================================================= */

function renderHistory() {

    if (!historyList) {
        return;
    }

    const searchTerm =
        historySearch
            ? historySearch.value
                .trim()
                .toLowerCase()
            : "";

    let filteredHistory =
        historyData;

    if (searchTerm) {

        filteredHistory =
            historyData.filter(item => {

                return (

                    item.sourceText
                        .toLowerCase()
                        .includes(searchTerm)

                    ||

                    item.translatedText
                        .toLowerCase()
                        .includes(searchTerm)

                    ||

                    item.sourceLanguage
                        .toLowerCase()
                        .includes(searchTerm)

                    ||

                    item.targetLanguage
                        .toLowerCase()
                        .includes(searchTerm)
                );
            });
    }

    historyList.innerHTML = "";

    /*
       Update total history count.
    */

    if (historyCount) {

        historyCount.textContent =
            historyData.length;
    }


    /*
       Empty state
    */

    if (!filteredHistory.length) {

        if (emptyHistory) {

            emptyHistory.style.display =
                "flex";
        }

        return;
    }

    if (emptyHistory) {

        emptyHistory.style.display =
            "none";
    }


    filteredHistory.forEach(item => {

        const historyElement =
            createHistoryElement(item);

        historyList.appendChild(
            historyElement
        );
    });
}


/* =========================================================
   CREATE HISTORY ELEMENT
========================================================= */

function createHistoryElement(item) {

    const article =
        document.createElement("article");

    article.className =
        "history-item";

    article.dataset.id =
        item.id;


    /* ---------- HEADER ---------- */

    const header =
        document.createElement("div");

    header.className =
        "history-item-header";


    const pair =
        document.createElement("div");

    pair.className =
        "language-pair";

    pair.innerHTML = `
        <span>${escapeHtml(item.sourceLanguage)}</span>
        <i class="fa-solid fa-arrow-right"></i>
        <span>${escapeHtml(item.targetLanguage)}</span>
    `;


    const date =
        document.createElement("div");

    date.className =
        "history-date";

    date.textContent =
        formatDateTime(item.dateTime);


    header.appendChild(pair);

    header.appendChild(date);


    /* ---------- SOURCE ---------- */

    const source =
        document.createElement("div");

    source.className =
        "history-source";

    source.innerHTML = `
        <strong>You:</strong>
        ${escapeHtml(item.sourceText)}
    `;


    /* ---------- TRANSLATION ---------- */

    const translation =
        document.createElement("div");

    translation.className =
        "history-translation";

    translation.innerHTML = `
        <strong>Translation:</strong>
        ${escapeHtml(item.translatedText)}
    `;


    /* ---------- ACTIONS ---------- */

    const actions =
        document.createElement("div");

    actions.className =
        "history-item-actions";


    /*
       Reuse translation
    */

    const reuseBtn =
        document.createElement("button");

    reuseBtn.className =
        "history-action-btn";

    reuseBtn.title =
        "Use this translation";

    reuseBtn.innerHTML =
        '<i class="fa-solid fa-rotate-left"></i>';

    reuseBtn.addEventListener(
        "click",
        () => {

            sourceLanguage.value =
                findLanguageSelectValue(
                    item.sourceCode
                );

            targetLanguage.value =
                findLanguageSelectValue(
                    item.targetCode
                );

            sourceText.value =
                item.sourceText;

            targetText.value =
                item.translatedText;

            updateCharacterCount();

            updateButtonStates();

            updateVoiceLanguage();

            closeHistory();

            showToast(
                "Translation loaded.",
                "success"
            );
        }
    );


    /*
       Copy
    */

    const copyHistoryBtn =
        document.createElement("button");

    copyHistoryBtn.className =
        "history-action-btn";

    copyHistoryBtn.title =
        "Copy translation";

    copyHistoryBtn.innerHTML =
        '<i class="fa-solid fa-copy"></i>';

    copyHistoryBtn.addEventListener(
        "click",
        async () => {

            try {

                await navigator.clipboard.writeText(
                    item.translatedText
                );

                showToast(
                    "Translation copied.",
                    "success"
                );

            } catch (error) {

                showToast(
                    "Unable to copy translation.",
                    "error"
                );
            }
        }
    );


    /*
       Delete
    */

    const deleteBtn =
        document.createElement("button");

    deleteBtn.className =
        "history-action-btn delete";

    deleteBtn.title =
        "Delete this history item";

    deleteBtn.innerHTML =
        '<i class="fa-solid fa-trash"></i>';

    deleteBtn.addEventListener(
        "click",
        () => {

            deleteHistoryItem(
                item.id
            );
        }
    );


    actions.appendChild(
        reuseBtn
    );

    actions.appendChild(
        copyHistoryBtn
    );

    actions.appendChild(
        deleteBtn
    );


    article.appendChild(
        header
    );

    article.appendChild(
        source
    );

    article.appendChild(
        translation
    );

    article.appendChild(
        actions
    );


    return article;
}


/* =========================================================
   FIND LANGUAGE SELECT VALUE
========================================================= */

function findLanguageSelectValue(
    languageCode
) {

    /*
       The select uses values such as:
       en-US, ta-IN, hi-IN etc.

       History stores MyMemory code:
       en, ta, hi etc.
    */

    for (
        const value in languages
    ) {

        if (
            languages[value].code ===
            languageCode
        ) {

            return value;
        }
    }

    return sourceLanguage.value;
}


/* =========================================================
   DELETE ONE HISTORY ITEM
========================================================= */

function deleteHistoryItem(id) {

    historyData =
        historyData.filter(
            item => item.id !== id
        );

    saveHistoryToStorage();

    renderHistory();

    showToast(
        "History item deleted.",
        "success"
    );
}


/* =========================================================
   CLEAR ALL HISTORY
========================================================= */

clearHistoryBtn.addEventListener(
    "click",
    () => {

        if (!historyData.length) {

            showToast(
                "History is already empty.",
                "warning"
            );

            return;
        }

        const confirmed =
            confirm(
                "Are you sure you want to delete all translation history?"
            );

        if (!confirmed) {
            return;
        }

        historyData = [];

        saveHistoryToStorage();

        renderHistory();

        showToast(
            "All translation history cleared.",
            "success"
        );
    }
);


/* =========================================================
   HISTORY SEARCH
========================================================= */

if (historySearch) {

    historySearch.addEventListener(
        "input",
        () => {

            renderHistory();

        }
    );
}


/* =========================================================
   HISTORY PANEL
========================================================= */

historyBtn.addEventListener(
    "click",
    () => {

        openHistory();

    }
);


closeHistoryBtn.addEventListener(
    "click",
    () => {

        closeHistory();

    }
);


historyOverlay.addEventListener(
    "click",
    () => {

        closeHistory();

    }
);


function openHistory() {

    historyPanel.classList.add(
        "open"
    );

    historyOverlay.classList.add(
        "active"
    );

    document.body.style.overflow =
        "hidden";

    renderHistory();
}


function closeHistory() {

    historyPanel.classList.remove(
        "open"
    );

    historyOverlay.classList.remove(
        "active"
    );

    document.body.style.overflow =
        "";
}


/* =========================================================
   ESCAPE KEY
========================================================= */

document.addEventListener(
    "keydown",
    event => {

        if (event.key === "Escape") {

            if (
                historyPanel.classList.contains(
                    "open"
                )
            ) {

                closeHistory();
            }

            if (isListening) {

                stopListening();
            }
        }
    }
);


/* =========================================================
   DARK MODE
========================================================= */

themeBtn.addEventListener(
    "click",
    () => {

        const isDark =
            document.body.classList.toggle(
                "dark-mode"
            );

        localStorage.setItem(
            THEME_KEY,
            isDark ? "dark" : "light"
        );

        updateThemeIcon();

    }
);


/* =========================================================
   INITIALIZE THEME
========================================================= */

function initializeTheme() {

    const savedTheme =
        localStorage.getItem(
            THEME_KEY
        );

    if (savedTheme === "dark") {

        document.body.classList.add(
            "dark-mode"
        );

    } else if (
        savedTheme === "light"
    ) {

        document.body.classList.remove(
            "dark-mode"
        );

    } else {

        /*
           Use system preference if
           user has never selected a theme.
        */

        if (
            window.matchMedia &&
            window.matchMedia(
                "(prefers-color-scheme: dark)"
            ).matches
        ) {

            document.body.classList.add(
                "dark-mode"
            );
        }
    }

    updateThemeIcon();
}


/* =========================================================
   UPDATE THEME ICON
========================================================= */

function updateThemeIcon() {

    if (!themeBtn) {
        return;
    }

    const icon =
        themeBtn.querySelector("i");

    if (!icon) {
        return;
    }

    if (
        document.body.classList.contains(
            "dark-mode"
        )
    ) {

        icon.className =
            "fa-solid fa-sun";

        themeBtn.title =
            "Switch to light mode";

    } else {

        icon.className =
            "fa-solid fa-moon";

        themeBtn.title =
            "Switch to dark mode";
    }
}


/* =========================================================
   STATUS MESSAGE
========================================================= */

function showStatus(
    message,
    type = ""
) {

    if (!statusMessage) {
        return;
    }

    statusMessage.textContent =
        message;

    statusMessage.className =
        "status-message";

    if (type) {

        statusMessage.classList.add(
            type
        );
    }
}


/* =========================================================
   TRANSLATION STATUS
========================================================= */

function updateTranslationStatus(
    message,
    type = ""
) {

    if (!translationStatus) {
        return;
    }

    translationStatus.textContent =
        message;

    translationStatus.className =
        "translation-status";

    if (type) {

        translationStatus.classList.add(
            type
        );
    }
}


/* =========================================================
   TOAST
========================================================= */

let toastTimer = null;

function showToast(
    message,
    type = ""
) {

    if (!toast) {
        return;
    }

    toast.textContent =
        message;

    toast.className =
        "toast";

    if (type) {

        toast.classList.add(
            type
        );
    }

    /*
       Force reflow so repeated toast messages
       animate correctly.
    */

    void toast.offsetWidth;

    toast.classList.add(
        "show"
    );

    clearTimeout(
        toastTimer
    );

    toastTimer =
        setTimeout(() => {

            toast.classList.remove(
                "show"
            );

        }, 3000);
}


/* =========================================================
   FORMAT DATE AND TIME
========================================================= */

function formatDateTime(
    isoString
) {

    try {

        const date =
            new Date(isoString);

        return date.toLocaleString(
            undefined,
            {
                dateStyle: "medium",
                timeStyle: "short"
            }
        );

    } catch (error) {

        return "Unknown date";
    }
}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHtml(value) {

    const div =
        document.createElement("div");

    div.textContent =
        value;

    return div.innerHTML;
}


/* =========================================================
   LANGUAGE CHANGE EVENTS
========================================================= */

sourceLanguage.addEventListener(
    "change",
    () => {

        updateVoiceLanguage();

        /*
           Clear old output because the
           source language changed.
        */

        targetText.value = "";

        updateButtonStates();

    }
);


targetLanguage.addEventListener(
    "change",
    () => {

        targetText.value = "";

        updateButtonStates();

    }
);


/* =========================================================
   ONLINE / OFFLINE STATUS
========================================================= */

window.addEventListener(
    "online",
    () => {

        showToast(
            "Internet connection restored.",
            "success"
        );
    }
);


window.addEventListener(
    "offline",
    () => {

        showToast(
            "You are offline. Translation requires internet.",
            "warning"
        );
    }
);


/* =========================================================
   BEFORE PAGE CLOSE
========================================================= */

window.addEventListener(
    "beforeunload",
    () => {

        stopListening();

        stopSpeaking();
    }
);