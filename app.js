// KhoaEng Main Application Logic (Updated Clean & Frameless UI)

// =========================================================================
// Anti-Zoom & Anti-Inspect Protection (No Zoom, Block Ctrl+U, F12, DevTools)
// =========================================================================
(function initPageProtection() {
    // 1. Block Keyboard Shortcuts: F12, Ctrl+U, Ctrl+Shift+I/J/C/K, Ctrl+S, and Zoom Shortcuts
    window.addEventListener("keydown", (e) => {
        const key = e.key ? e.key.toLowerCase() : "";
        const code = e.keyCode || e.which;
        const isCtrl = e.ctrlKey || e.metaKey;

        // Block F12 (Developer Tools)
        if (key === "f12" || code === 123) {
            e.preventDefault();
            e.stopPropagation();
            return false;
        }

        if (isCtrl) {
            // Block Ctrl + U (View Page Source)
            if (key === "u" || code === 85) {
                e.preventDefault();
                e.stopPropagation();
                return false;
            }

            // Block Ctrl + Shift + I / J / C / K (DevTools Inspect, Console)
            if (e.shiftKey && (key === "i" || key === "j" || key === "c" || key === "k" || code === 73 || code === 74 || code === 67 || code === 75)) {
                e.preventDefault();
                e.stopPropagation();
                return false;
            }

            // Block Ctrl + S (Save Page Source)
            if (key === "s" || code === 83) {
                e.preventDefault();
                e.stopPropagation();
                return false;
            }

            // Block Browser Keyboard Zoom (+, -, =, 0, numpad +, numpad -)
            if (
                key === "+" || key === "=" || key === "-" || key === "_" || key === "0" ||
                code === 187 || code === 189 || code === 107 || code === 109 || code === 48 || code === 96
            ) {
                e.preventDefault();
                e.stopPropagation();
                return false;
            }
        }
    }, { capture: true, passive: false });

    // 2. Block Desktop Mouse Wheel Zoom (Ctrl + Wheel)
    window.addEventListener("wheel", (e) => {
        if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
        }
    }, { passive: false });

    // 3. Block Multi-Touch Pinch Zoom
    document.addEventListener("touchstart", (e) => {
        if (e.touches && e.touches.length > 1) {
            e.preventDefault();
        }
    }, { passive: false });

    document.addEventListener("touchmove", (e) => {
        if (e.touches && e.touches.length > 1) {
            e.preventDefault();
        }
    }, { passive: false });

    // 4. Block iOS Safari Gesture Zoom Events
    document.addEventListener("gesturestart", (e) => e.preventDefault());
    document.addEventListener("gesturechange", (e) => e.preventDefault());
    document.addEventListener("gestureend", (e) => e.preventDefault());

    // 5. Block Double-Tap Zoom on Mobile (while preserving normal tapping)
    let lastTouchTime = 0;
    document.addEventListener("touchend", (e) => {
        const now = Date.now();
        if (now - lastTouchTime <= 300) {
            const tag = (e.target.tagName || "").toUpperCase();
            if (tag !== "INPUT" && tag !== "TEXTAREA" && tag !== "BUTTON") {
                e.preventDefault();
            }
        }
        lastTouchTime = now;
    }, { passive: false });

    // 6. Block Right-Click Context Menu (to prevent Inspect / View Source via Mouse)
    document.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        return false;
    });
})();

