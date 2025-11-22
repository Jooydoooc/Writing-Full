// Modern IELTS Writing Pro Application
class IELTSWritingApp {
    constructor() {
        this.currentScreen = 'intro';
        this.currentTask = 1;
        this.currentSet = null;
        this.totalTime = 60 * 60; // 60 minutes in seconds
        this.timeLeft = this.totalTime;
        this.timerInterval = null;
        this.isTestStarted = false;
        this.warningShown = false;
        this.isFocusMode = false;
        this.studentName = '';
        this.studentSurname = '';
        
        this.typingMonitor = {
            lastKeyTime: 0,
            keyCount: 0,
            warningThreshold: 30, // characters in 5 seconds
            checkInterval: null
        };
        
        this.writingSets = {
            set1: {
                name: "Set 1 - Film Production & Family History",
                code: "versage_100",
                task1: {
                    question: "The charts below show the number of films produced by five countries in three years.",
                    image: "IMAGE%202025-11-21%2020%3A42%3A23.jpg"
                },
                task2: {
                    question: "It is becoming increasingly popular to try to find out the history of one's own family. Why might people want to do this? Is it a positive or negative development?"
                }
            },
            set2: {
                name: "Set 2 - Coming Soon",
                code: "coming_soon",
                task1: { question: "This set is currently under development." },
                task2: { question: "New content will be available soon." }
            },
            set3: {
                name: "Set 3 - Coming Soon", 
                code: "coming_soon",
                task1: { question: "This set is currently under development." },
                task2: { question: "New content will be available soon." }
            }
        };

        this.answers = {
            task1: '',
            task2: ''
        };

        this.init();
    }

    init() {
        this.bindEvents();
        this.showScreen('intro');
        this.startIntroAnimation();
        this.loadSets();
    }

    startIntroAnimation() {
        setTimeout(() => {
            this.showScreen('login');
        }, 4000);
    }