document.addEventListener("DOMContentLoaded", () => {
    // Configure Marked.js for GFM tables & line breaks
    if (typeof marked !== "undefined") {
        marked.setOptions({
            gfm: true,
            breaks: true
        });
    }

    // Helper to render markdown and make tables responsive
    function renderMarkdown(content) {
        if (!content) return "";
        let html = marked.parse(content);
        // Wrap tables in responsive wrapper for mobile
        html = html.replace(/<table/g, '<div class="table-responsive-wrapper"><table');
        html = html.replace(/<\/table>/g, '</table></div>');
        return html;
    }

    // -------------------------------------------------------------------------
    // Application State
    // -------------------------------------------------------------------------
    const state = {
        questionCount: 12,
        currentQuestions: [],
        userAnswers: [],
        currentIndex: 0,
        timerSeconds: 0,
        timerInterval: null,
        hintsCache: {},
        chatHistory: [],
        isGeneratingExam: false,
        knowledgeChart: null
    };

    // Load question history from localStorage to avoid duplicates
    function getQuestionHistory() {
        try {
            return JSON.parse(localStorage.getItem('khoaeng_question_history')) || [];
        } catch (e) {
            return [];
        }
    }

    function saveQuestionHistory(questions) {
        try {
            const history = getQuestionHistory();
            const newSignatures = questions.map(q => `${q.topic || q.category}: ${q.question.slice(0, 45)}`);
            const combined = [...history, ...newSignatures].slice(-60); // keep last 60
            localStorage.setItem('khoaeng_question_history', JSON.stringify(combined));
        } catch (e) {
            console.error("Failed to save question history", e);
        }
    }

    // -------------------------------------------------------------------------
    // DOM Elements
    // -------------------------------------------------------------------------
    const screens = {
        home: document.getElementById("screen-home"),
        quiz: document.getElementById("screen-quiz"),
        results: document.getElementById("screen-results")
    };

    // Header controls
    const btnSoundToggle = document.getElementById("btn-sound-toggle");
    const soundIcon = document.getElementById("sound-icon");
    const btnOpenChat = document.getElementById("btn-open-chat");
    const btnOpenSettings = document.getElementById("btn-open-settings");

    // Home view elements
    const countSlider = document.getElementById("count-slider");
    const countDisplay = document.getElementById("count-display");
    const presetPills = document.querySelectorAll(".pill-btn");
    const focusToggle = document.getElementById("focus-toggle");
    const focusChips = document.querySelectorAll(".focus-chip");
    const focusCustomInput = document.getElementById("focus-custom-input");
    const customReqInput = document.getElementById("custom-req-input");
    const tagButtons = document.querySelectorAll(".text-tag");
    const btnStartExam = document.getElementById("btn-start-exam");
    const loadingBox = document.getElementById("loading-box");

    // Quiz view elements
    const quizTimer = document.getElementById("quiz-timer");
    const quizProgressText = document.getElementById("quiz-progress-text");
    const quizProgressBar = document.getElementById("quiz-progress-bar");
    const btnQuizChat = document.getElementById("btn-quiz-chat");
    const btnOpenGrid = document.getElementById("btn-open-grid");
    const questionContainer = document.getElementById("question-container");
    const btnPrevQ = document.getElementById("btn-prev-q");
    const btnNextQ = document.getElementById("btn-next-q");
    const btnSubmitQuiz = document.getElementById("btn-submit-quiz");
    const btnQuitQuiz = document.getElementById("btn-quit-quiz");

    // Question Grid Modal
    const gridModal = document.getElementById("grid-modal");
    const gridCloseBtn = document.getElementById("grid-close-btn");
    const gridContainer = document.getElementById("grid-container");

    // Results view elements
    const resScoreNum = document.getElementById("res-score-num");
    const resScoreTitle = document.getElementById("res-score-title");
    const resCorrectCount = document.getElementById("res-correct-count");
    const resTimeSpent = document.getElementById("res-time-spent");
    const resAccuracy = document.getElementById("res-accuracy");
    const diagnosticContent = document.getElementById("diagnostic-content");
    const reviewList = document.getElementById("review-list");
    const btnRepeatExam = document.getElementById("btn-repeat-exam");
    const btnDownloadReport = document.getElementById("btn-download-report");
    const btnBackHome = document.getElementById("btn-back-home");

    // Chat elements
    const chatDrawer = document.getElementById("chat-drawer");
    const chatCloseBtn = document.getElementById("chat-close-btn");
    const chatFabBtn = document.getElementById("chat-fab-btn");
    const chatMessages = document.getElementById("chat-messages");
    const chatInput = document.getElementById("chat-input");
    const chatSendBtn = document.getElementById("chat-send-btn");
    const chatChips = document.querySelectorAll(".chat-chip");

    // Settings Modal elements
    const settingsModal = document.getElementById("settings-modal");
    const settingsCloseBtn = document.getElementById("settings-close-btn");
    const inputApiKey = document.getElementById("input-api-key");
    const selectModel = document.getElementById("select-model");
    const btnSaveSettings = document.getElementById("btn-save-settings");
    const btnTestApi = document.getElementById("btn-test-api");
    const apiStatusMsg = document.getElementById("api-status-msg");

    // -------------------------------------------------------------------------
    // Screen Navigation
    // -------------------------------------------------------------------------
    function showScreen(screenKey) {
        Object.keys(screens).forEach(key => {
            if (screens[key]) {
                screens[key].classList.toggle("active", key === screenKey);
            }
        });
        document.body.classList.toggle("in-quiz", screenKey === "quiz");
        document.body.classList.toggle("in-results", screenKey === "results");
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    // -------------------------------------------------------------------------
    // Sound Toggle
    // -------------------------------------------------------------------------
    function updateSoundIcon() {
        const isMuted = window.khoaSound.isMuted();
        btnSoundToggle.classList.toggle("active", !isMuted);
        if (isMuted) {
            soundIcon.innerHTML = `
                <path d="M11 5L6 9H2v6h4l5 4V5z"/>
                <line x1="23" y1="9" x2="17" y2="15"/>
                <line x1="17" y1="9" x2="23" y2="15"/>
            `;
            btnSoundToggle.title = "Bật âm thanh";
        } else {
            soundIcon.innerHTML = `
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
            `;
            btnSoundToggle.title = "Tắt âm thanh";
        }
    }

    btnSoundToggle.addEventListener("click", () => {
        window.khoaSound.toggleMute();
        updateSoundIcon();
    });
    updateSoundIcon();

    // -------------------------------------------------------------------------
    // Question Count Selector (Min 12 - Max 20)
    // -------------------------------------------------------------------------
    function updateQuestionCount(val) {
        state.questionCount = parseInt(val);
        countSlider.value = state.questionCount;
        countDisplay.textContent = `${state.questionCount} câu`;

        presetPills.forEach(pill => {
            pill.classList.toggle("active", parseInt(pill.dataset.count) === state.questionCount);
        });
    }

    countSlider.addEventListener("input", (e) => {
        updateQuestionCount(e.target.value);
    });

    presetPills.forEach(pill => {
        pill.addEventListener("click", () => {
            window.khoaSound.playTap();
            updateQuestionCount(pill.dataset.count);
        });
    });

    // Tag buttons for "Yêu cầu thêm"
    tagButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            window.khoaSound.playTap();
            const tagText = btn.dataset.tag;
            const current = customReqInput.value.trim();
            if (!current) {
                customReqInput.value = tagText;
            } else if (!current.includes(tagText)) {
                customReqInput.value = `${current}, ${tagText}`;
            }
            customReqInput.focus();
        });
    });

    // Focus Mode (Chỉ tập trung) Event Listeners
    if (focusChips) {
        focusChips.forEach(chip => {
            chip.addEventListener("click", () => {
                window.khoaSound.playTap();
                chip.classList.toggle("active");
                const anyActive = document.querySelectorAll(".focus-chip.active").length > 0;
                const hasCustom = focusCustomInput && focusCustomInput.value.trim().length > 0;
                if (focusToggle) focusToggle.checked = anyActive || hasCustom;
            });
        });
    }

    if (focusCustomInput) {
        focusCustomInput.addEventListener("input", () => {
            if (focusToggle && focusCustomInput.value.trim().length > 0) {
                focusToggle.checked = true;
            }
        });
    }

    // -------------------------------------------------------------------------
    // Exam Generation & Start
    // -------------------------------------------------------------------------
    async function startExam() {
        if (state.isGeneratingExam) return;
        state.isGeneratingExam = true;

        btnStartExam.disabled = true;
        loadingBox.style.display = "block";
        window.khoaSound.playTap();

        const count = state.questionCount;
        const customReq = customReqInput.value.trim();
        const history = getQuestionHistory();

        // Focus mode values
        const isFocusOnly = focusToggle ? focusToggle.checked : false;
        const selectedFocusTopics = Array.from(document.querySelectorAll(".focus-chip.active")).map(c => c.dataset.topic);
        const customFocus = focusCustomInput ? focusCustomInput.value.trim() : "";
        let combinedFocus = [...selectedFocusTopics];
        if (customFocus) combinedFocus.push(customFocus);

        try {
            const examData = await window.khoaAI.generateExam(count, customReq, history, isFocusOnly, combinedFocus);
            state.currentQuestions = examData.questions;
            state.userAnswers = new Array(state.currentQuestions.length).fill(null);
            state.currentIndex = 0;
            state.hintsCache = {};
            state.timerSeconds = 0;

            // Start Timer
            if (state.timerInterval) clearInterval(state.timerInterval);
            state.timerInterval = setInterval(updateTimer, 1000);

            showScreen("quiz");
            renderQuestion(state.currentIndex);
        } catch (err) {
            console.error("Failed to generate exam", err);
            alert("Có lỗi khi tạo đề thi: " + err.message + "\nHệ thống sẽ tải bộ đề chuẩn thay thế.");
        } finally {
            state.isGeneratingExam = false;
            btnStartExam.disabled = false;
            loadingBox.style.display = "none";
        }
    }

    btnStartExam.addEventListener("click", startExam);

    // -------------------------------------------------------------------------
    // Timer
    // -------------------------------------------------------------------------
    function updateTimer() {
        state.timerSeconds++;
        const mins = Math.floor(state.timerSeconds / 60);
        const secs = state.timerSeconds % 60;
        quizTimer.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    // -------------------------------------------------------------------------
    // Render Question (Frameless & Clean)
    // -------------------------------------------------------------------------
    function renderQuestion(index) {
        if (!state.currentQuestions || !state.currentQuestions[index]) return;

        state.currentIndex = index;
        const q = state.currentQuestions[index];
        const total = state.currentQuestions.length;

        // Update progress indicators
        quizProgressText.textContent = `Câu ${index + 1}/${total}`;
        const progressPct = ((index + 1) / total) * 100;
        quizProgressBar.style.width = `${progressPct}%`;

        // Navigation button states
        btnPrevQ.disabled = index === 0;
        if (index === total - 1) {
            btnNextQ.style.display = "none";
            btnSubmitQuiz.style.display = "flex";
        } else {
            btnNextQ.style.display = "flex";
            btnSubmitQuiz.style.display = "none";
        }

        // Render passage/context if present ("ĐỀ" - KHÔNG ĐẬM)
        let contextHtml = "";
        if (q.context && q.context.trim() && q.context.trim() !== q.question.trim()) {
            contextHtml = `
                <div class="passage-block">
                    <div class="passage-header">
                        <span class="passage-title">Đoạn văn / Ngữ cảnh (Đề):</span>
                        <button class="btn-translate-tag" id="btn-trans-context" title="Dịch đoạn văn">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M5 8l6 6"/>
                                <path d="M4 14h8"/>
                                <path d="M2 5h12"/>
                                <path d="M7 2h1"/>
                                <path d="M22 22l-5-10-5 10"/>
                                <path d="M14 18h6"/>
                            </svg>
                            <span id="txt-trans-context">Dịch đề</span>
                        </button>
                    </div>
                    <div class="passage-text-normal">${escapeHtml(q.context)}</div>
                    <div class="translation-reveal" id="trans-context-box" style="display:none;"></div>
                </div>
            `;
        }

        const letters = ["A", "B", "C", "D"];
        const selectedLetter = state.userAnswers[index];

        const optionsHtml = q.options.map((opt, i) => {
            const letter = letters[i];
            const isSelected = selectedLetter === letter;
            let text = opt.replace(/^[A-D]\.\s*/, '').trim();

            return `
                <div class="option-row ${isSelected ? 'selected' : ''}" data-letter="${letter}">
                    <span class="option-key">${letter}.</span>
                    <span class="option-desc">${escapeHtml(text)}</span>
                </div>
            `;
        }).join("");

        questionContainer.innerHTML = `
            <div class="question-view">
                <div class="question-header">
                    <span class="clean-category">${escapeHtml(q.category || "Trắc nghiệm")}</span>
                    <span class="clean-topic">• ${escapeHtml(q.topic || "")}</span>
                </div>

                ${contextHtml}

                <div class="question-prompt-block">
                    <div class="question-prompt-row">
                        <div class="question-prompt-bold">Câu ${index + 1}: ${escapeHtml(q.question)}</div>
                        <button class="btn-translate-tag" id="btn-trans-q" title="Dịch câu hỏi">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M5 8l6 6"/>
                                <path d="M4 14h8"/>
                                <path d="M2 5h12"/>
                                <path d="M7 2h1"/>
                                <path d="M22 22l-5-10-5 10"/>
                                <path d="M14 18h6"/>
                            </svg>
                            <span id="txt-trans-q">Dịch câu hỏi</span>
                        </button>
                    </div>
                    <div class="translation-reveal" id="trans-q-box" style="display:none;"></div>
                </div>

                <div class="options-stack">
                    ${optionsHtml}
                </div>

                <div class="hint-toggle-bar">
                    <button class="btn-open-hint" id="btn-show-hint">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <line x1="9" y1="18" x2="15" y2="18"/>
                            <line x1="10" y1="22" x2="14" y2="22"/>
                            <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14"/>
                        </svg>
                        Hướng dẫn từ Khoa Eng (Không đáp án)
                    </button>
                </div>

                <div class="hint-readout" id="hint-box">
                    <div class="hint-header">
                        <span class="hint-label">Gợi ý tư duy từ Khoa Eng</span>
                        <button class="btn-clean-text" id="btn-close-hint">Đóng [✕]</button>
                    </div>
                    <div class="hint-body-text" id="hint-body">Đang tải gợi ý...</div>
                </div>
            </div>
        `;

        // Translation handlers for passage and question
        const btnTransContext = document.getElementById("btn-trans-context");
        const transContextBox = document.getElementById("trans-context-box");
        const txtTransContext = document.getElementById("txt-trans-context");

        if (btnTransContext && transContextBox) {
            btnTransContext.addEventListener("click", async () => {
                window.khoaSound.playTap();
                const isOpen = transContextBox.style.display !== "none";
                if (isOpen) {
                    transContextBox.style.display = "none";
                    btnTransContext.classList.remove("active");
                    txtTransContext.textContent = "Dịch đề";
                } else {
                    btnTransContext.classList.add("active");
                    txtTransContext.textContent = "Ẩn bản dịch";
                    transContextBox.style.display = "block";
                    if (!q.context_vi) {
                        transContextBox.innerHTML = `<span style="color:var(--text-muted); font-size:0.84rem;">Đang dịch đoạn văn...</span>`;
                        q.context_vi = await window.khoaAI.translateContent(q.context);
                    }
                    transContextBox.innerHTML = `🇻🇳 <em>${escapeHtml(q.context_vi)}</em>`;
                }
            });
        }

        const btnTransQ = document.getElementById("btn-trans-q");
        const transQBox = document.getElementById("trans-q-box");
        const txtTransQ = document.getElementById("txt-trans-q");

        if (btnTransQ && transQBox) {
            btnTransQ.addEventListener("click", async () => {
                window.khoaSound.playTap();
                const isOpen = transQBox.style.display !== "none";
                if (isOpen) {
                    transQBox.style.display = "none";
                    btnTransQ.classList.remove("active");
                    txtTransQ.textContent = "Dịch câu hỏi";
                } else {
                    btnTransQ.classList.add("active");
                    txtTransQ.textContent = "Ẩn bản dịch";
                    transQBox.style.display = "block";
                    if (!q.question_vi) {
                        transQBox.innerHTML = `<span style="color:var(--text-muted); font-size:0.84rem;">Đang dịch câu hỏi...</span>`;
                        q.question_vi = await window.khoaAI.translateContent(q.question);
                    }
                    transQBox.innerHTML = `🇻🇳 <em>${escapeHtml(q.question_vi)}</em>`;
                }
            });
        }

        // Attach event listeners for options
        const optionEls = questionContainer.querySelectorAll(".option-row");
        optionEls.forEach(el => {
            el.addEventListener("click", () => {
                window.khoaSound.playTap();
                const letter = el.dataset.letter;
                state.userAnswers[index] = letter;

                // Update UI selection
                optionEls.forEach(item => item.classList.remove("selected"));
                el.classList.add("selected");
            });
        });

        // Attach hint listener
        const btnHint = document.getElementById("btn-show-hint");
        const hintBox = document.getElementById("hint-box");
        const hintBody = document.getElementById("hint-body");
        const btnCloseHint = document.getElementById("btn-close-hint");

        btnHint.addEventListener("click", async () => {
            window.khoaSound.playHint();
            hintBox.style.display = "block";

            if (state.hintsCache[q.id]) {
                hintBody.innerHTML = renderMarkdown(state.hintsCache[q.id]);
                return;
            }

            hintBody.innerHTML = `
                <div style="display:flex; align-items:center; gap:8px; color:var(--text-muted);">
                    <div class="clean-spinner" style="width:18px;height:18px;border-width:2px;margin:0;"></div>
                    Khoa Eng đang phân tích dấu hiệu câu hỏi...
                </div>
            `;

            try {
                const hintMarkdown = await window.khoaAI.generateHint(q);
                state.hintsCache[q.id] = hintMarkdown;
                hintBody.innerHTML = renderMarkdown(hintMarkdown);
            } catch (err) {
                hintBody.innerHTML = renderMarkdown(window.generateOfflineHint(q));
            }
        });

        btnCloseHint.addEventListener("click", () => {
            hintBox.style.display = "none";
        });
    }

    // -------------------------------------------------------------------------
    // Quiz Navigation Actions
    // -------------------------------------------------------------------------
    btnPrevQ.addEventListener("click", () => {
        if (state.currentIndex > 0) {
            window.khoaSound.playNav();
            renderQuestion(state.currentIndex - 1);
        }
    });

    btnNextQ.addEventListener("click", () => {
        if (state.currentIndex < state.currentQuestions.length - 1) {
            window.khoaSound.playNav();
            renderQuestion(state.currentIndex + 1);
        }
    });

    btnQuitQuiz.addEventListener("click", () => {
        if (confirm("Bạn có chắc chắn muốn dừng bài thi hiện tại và về trang chủ?")) {
            if (state.timerInterval) clearInterval(state.timerInterval);
            showScreen("home");
        }
    });

    // -------------------------------------------------------------------------
    // Question Grid Modal
    // -------------------------------------------------------------------------
    function openGridModal() {
        gridContainer.innerHTML = "";
        state.currentQuestions.forEach((q, idx) => {
            const isAnswered = state.userAnswers[idx] !== null;
            const isCurrent = state.currentIndex === idx;
            const btn = document.createElement("button");
            btn.className = `grid-cell-btn ${isAnswered ? 'answered' : ''} ${isCurrent ? 'current' : ''}`;
            btn.textContent = idx + 1;
            btn.addEventListener("click", () => {
                window.khoaSound.playTap();
                gridModal.classList.remove("active");
                renderQuestion(idx);
            });
            gridContainer.appendChild(btn);
        });
        gridModal.classList.add("active");
    }

    btnOpenGrid.addEventListener("click", openGridModal);
    gridCloseBtn.addEventListener("click", () => gridModal.classList.remove("active"));
    gridModal.addEventListener("click", (e) => {
        if (e.target === gridModal) gridModal.classList.remove("active");
    });

    // -------------------------------------------------------------------------
    // Submission & Diagnostic
    // -------------------------------------------------------------------------
    async function submitExam() {
        const total = state.currentQuestions.length;
        const answeredCount = state.userAnswers.filter(a => a !== null).length;

        if (answeredCount < total) {
            const unanswered = total - answeredCount;
            if (!confirm(`Bạn còn ${unanswered} câu chưa trả lời. Bạn có muốn nộp bài ngay không?`)) {
                return;
            }
        }

        if (state.timerInterval) clearInterval(state.timerInterval);

        // Calculate score
        let correctCount = 0;
        state.currentQuestions.forEach((q, idx) => {
            if (state.userAnswers[idx] === q.correct) {
                correctCount++;
            }
        });

        const score = parseFloat(((correctCount / total) * 10).toFixed(2));
        const accuracyPct = Math.round((correctCount / total) * 100);

        // Play sound & fanfare
        window.khoaSound.playFanfare(score);

        // Celebration Confetti effect
        triggerCelebration(score);

        // Save to history to prevent duplication next time
        saveQuestionHistory(state.currentQuestions);

        // Render Results Screen
        renderResultsScreen(score, correctCount, total, accuracyPct);
        showScreen("results");

        // Fetch AI Diagnostic Report
        fetchDiagnostic(score);
    }

    btnSubmitQuiz.addEventListener("click", submitExam);

    function triggerCelebration(score) {
        if (typeof confetti !== "function") return;

        if (score >= 8.5) {
            confetti({
                particleCount: 120,
                spread: 70,
                origin: { y: 0.6 }
            });
        } else if (score >= 7.0) {
            confetti({
                particleCount: 60,
                spread: 60,
                origin: { y: 0.6 }
            });
        }
    }

    function renderResultsScreen(score, correctCount, total, accuracyPct) {
        resScoreNum.textContent = score.toFixed(1);
        resCorrectCount.textContent = `${correctCount}/${total}`;
        resAccuracy.textContent = `${accuracyPct}%`;

        const mins = Math.floor(state.timerSeconds / 60);
        const secs = state.timerSeconds % 60;
        resTimeSpent.textContent = `${mins}m ${secs}s`;

        if (score >= 9.0) {
            resScoreTitle.textContent = "Xuất Sắc! Nắm Rất Chắc Kiến Thức!";
        } else if (score >= 8.0) {
            resScoreTitle.textContent = "Rất Tốt! Đạt Mục Tiêu Điểm Cao!";
        } else if (score >= 6.5) {
            resScoreTitle.textContent = "Khá Tốt! Tiếp Tục Bứt Phá Lên 8+!";
        } else if (score >= 5.0) {
            resScoreTitle.textContent = "Đạt Yêu Cầu! Cần Luyện Thêm!";
        } else {
            resScoreTitle.textContent = "Cố Lên! KhoaEng Đồng Hành Cùng Bạn!";
        }

        renderKnowledgeChart();
        renderDetailedReview();
    }

    function renderKnowledgeChart() {
        const categories = {};
        state.currentQuestions.forEach((q, idx) => {
            const cat = q.category || "Ngữ pháp";
            if (!categories[cat]) {
                categories[cat] = { total: 0, correct: 0 };
            }
            categories[cat].total++;
            if (state.userAnswers[idx] === q.correct) {
                categories[cat].correct++;
            }
        });

        const labels = Object.keys(categories);
        const dataValues = labels.map(l => Math.round((categories[l].correct / categories[l].total) * 100));

        const ctx = document.getElementById("knowledgeRadarChart");
        if (!ctx) return;

        if (state.knowledgeChart) {
            state.knowledgeChart.destroy();
        }

        if (typeof Chart === "function") {
            state.knowledgeChart = new Chart(ctx, {
                type: 'radar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Tỷ lệ nắm vững (%)',
                        data: dataValues,
                        backgroundColor: 'rgba(29, 78, 216, 0.15)',
                        borderColor: '#1d4ed8',
                        pointBackgroundColor: '#1d4ed8',
                        pointBorderColor: '#fff',
                        pointHoverBackgroundColor: '#fff',
                        pointHoverBorderColor: '#1d4ed8',
                        borderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        r: {
                            angleLines: { color: '#e2e8f0' },
                            grid: { color: '#e2e8f0' },
                            pointLabels: {
                                font: {
                                    family: "'Be Vietnam Pro', sans-serif",
                                    size: 11,
                                    weight: '600'
                                },
                                color: '#334155'
                            },
                            suggestedMin: 0,
                            suggestedMax: 100,
                            ticks: {
                                stepSize: 25,
                                font: { size: 9 },
                                backdropColor: 'transparent'
                            }
                        }
                    },
                    plugins: {
                        legend: { display: false }
                    }
                }
            });
        }
    }

    function renderDetailedReview() {
        reviewList.innerHTML = state.currentQuestions.map((q, idx) => {
            const userPick = state.userAnswers[idx];
            const isCorrect = userPick === q.correct;
            const letters = ["A", "B", "C", "D"];

            const optionsHtml = q.options.map((opt, i) => {
                const letter = letters[i];
                const isUserChoice = userPick === letter;
                const isCorrectChoice = q.correct === letter;

                let tag = "";
                let style = "";
                if (isCorrectChoice) {
                    tag = ` <span style="color:var(--success); font-weight:700;">✓ (Đáp án đúng)</span>`;
                    style = "font-weight:600; color:var(--success);";
                } else if (isUserChoice) {
                    tag = ` <span style="color:var(--danger); font-weight:700;">✗ (Bạn đã chọn)</span>`;
                    style = "color:var(--danger);";
                }

                return `
                    <div style="${style}">
                        <strong>${letter}.</strong> ${escapeHtml(opt.replace(/^[A-D]\.\s*/, ''))}${tag}
                    </div>
                `;
            }).join("");

            return `
                <div class="review-item">
                    <div class="review-status-line ${isCorrect ? 'correct' : 'incorrect'}">
                        ${isCorrect ? '✓ Đúng' : (userPick ? '✗ Chưa đúng' : '○ Chưa làm')} • Câu ${idx + 1} [${escapeHtml(q.topic || q.category)}]
                    </div>
                    <div class="review-q-text">${escapeHtml(q.question)}</div>
                    <div class="review-choices-list">
                        ${optionsHtml}
                    </div>
                    <div class="review-exp-text">
                        <strong>Giải thích:</strong> ${escapeHtml(q.explanation || "Đang cập nhật lời giải")}
                    </div>
                </div>
            `;
        }).join("");
    }

    async function fetchDiagnostic(score) {
        diagnosticContent.innerHTML = `
            <div style="display:flex; align-items:center; gap:8px; padding:12px 0; color:var(--text-muted);">
                <div class="clean-spinner" style="width:18px;height:18px;border-width:2px;margin:0;"></div>
                Khoa Eng đang phân tích bài thi và lập bảng đánh giá...
            </div>
        `;

        try {
            const report = await window.khoaAI.analyzePerformance(
                { questions: state.currentQuestions },
                state.userAnswers,
                score,
                state.timerSeconds
            );
            diagnosticContent.innerHTML = renderMarkdown(report);
        } catch (err) {
            console.error("Diagnostic error", err);
            diagnosticContent.innerHTML = renderMarkdown(
                window.generateOfflineAnalysis(score, 0, state.currentQuestions.length, [], [])
            );
        }
    }

    // -------------------------------------------------------------------------
    // Results Actions
    // -------------------------------------------------------------------------
    btnRepeatExam.addEventListener("click", () => {
        window.khoaSound.playTap();
        startExam();
    });

    btnBackHome.addEventListener("click", () => {
        window.khoaSound.playTap();
        showScreen("home");
    });

    btnDownloadReport.addEventListener("click", () => {
        window.khoaSound.playTap();
        window.print();
    });

    // -------------------------------------------------------------------------
    // AI Chat: Seamless & Markdown Table Supported
    // -------------------------------------------------------------------------
    function toggleChat(open = true) {
        window.khoaSound.playTap();
        chatDrawer.classList.toggle("active", open);
        if (open) {
            chatInput.focus();
            if (chatMessages.children.length === 0) {
                appendChatMessage("ai", `Chào bạn! Mình là **Khoa Eng** - gia sư Tiếng Anh THPT 2026. 

Bạn có thể hỏi bất kỳ câu hỏi nào về ngữ pháp, mẹo giải đề, hoặc yêu cầu mình kẻ bảng so sánh các thì, ví dụ:

| Chuyên đề | Dấu hiệu nhận biết | Ví dụ điển hình |
| :--- | :--- | :--- |
| **Hiện tại hoàn thành** | *since, for, already, yet* | I have lived here for 5 years. |
| **Quá khứ đơn** | *yesterday, ago, in 2020* | I bought this car yesterday. |

Bạn cần hỗ trợ gì hôm nay?`);
            }
        }
    }

    btnOpenChat.addEventListener("click", () => toggleChat(true));
    if (btnQuizChat) btnQuizChat.addEventListener("click", () => toggleChat(true));
    chatFabBtn.addEventListener("click", () => toggleChat(true));
    chatCloseBtn.addEventListener("click", () => toggleChat(false));
    chatDrawer.addEventListener("click", (e) => {
        if (e.target === chatDrawer) toggleChat(false);
    });

    function appendChatMessage(role, content) {
        const bubble = document.createElement("div");
        bubble.className = `chat-msg ${role}`;
        if (role === "ai") {
            bubble.innerHTML = renderMarkdown(content);
        } else {
            bubble.textContent = content;
        }
        chatMessages.appendChild(bubble);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    async function sendChatMessage(text) {
        const query = (text || chatInput.value).trim();
        if (!query) return;

        chatInput.value = "";
        appendChatMessage("user", query);
        window.khoaSound.playTap();

        // Thinking indicator
        const thinkingBubble = document.createElement("div");
        thinkingBubble.className = "chat-msg ai";
        thinkingBubble.innerHTML = `<span style="color:var(--text-muted); font-size:0.88rem;">Khoa Eng đang soạn câu trả lời...</span>`;
        chatMessages.appendChild(thinkingBubble);
        chatMessages.scrollTop = chatMessages.scrollHeight;

        try {
            state.chatHistory.push({ role: "user", content: query });
            const reply = await window.khoaAI.chatWithKhoaEng(query, state.chatHistory);
            state.chatHistory.push({ role: "assistant", content: reply });
            thinkingBubble.innerHTML = renderMarkdown(reply);
        } catch (err) {
            thinkingBubble.innerHTML = `Kết nối bị gián đoạn: ${err.message}. Bạn vui lòng thử lại nhé!`;
        }
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    chatSendBtn.addEventListener("click", () => sendChatMessage());
    chatInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") sendChatMessage();
    });

    chatChips.forEach(chip => {
        chip.addEventListener("click", () => {
            sendChatMessage(chip.textContent.trim());
        });
    });

    // -------------------------------------------------------------------------
    // Settings Modal
    // -------------------------------------------------------------------------
    btnOpenSettings.addEventListener("click", () => {
        window.khoaSound.playTap();
        inputApiKey.value = window.khoaAI.getApiKey();
        selectModel.value = window.khoaAI.getModel();
        apiStatusMsg.textContent = "";
        settingsModal.classList.add("active");
    });

    settingsCloseBtn.addEventListener("click", () => settingsModal.classList.remove("active"));
    settingsModal.addEventListener("click", (e) => {
        if (e.target === settingsModal) settingsModal.classList.remove("active");
    });

    btnSaveSettings.addEventListener("click", () => {
        window.khoaSound.playTap();
        window.khoaAI.setApiKey(inputApiKey.value);
        window.khoaAI.setModel(selectModel.value);
        apiStatusMsg.style.color = "var(--success)";
        apiStatusMsg.textContent = "✓ Đã lưu cài đặt!";
        setTimeout(() => settingsModal.classList.remove("active"), 800);
    });

    btnTestApi.addEventListener("click", async () => {
        window.khoaSound.playTap();
        apiStatusMsg.style.color = "var(--primary)";
        apiStatusMsg.textContent = "Đang kiểm tra kết nối Groq API...";
        const result = await window.khoaAI.testConnection();
        if (result.success) {
            apiStatusMsg.style.color = "var(--success)";
            apiStatusMsg.textContent = "✓ Kết nối API Groq thành công! " + result.message;
        } else {
            apiStatusMsg.style.color = "var(--danger)";
            apiStatusMsg.textContent = "✗ Lỗi kết nối: " + result.error;
        }
    });

    function escapeHtml(str) {
        if (!str) return "";
        return str
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    // Initialize default question count (12)
    updateQuestionCount(12);
});