    bindEvents() {
        // Login
        document.getElementById('loginBtn').addEventListener('click', () => this.handleLogin());
        
        // Enter key in login
        ['studentName', 'studentSurname'].forEach(id => {
            document.getElementById(id).addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.handleLogin();
            });
        });

        // Set selection
        document.getElementById('setsGrid').addEventListener('click', (e) => {
            const setCard = e.target.closest('.set-card');
            if (setCard && !setCard.classList.contains('coming-soon')) {
                const setId = setCard.dataset.set;
                this.showAccessCodeModal(setId);
            }
        });

        // Access code modal
        document.getElementById('submitCode').addEventListener('click', () => this.checkAccessCode());
        document.getElementById('cancelCode').addEventListener('click', () => this.hideModal('codeModal'));
        document.getElementById('closeCodeModal').addEventListener('click', () => this.hideModal('codeModal'));
        document.getElementById('accessCode').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.checkAccessCode();
        });

        // Test controls
        document.getElementById('startTestBtn').addEventListener('click', () => this.startTest());
        document.getElementById('submitBtn').addEventListener('click', () => this.submitTest());
        document.getElementById('backToMenuBtn').addEventListener('click', () => this.confirmExit());

        // Task navigation
        document.querySelectorAll('.task-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const task = parseInt(e.currentTarget.dataset.task);
                this.switchTask(task);
            });
        });

        document.getElementById('prevTask').addEventListener('click', () => this.previousTask());
        document.getElementById('nextTask').addEventListener('click', () => this.nextTask());

        // Settings menu
        document.getElementById('settingsBtn').addEventListener('click', (e) => {
            e.stopPropagation();
            document.getElementById('settingsDropdown').classList.toggle('show');
        });

        document.getElementById('focusModeBtn').addEventListener('click', () => this.toggleFocusMode());
        
        // Close settings when clicking outside
        document.addEventListener('click', () => {
            document.getElementById('settingsDropdown').classList.remove('show');
        });

        // Answer textarea events
        const answerText = document.getElementById('answerText');
        answerText.addEventListener('input', (e) => {
            this.updateWordCount();
            this.answers[`task${this.currentTask}`] = e.target.value;
            this.monitorTypingSpeed();
        });

        // Anti-copy-paste
        answerText.addEventListener('copy', (e) => {
            e.preventDefault();
            this.showCheatingWarning();
        });
        answerText.addEventListener('paste', (e) => e.preventDefault());
        answerText.addEventListener('cut', (e) => e.preventDefault());
        answerText.addEventListener('contextmenu', (e) => e.preventDefault());

        // Modal controls
        document.getElementById('closeWarning').addEventListener('click', () => this.hideModal('warningModal'));
        document.getElementById('closeCheat').addEventListener('click', () => this.hideModal('cheatModal'));
        document.getElementById('closeTimeUp').addEventListener('click', () => this.showReviewScreen());

        // Review actions
        document.getElementById('newTestBtn').addEventListener('click', () => this.showScreen('menu'));
        document.getElementById('reviewMenuBtn').addEventListener('click', () => this.showScreen('menu'));

        // Split panel resizing
        this.setupSplitPanel();

        // Anti-cheating visibility
        document.addEventListener('visibilitychange', () => this.handleVisibilityChange());
        window.addEventListener('blur', () => this.handleVisibilityChange());
    }

    loadSets() {
        const grid = document.getElementById('setsGrid');
        grid.innerHTML = '';

        Object.entries(this.writingSets).forEach(([key, set]) => {
            const isComingSoon = set.code === 'coming_soon';
            const card = document.createElement('div');
            card.className = `set-card ${isComingSoon ? 'coming-soon' : ''}`;
            card.dataset.set = key;
            
            card.innerHTML = `
                <h3>${set.name}</h3>
                <p>${set.task1.question.substring(0, 80)}...</p>
                <p>${set.task2.question.substring(0, 80)}...</p>
                ${isComingSoon ? '<button class="btn btn-secondary" disabled>Coming Soon</button>' : ''}
            `;
            
            grid.appendChild(card);
        });
    }

    handleLogin() {
        const name = document.getElementById('studentName').value.trim();
        const surname = document.getElementById('studentSurname').value.trim();

        if (!name || !surname) {
            this.showMessage('Please enter both your name and surname.');
            return;
        }

        this.studentName = name;
        this.studentSurname = surname;
        
        document.getElementById('userName').textContent = `${name} ${surname}`;
        document.getElementById('displayName').textContent = `${name} ${surname}`;
        
        this.showScreen('menu');
    }

    showAccessCodeModal(setId) {
        const set = this.writingSets[setId];
        this.currentSet = set;
        
        document.getElementById('modalSetName').textContent = set.name;
        document.getElementById('accessCode').value = '';
        document.getElementById('codeError').textContent = '';
        
        this.showModal('codeModal');
        document.getElementById('accessCode').focus();
    }

    checkAccessCode() {
        const code = document.getElementById('accessCode').value.trim();
        const errorElement = document.getElementById('codeError');
        
        if (code === this.currentSet.code) {
            errorElement.textContent = '';
            document.getElementById('displaySet').textContent = this.currentSet.name;
            this.hideModal('codeModal');
            this.showScreen('test');
            this.loadTaskContent(1);
        } else {
            errorElement.textContent = 'Invalid access code. Please try again.';
            document.getElementById('accessCode').focus();
            document.getElementById('accessCode').select();
        }
    }

    showScreen(screenName) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        document.getElementById(`${screenName}Screen`).classList.add('active');
        this.currentScreen = screenName;
    }

    showModal(modalId) {
        document.getElementById(modalId).classList.add('active');
    }

    hideModal(modalId) {
        document.getElementById(modalId).classList.remove('active');
    }

    loadTaskContent(taskNumber) {
        const task = this.currentSet[`task${taskNumber}`];
        const content = document.getElementById('questionContent');
        
        let imageHtml = '';
        if (task.image && taskNumber === 1) {
            imageHtml = `<img src="${task.image}" alt="Task ${taskNumber} Chart" class="question-image" onerror="this.style.display='none'">`;
        }
        
        content.innerHTML = `
            <h4>Writing Task ${taskNumber}</h4>
            <p>${task.question}</p>
            ${imageHtml}
        `;

        // Load saved answer
        document.getElementById('answerText').value = this.answers[`task${taskNumber}`] || '';
        this.updateWordCount();
        
        // Update progress
        this.updateProgress(taskNumber);
    }

    switchTask(taskNumber) {
        this.currentTask = taskNumber;
        document.querySelectorAll('.task-btn').forEach(btn => {
            btn.classList.toggle('active', parseInt(btn.dataset.task) === taskNumber);
        });
        this.loadTaskContent(taskNumber);
        this.updateNavigation();
    }

    previousTask() {
        if (this.currentTask > 1) {
            this.switchTask(this.currentTask - 1);
        }
    }

    nextTask() {
        if (this.currentTask < 2) {
            this.switchTask(this.currentTask + 1);
        }
    }

    updateNavigation() {
        document.getElementById('prevTask').disabled = this.currentTask === 1;
        document.getElementById('nextTask').style.display = this.currentTask === 2 ? 'none' : 'block';
        document.getElementById('submitBtn').style.display = this.currentTask === 2 ? 'block' : 'none';
    }

    updateProgress(taskNumber) {
        const progress = (taskNumber / 2) * 100;
        document.querySelector('.progress-fill').style.width = `${progress}%`;
        document.querySelector('.current-task').textContent = `Task ${taskNumber} of 2`;
    }

    startTest() {
        this.isTestStarted = true;
        this.warningShown = false;
        
        // Enable writing
        document.getElementById('answerText').disabled = false;
        document.getElementById('submitBtn').disabled = false;
        
        // Update UI
        document.getElementById('startTestBtn').disabled = true;
        document.getElementById('startTestBtn').textContent = 'Test Running';
        
        // Start timer
        this.startTimer();
        
        // Start typing monitor
        this.startTypingMonitor();
    }

    startTimer() {
        this.timeLeft = this.totalTime;
        this.updateTimerDisplay();
        
        this.timerInterval = setInterval(() => {
            this.timeLeft--;
            this.updateTimerDisplay();
            
            if (this.timeLeft <= 0) {
                this.timeUp();
            } else if (this.timeLeft <= 300) { // 5 minutes warning
                document.getElementById('timer').classList.add('warning');
            }
        }, 1000);
    }

    updateTimerDisplay() {
        const minutes = Math.floor(this.timeLeft / 60);
        const seconds = this.timeLeft % 60;
        document.getElementById('timer').textContent = 
            `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    timeUp() {
        clearInterval(this.timerInterval);
        this.showModal('timeUpModal');
        this.submitTest(true);
    }

    updateWordCount() {
        const text = document.getElementById('answerText').value;
        const words = text.trim() ? text.split(/\s+/).filter(word => word.length > 0).length : 0;
        document.getElementById('wordCount').textContent = words;
    }

    startTypingMonitor() {
        const textarea = document.getElementById('answerText');
        let lastReset = Date.now();

        textarea.addEventListener('keydown', () => {
            const now = Date.now();
            this.typingMonitor.keyCount++;
            
            // Reset counter every 5 seconds
            if (now - lastReset > 5000) {
                if (this.typingMonitor.keyCount > this.typingMonitor.warningThreshold) {
                    this.showCheatingWarning();
                }
                this.typingMonitor.keyCount = 0;
                lastReset = now;
            }
        });
    }

    showCheatingWarning() {
        this.showModal('cheatModal');
        document.getElementById('answerText').classList.add('typing-warning');
        
        setTimeout(() => {
            document.getElementById('answerText').classList.remove('typing-warning');
        }, 2000);
    }

    handleVisibilityChange() {
        if (this.isTestStarted && (document.hidden || !document.hasFocus())) {
            if (!this.warningShown) {
                this.warningShown = true;
                this.showModal('warningModal');
            } else {
                this.resetTest();
                this.showMessage('Test reset due to multiple page visibility changes.');
            }
        }
    }

    setupSplitPanel() {
        const container = document.getElementById('splitContainer');
        const divider = document.getElementById('splitDivider');
        let isResizing = false;

        divider.addEventListener('mousedown', (e) => {
            isResizing = true;
            document.body.style.cursor = 'col-resize';
            e.preventDefault();
        });

        document.addEventListener('mousemove', (e) => {
            if (!isResizing) return;

            const containerRect = container.getBoundingClientRect();
            const x = e.clientX - containerRect.left;
            const percentage = (x / containerRect.width) * 100;

            // Limit between 20% and 80%
            const clampedPercentage = Math.max(20, Math.min(80, percentage));
            
            container.style.gridTemplateColumns = `${clampedPercentage}fr 8px 1fr`;
        });

        document.addEventListener('mouseup', () => {
            isResizing = false;
            document.body.style.cursor = '';
        });

        // Touch support for mobile
        divider.addEventListener('touchstart', (e) => {
            isResizing = true;
            e.preventDefault();
        });

        document.addEventListener('touchmove', (e) => {
            if (!isResizing) return;

            const containerRect = container.getBoundingClientRect();
            const x = e.touches[0].clientX - containerRect.left;
            const percentage = (x / containerRect.width) * 100;
            const clampedPercentage = Math.max(20, Math.min(80, percentage));
            
            container.style.gridTemplateColumns = `${clampedPercentage}fr 8px 1fr`;
        });

        document.addEventListener('touchend', () => {
            isResizing = false;
        });
    }

    toggleFocusMode() {
        this.isFocusMode = !this.isFocusMode;
        document.body.classList.toggle('focus-mode', this.isFocusMode);
        document.getElementById('settingsDropdown').classList.remove('show');
        
        this.showMessage(
            this.isFocusMode ? 'Focus mode enabled' : 'Focus mode disabled',
            'success'
        );
    }

    async submitTest(isAutoSubmit = false) {
        if (!isAutoSubmit && !this.answers.task1.trim() && !this.answers.task2.trim()) {
            this.showMessage('Please write answers for at least one task before submitting.');
            return;
        }

        try {
            this.setButtonLoading('submitBtn', true);

            const timeSpent = this.totalTime - this.timeLeft;
            const minutes = Math.floor(timeSpent / 60);
            const seconds = timeSpent % 60;
            const timerValue = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

            const submission = {
                studentName: this.studentName,
                studentSurname: this.studentSurname,
                setName: this.currentSet.name,
                timerValue: timerValue,
                submittedAt: new Date().toISOString(),
                task1Question: this.currentSet.task1.question,
                task1Answer: this.answers.task1,
                task2Question: this.currentSet.task2.question,
                task2Answer: this.answers.task2,
                isAutoSubmit: isAutoSubmit
            };

            const response = await fetch('/api/submit.js', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(submission)
            });

            const result = await response.json();

            if (result.success) {
                this.showReviewScreen(submission);
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            this.showMessage(`Submission failed: ${error.message}`);
        } finally {
            this.setButtonLoading('submitBtn', false);
        }
    }

    showReviewScreen(submission) {
        document.getElementById('finalTime').textContent = submission.timerValue;
        document.getElementById('submitTime').textContent = new Date().toLocaleString();
        
        document.getElementById('reviewAnswer1').textContent = submission.task1Answer || 'No answer provided';
        document.getElementById('reviewAnswer2').textContent = submission.task2Answer || 'No answer provided';
        
        const words1 = submission.task1Answer ? submission.task1Answer.split(/\s+/).length : 0;
        const words2 = submission.task2Answer ? submission.task2Answer.split(/\s+/).length : 0;
        
        document.getElementById('reviewWords1').textContent = words1;
        document.getElementById('reviewWords2').textContent = words2;
        
        this.showScreen('review');
        this.resetTest();
    }

    confirmExit() {
        if (this.isTestStarted && (this.answers.task1.trim() || this.answers.task2.trim())) {
            if (confirm('Are you sure you want to exit? Your current progress will be lost.')) {
                this.resetTest();
                this.showScreen('menu');
            }
        } else {
            this.resetTest();
            this.showScreen('menu');
        }
    }

    resetTest() {
        // Clear data
        this.answers = { task1: '', task2: '' };
        this.currentTask = 1;
        this.isTestStarted = false;
        this.warningShown = false;
        this.isFocusMode = false;
        
        // Stop timer
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        
        // Reset UI
        document.getElementById('answerText').value = '';
        document.getElementById('answerText').disabled = true;
        document.getElementById('startTestBtn').disabled = false;
        document.getElementById('startTestBtn').textContent = 'Start Test';
        document.getElementById('submitBtn').disabled = true;
        document.getElementById('timer').textContent = '60:00';
        document.getElementById('timer').classList.remove('warning');
        document.body.classList.remove('focus-mode');
        
        // Reset navigation
        this.switchTask(1);
    }

    showMessage(message, type = 'info') {
        // Simple alert for now - can be enhanced with custom modal
        alert(message);
    }

    setButtonLoading(buttonId, loading) {
        const btn = document.getElementById(buttonId);
        if (btn) {
            btn.classList.toggle('loading', loading);
            btn.disabled = loading;
        }
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    new IELTSWritingApp();
});
