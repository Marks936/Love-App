const lines = [
    "Пользователь: Анастасия Гатило",
    "Устройство: iPhone 13",
    "Статус: Система заблокирована..."
];

const quotes = [
    "Умница! 🌟", "Люблю тебя ❤️", "Так держать, солнце! ☀️", 
    "Моя хакерша 🥰", "Просто лучшая! ✨", "Ты со всем справишься! 💪"
];

const wheelOptions = [
    { label: "Массаж", chance: 0.40, color: "#ff007f" },
    { label: "Желание", chance: 0.05, color: "#ffd700" },
    { label: "Вечер на выбор", chance: 0.20, color: "#bc00dd" },
    { label: "Блюдо на выбор", chance: 0.20, color: "#00f0ff" },
    { label: "Всё наоборот", chance: 0.15, color: "#ff4500" }
];

const consoleScreen = document.getElementById('console-screen');
const accessPanel = document.getElementById('access-panel');
const finalMessage = document.getElementById('final-message');
const canvasElement = document.getElementById('heartCanvas');
const ctx = canvasElement ? canvasElement.getContext('2d') : null;
const gameContainer = document.getElementById('game-container');
const passwordContainer = document.getElementById('password-container');
const passwordInput = document.getElementById('password-input');
const touchNumpad = document.getElementById('touch-numpad');
const backToGamesBtn = document.getElementById('back-to-games');

let particles = [];
let heartPhase = 0; 
let score = 0;
let bubbleIntervals = []; 
let statsTimerId = null;
let cooldownIntervalId = null;
let currentRotation = 0;
let isSpinning = false;
let reverseRoleActive = false;

const mouse = { x: null, y: null, radius: 90 }; 
let audioCtx = null;

function triggerHapticFeedback() {
    if (navigator.vibrate) {
        navigator.vibrate(40);
    }
    try {
        if (!audioCtx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) audioCtx = new AudioContext();
        }
        if (audioCtx && audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
        if (audioCtx) {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(140, audioCtx.currentTime);
            gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.05);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.05);
        }
    } catch (e) {
        console.log("Audio feedback handled.");
    }
}

function updatePinDots() {
    const dots = document.querySelectorAll('.pin-dots .dot');
    const valLength = passwordInput.value.length;
    dots.forEach((dot, idx) => {
        if (idx < valLength) {
            dot.classList.add('active');
        } else {
            dot.classList.remove('active');
        }
    });
}

function pressKey(num) {
    triggerHapticFeedback();
    if (passwordInput.value.length < 6) {
        passwordInput.value += num;
        updatePinDots();
    }
}

function clearInput() {
    triggerHapticFeedback();
    passwordInput.value = '';
    updatePinDots();
}

function submitPassword() {
    if (passwordInput.value === '838995') {
        triggerHapticFeedback();
        unlockSequence();
    } else {
        triggerHapticFeedback();
        consoleScreen.classList.add('error-flash');
        passwordInput.value = '';
        updatePinDots();
        setTimeout(() => {
            consoleScreen.classList.remove('error-flash');
        }, 800);
    }
}

function openPage(pageId) {
    document.querySelectorAll('.app-page').forEach(page => {
        page.style.display = 'none';
    });
    
    if (pageId !== 'stats-page' && statsTimerId) {
        clearInterval(statsTimerId);
        statsTimerId = null;
    }
    
    if (pageId !== 'game-container') {
        const bubbles = gameContainer.querySelectorAll('.bubble');
        bubbles.forEach(b => b.remove());
        bubbleIntervals.forEach(timeout => clearTimeout(timeout));
        bubbleIntervals = [];
    }

    if (pageId !== 'snake-game-page') {
        stopSnakeGame();
    }

    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        if (pageId === 'snake-game-page') {
            targetPage.style.display = 'flex';
            setTimeout(() => {
                initSnakeCanvas();
            }, 50);
        } else {
            targetPage.style.display = 'block';
        }
    }

    if (pageId === 'stats-page') {
        startLiveCounter();
    } else if (pageId === 'wheel-page') {
        drawWheel();
        checkWheelCooldown();
    }
}

const updateMouse = (e) => {
    if (!canvasElement) return;
    const rect = canvasElement.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    mouse.x = clientX - rect.left;
    mouse.y = clientY - rect.top;
};

window.addEventListener('mousemove', updateMouse);
window.addEventListener('touchstart', updateMouse, {passive: false});
window.addEventListener('touchmove', (e) => { updateMouse(e); }, {passive: false});
window.addEventListener('touchend', () => { mouse.x = null; mouse.y = null; });

function typeLine(elementId, text, index = 0) {
    return new Promise((resolve) => {
        const el = document.getElementById(elementId);
        if (!el) { resolve(); return; }
        function type() {
            if (index < text.length) {
                el.innerHTML += text.charAt(index);
                index++;
                setTimeout(type, 45);
            } else {
                resolve();
            }
        }
        type();
    });
}

async function startSequence() {
    await typeLine('line1', lines[0]);
    await typeLine('line2', lines[1]);
    await typeLine('line3', lines[2]);
    
    if (passwordContainer) passwordContainer.style.display = 'flex';
    if (touchNumpad) touchNumpad.style.display = 'grid';
}

function unlockSequence() {
    if (passwordContainer) passwordContainer.style.display = 'none';
    if (touchNumpad) touchNumpad.style.display = 'none';
    consoleScreen.classList.add('minimized');
    accessPanel.style.display = 'block';
    setTimeout(() => accessPanel.style.opacity = '1', 50);
    
    setTimeout(() => {
        accessPanel.classList.add('fade-out');
        consoleScreen.classList.add('fade-out');
        
        setTimeout(() => {
            accessPanel.style.display = 'none';
            consoleScreen.style.display = 'none';
            
            canvasElement.style.opacity = '1';
            finalMessage.style.opacity = '1';
            initHeart();
            animate();
        }, 1000);
    }, 1400);
}

function resizeCanvas() {
    if (!canvasElement) return;
    canvasElement.width = window.innerWidth;
    canvasElement.height = window.innerHeight;
}
window.addEventListener('resize', () => {
    resizeCanvas();
    if (particles.length === 0) initHeart();
});
resizeCanvas();

function initHeart() {
    particles = [];
    const isMobile = window.innerWidth < 600;
    const count = isMobile ? 190 : 320;
    const scale = isMobile ? 10 : 16;
    
    for (let i = 0; i < count; i++) {
        const t = (i / count) * Math.PI * 2;
        const x = 16 * Math.pow(Math.sin(t), 3);
        const y = -(13 * Math.cos(t) - 5 * Math.cos(2*t) - 2 * Math.cos(3*t) - Math.cos(4*t));
        
        particles.push({
            baseX: window.innerWidth / 2 + x * scale,
            baseY: window.innerHeight / 4 * 1.8 + y * scale,
            x: window.innerWidth / 2 + x * scale,
            y: window.innerHeight / 4 * 1.8 + y * scale,
            speedX: 0,
            speedY: 0,
            char: Math.random() > 0.5 ? "1" : "0",
            size: Math.random() * 5 + 8,
            alpha: Math.random() * 0.5 + 0.5,
            angle: Math.random() * Math.PI * 2
        });
    }
}

function animate() {
    if (!canvasElement || canvasElement.style.opacity === '0' || canvasElement.style.display === 'none') return;
    ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    heartPhase += 0.05;
    
    particles.forEach(p => {
        const pulse = 1 + Math.sin(heartPhase + p.angle) * 0.04;
        const targetX = window.innerWidth / 2 + (p.baseX - window.innerWidth / 2) * pulse;
        const targetY = (window.innerHeight / 4 * 1.8) + (p.baseY - (window.innerHeight / 4 * 1.8)) * pulse;
        
        if (mouse.x !== null && mouse.y !== null) {
            const dx = mouse.x - p.x;
            const dy = mouse.y - p.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < mouse.radius) {
                const force = (mouse.radius - distance) / mouse.radius;
                const angle = Math.atan2(dy, dx);
                p.speedX -= Math.cos(angle) * force * 4;
                p.speedY -= Math.sin(angle) * force * 4;
            }
        }
        
        p.speedX += (targetX - p.x) * 0.08;
        p.speedY += (targetY - p.y) * 0.08;
        
        p.speedX *= 0.85;
        p.speedY *= 0.85;
        
        p.x += p.speedX;
        p.y += p.speedY;
        
        ctx.fillStyle = `rgba(255, 0, 127, ${p.alpha})`;
        ctx.font = `${p.size}px 'Fira Code', monospace`;
        ctx.fillText(p.char, p.x, p.y);
    });
    
    requestAnimationFrame(animate);
}

window.addEventListener('load', startSequence);

finalMessage.onclick = () => {
    triggerHapticFeedback();
    canvasElement.style.opacity = '0';
    finalMessage.style.opacity = '0';
    setTimeout(() => {
        canvasElement.style.display = 'none';
        finalMessage.style.display = 'none';
        openPage('main-menu');
    }, 800);
};

document.getElementById('sector-games-hub').onclick = () => { triggerHapticFeedback(); openPage('games-hub-page'); };
document.getElementById('sector-info').onclick = () => { triggerHapticFeedback(); openPage('stats-page'); };
document.getElementById('sector-util').onclick = () => { triggerHapticFeedback(); openPage('wheel-page'); };
document.getElementById('sector-extra').onclick = () => { 
    triggerHapticFeedback(); 
    alert("Конфигурация ядра стабильна. Уровень любви к Насте: 100%."); 
};

document.getElementById('sector-game-bubbles').onclick = () => {
    triggerHapticFeedback();
    openPage('game-container');
    spawnBubble();
    spawnBubble();
};

document.getElementById('sector-game-snake').onclick = () => {
    triggerHapticFeedback();
    openPage('snake-game-page');
};

if (backToGamesBtn) {
    backToGamesBtn.onclick = () => {
        triggerHapticFeedback();
        openPage('games-hub-page');
    };
}

function startLiveCounter() {
    const startDate = new Date('2025-10-05T00:00:00');
    const counterEl = document.getElementById('live-counter');
    if (!counterEl) return;
    
    function updateCounter() {
        const now = new Date();
        const diffMs = now - startDate;
        
        if (diffMs < 0) {
            counterEl.innerHTML = "Событие еще не наступило";
            return;
        }
        
        const totalSeconds = Math.floor(diffMs / 1000);
        const days = Math.floor(totalSeconds / (3600 * 24));
        const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        
        counterEl.innerHTML = `${days} дн. : ${hours} час. : ${minutes} мин. : ${seconds} сек.`;
    }
    
    updateCounter();
    statsTimerId = setInterval(updateCounter, 1000);
}

// ----------------- КОЛЕСО УДАЧИ -----------------
function drawWheel() {
    const svg = document.getElementById('wheel-svg');
    if (!svg) return;
    svg.innerHTML = '';
    const numSectors = wheelOptions.length;
    const anglePerSector = 360 / numSectors;
    const centerX = 250, centerY = 250, radius = 240;

    wheelOptions.forEach((option, i) => {
        const startAngle = i * anglePerSector;
        const endAngle = (i + 1) * anglePerSector;
        
        const x1 = centerX + radius * Math.cos(Math.PI * startAngle / 180);
        const y1 = centerY + radius * Math.sin(Math.PI * startAngle / 180);
        const x2 = centerX + radius * Math.cos(Math.PI * endAngle / 180);
        const y2 = centerY + radius * Math.sin(Math.PI * endAngle / 180);

        const pathData = `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 0 1 ${x2} ${y2} Z`;

        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute("d", pathData);
        path.setAttribute("fill", option.color);
        path.setAttribute("stroke", "#040008");
        path.setAttribute("stroke-width", "3");
        path.setAttribute("opacity", "0.85");
        svg.appendChild(path);

        const textAngle = startAngle + anglePerSector / 2;
        const textRad = Math.PI * textAngle / 180;
        const textX = centerX + (radius * 0.62) * Math.cos(textRad);
        const textY = centerY + (radius * 0.62) * Math.sin(textRad);

        const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
        text.setAttribute("x", textX);
        text.setAttribute("y", textY);
        text.setAttribute("fill", "#ffffff");
        text.setAttribute("font-size", "15");
        text.setAttribute("font-weight", "bold");
        text.setAttribute("font-family", "Montserrat, sans-serif");
        text.setAttribute("text-anchor", "middle");
        text.setAttribute("dominant-baseline", "central");
        text.setAttribute("transform", `rotate(${textAngle + 90}, ${textX}, ${textY})`);
        text.textContent = option.label;
        svg.appendChild(text);
    });
}

function selectWeightedIndex() {
    const rand = Math.random();
    let cumulative = 0;
    for (let i = 0; i < wheelOptions.length; i++) {
        cumulative += wheelOptions[i].chance;
        if (rand < cumulative) return i;
    }
    return wheelOptions.length - 1;
}

function spinWheel() {
    if (isSpinning) return;
    
    const nextAvailableTime = localStorage.getItem('wheelCooldown');
    if (nextAvailableTime && Date.now() < parseInt(nextAvailableTime)) {
        return;
    }

    triggerHapticFeedback();
    isSpinning = true;
    document.getElementById('spin-btn').disabled = true;
    document.getElementById('wheel-status').innerText = "Колесо крутится...";

    const chosenIndex = selectWeightedIndex();
    const sectorAngle = 360 / wheelOptions.length;
    
    const targetAngle = 270 - (chosenIndex * sectorAngle + sectorAngle / 2);
    const extraSpins = 360 * 5; 
    
    const currentModulo = currentRotation % 360;
    let delta = targetAngle - currentModulo;
    if (delta < 0) delta += 360;

    currentRotation += extraSpins + delta;

    const svg = document.getElementById('wheel-svg');
    if (svg) svg.style.transform = `rotate(${currentRotation}deg)`;

    setTimeout(() => {
        isSpinning = false;
        triggerHapticFeedback();
        const result = wheelOptions[chosenIndex];

        if (result.label === "Всё наоборот") {
            reverseRoleActive = true;
            document.getElementById('wheel-status').innerText = "🔄 Всё наоборот! Колесо крутится снова для ТЕБЯ!";
            setTimeout(() => {
                spinWheel();
            }, 2500);
        } else {
            if (reverseRoleActive) {
                document.getElementById('wheel-status').innerText = `😈 Настя делает для тебя: "${result.label}"!`;
                reverseRoleActive = false;
            } else {
                document.getElementById('wheel-status').innerText = `🎉 Твой выигрыш: "${result.label}"!`;
            }
            setCooldown(12 * 60 * 60 * 1000);
        }
    }, 5000);
}

function setCooldown(durationMs) {
    const endTime = Date.now() + durationMs;
    localStorage.setItem('wheelCooldown', endTime);
    checkWheelCooldown();
}

function checkWheelCooldown() {
    const nextAvailableTime = localStorage.getItem('wheelCooldown');
    const spinBtn = document.getElementById('spin-btn');
    const cooldownEl = document.getElementById('cooldown-timer');
    if (!spinBtn || !cooldownEl) return;

    if (cooldownIntervalId) clearInterval(cooldownIntervalId);

    function update() {
        if (!nextAvailableTime) {
            spinBtn.disabled = false;
            cooldownEl.innerText = "";
            return;
        }

        const remaining = parseInt(nextAvailableTime) - Date.now();
        if (remaining <= 0) {
            localStorage.removeItem('wheelCooldown');
            spinBtn.disabled = false;
            cooldownEl.innerText = "";
            clearInterval(cooldownIntervalId);
        } else {
            spinBtn.disabled = true;
            const hours = Math.floor(remaining / (1000 * 60 * 60));
            const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
            cooldownEl.innerText = `До следующего вращения: ${hours}ч ${minutes}м ${seconds}с`;
        }
    }

    update();
    cooldownIntervalId = setInterval(update, 1000);
}

function spawnBubble() {
    if (!gameContainer || gameContainer.style.display === 'none') return;

    const bubble = document.createElement('div');
    const size = Math.floor(Math.random() * 25) + 60; 
    
    bubble.style.width = size + 'px';
    bubble.style.height = size + 'px';
    bubble.style.left = Math.random() * (window.innerWidth - size) + 'px';
    bubble.style.top = Math.random() * (window.innerHeight - 280) + 160 + 'px';
    
    const types = ['cyber', 'cyber', 'heart-type', 'gold'];
    const chosenType = types[Math.floor(Math.random() * types.length)];
    bubble.classList.add('bubble', chosenType);
    
    if (chosenType === 'cyber') {
        const codes = ["0x" + Math.floor(Math.random()*99), "СИС_1", "ДАТ_0", "ШИФР", "СЕТЬ"];
        bubble.innerText = codes[Math.floor(Math.random() * codes.length)];
    } else if (chosenType === 'heart-type') {
        bubble.innerText = "❤️";
    } else if (chosenType === 'gold') {
        bubble.innerText = "★ " + (Math.floor(Math.random() * 5) + 2) + "x";
    }
    
    bubble.onclick = (e) => {
        e.stopPropagation();
        triggerHapticFeedback(); 
        
        score++;
        const scoreEl = document.getElementById('score');
        if (scoreEl) scoreEl.innerText = score;
        
        bubble.classList.add('popped');
        setTimeout(() => {
            bubble.remove();
            if (score % 10 === 0) showQuote();
            spawnBubble();
        }, 200);
    };
    
    gameContainer.appendChild(bubble);
    
    const tId = setTimeout(() => { 
        if (bubble.parentNode) { 
            bubble.remove(); 
            spawnBubble(); 
        } 
    }, 3500);
    bubbleIntervals.push(tId);
}

function showQuote() {
    const quoteEl = document.getElementById('game-quote');
    if (!quoteEl) return;
    quoteEl.innerText = quotes[Math.floor(Math.random() * quotes.length)];
    
    quoteEl.style.transition = 'none';
    quoteEl.style.opacity = '0';
    quoteEl.style.transform = 'translate(-50%, -30%)';
    
    setTimeout(() => {
        quoteEl.style.transition = 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)';
        quoteEl.style.opacity = '1';
        quoteEl.style.transform = 'translate(-50%, -50%)';
    }, 50);
    
    setTimeout(() => {
        quoteEl.style.transition = 'all 0.8s ease-in';
        quoteEl.style.opacity = '0';
        quoteEl.style.transform = 'translate(-50%, -70%)';
    }, 2500);
}

// ----------------- НЕОНОВАЯ ЗМЕЙКА ENGINE -----------------
const GRID_SIZE = 16; 
const TILE_COUNT = 20; 

let snake = [];
let food = { x: 10, y: 10 };
let snakeDx = 1;
let snakeDy = 0;
let nextDx = 1;
let nextDy = 0;
let snakeScore = 0;
let snakeHighScore = localStorage.getItem('snakeHighScore') || 0;
let snakeGameInterval = null;
let isSnakeRunning = false;

let touchStartX = 0;
let touchStartY = 0;

const backSnakeBtn = document.getElementById('back-to-games-snake');
if (backSnakeBtn) {
    backSnakeBtn.onclick = () => {
        triggerHapticFeedback();
        stopSnakeGame();
        openPage('games-hub-page');
    };
}

function initSnakeCanvas() {
    const canvas = document.getElementById('snakeCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const dpr = window.devicePixelRatio || 1;
    canvas.width = 320 * dpr;
    canvas.height = 320 * dpr;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);

    snake = [
        { x: 5, y: 10 },
        { x: 4, y: 10 },
        { x: 3, y: 10 }
    ];
    food = { x: 12, y: 10 };

    const highScoreEl = document.getElementById('snake-high-score');
    const scoreEl = document.getElementById('snake-score');
    const msgEl = document.getElementById('snake-overlay-msg');
    const overlay = document.getElementById('snake-game-overlay');

    if (highScoreEl) highScoreEl.innerText = snakeHighScore;
    if (scoreEl) scoreEl.innerText = 0;
    if (msgEl) msgEl.innerText = "Свайпай по экрану, чтобы управлять змейкой!";
    if (overlay) overlay.style.display = 'flex';
    
    renderSnakeGame();
}

function drawGrid(ctx) {
    if (!ctx) return;
    ctx.strokeStyle = 'rgba(255, 0, 127, 0.1)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= TILE_COUNT; i++) {
        ctx.beginPath();
        ctx.moveTo(i * GRID_SIZE, 0);
        ctx.lineTo(i * GRID_SIZE, 320);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, i * GRID_SIZE);
        ctx.lineTo(320, i * GRID_SIZE);
        ctx.stroke();
    }
}

function startSnakeGame() {
    triggerHapticFeedback();
    const overlay = document.getElementById('snake-game-overlay');
    if (overlay) overlay.style.display = 'none';
    
    snake = [
        { x: 5, y: 10 },
        { x: 4, y: 10 },
        { x: 3, y: 10 }
    ];
    
    snakeDx = 1; 
    snakeDy = 0;
    nextDx = 1; 
    nextDy = 0;
    
    snakeScore = 0;
    const scoreEl = document.getElementById('snake-score');
    if (scoreEl) scoreEl.innerText = snakeScore;
    
    spawnSnakeFood();
    isSnakeRunning = true;
    
    if (snakeGameInterval) clearInterval(snakeGameInterval);
    snakeGameInterval = setInterval(updateSnakeGame, 130); 
}

function stopSnakeGame() {
    isSnakeRunning = false;
    if (snakeGameInterval) {
        clearInterval(snakeGameInterval);
        snakeGameInterval = null;
    }
}

function spawnSnakeFood() {
    let valid = false;
    while (!valid) {
        food.x = Math.floor(Math.random() * TILE_COUNT);
        food.y = Math.floor(Math.random() * TILE_COUNT);
        valid = !snake.some(segment => segment.x === food.x && segment.y === food.y);
    }
}

function updateSnakeGame() {
    if (!isSnakeRunning) return;

    snakeDx = nextDx;
    snakeDy = nextDy;

    const head = { x: snake[0].x + snakeDx, y: snake[0].y + snakeDy };

    if (head.x < 0 || head.x >= TILE_COUNT || head.y < 0 || head.y >= TILE_COUNT) {
        handleSnakeGameOver();
        return;
    }

    if (snake.some(segment => segment.x === head.x && segment.y === head.y)) {
        handleSnakeGameOver();
        return;
    }

    snake.unshift(head);

    if (head.x === food.x && head.y === food.y) {
        triggerHapticFeedback();
        snakeScore += 1;
        const scoreEl = document.getElementById('snake-score');
        if (scoreEl) scoreEl.innerText = snakeScore;
        
        if (snakeScore > snakeHighScore) {
            snakeHighScore = snakeScore;
            localStorage.setItem('snakeHighScore', snakeHighScore);
            const highScoreEl = document.getElementById('snake-high-score');
            if (highScoreEl) highScoreEl.innerText = snakeHighScore;
        }
        
        spawnSnakeFood();
    } else {
        snake.pop();
    }

    renderSnakeGame();
}

function renderSnakeGame() {
    const canvas = document.getElementById('snakeCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.fillStyle = '#030005';
    ctx.fillRect(0, 0, 320, 320);
    drawGrid(ctx);

    // Food Render
    const foodX = food.x * GRID_SIZE + GRID_SIZE / 2;
    const foodY = food.y * GRID_SIZE + GRID_SIZE / 2;
    
    ctx.shadowColor = '#ff007f';
    ctx.shadowBlur = 12;
    ctx.fillStyle = '#ff007f';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('❤️', foodX, foodY);
    ctx.shadowBlur = 0;

    // Snake Render
    snake.forEach((segment, index) => {
        const x = segment.x * GRID_SIZE;
        const y = segment.y * GRID_SIZE;

        if (index === 0) {
            ctx.shadowColor = '#00f0ff';
            ctx.shadowBlur = 10;
            ctx.fillStyle = '#00f0ff';
        } else {
            ctx.shadowColor = '#bc00dd';
            ctx.shadowBlur = 4;
            ctx.fillStyle = `rgba(188, 0, 221, ${Math.max(0.3, 1 - index / (snake.length + 2))})`;
        }

        ctx.fillRect(x + 1, y + 1, GRID_SIZE - 2, GRID_SIZE - 2);
    });
    
    ctx.shadowBlur = 0;
}

function handleSnakeGameOver() {
    triggerHapticFeedback();
    stopSnakeGame();
    const msgEl = document.getElementById('snake-overlay-msg');
    const overlay = document.getElementById('snake-game-overlay');
    
    if (msgEl) msgEl.innerHTML = `Игра окончена! 💔<br>Собрано сердец: <b>${snakeScore}</b>`;
    if (overlay) overlay.style.display = 'flex';
}

const snakeWrapper = document.querySelector('.snake-canvas-wrapper');

if (snakeWrapper) {
    snakeWrapper.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
    }, { passive: true });

    snakeWrapper.addEventListener('touchend', (e) => {
        if (!isSnakeRunning) return;
        
        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;

        const diffX = touchEndX - touchStartX;
        const diffY = touchEndY - touchStartY;

        if (Math.abs(diffX) > Math.abs(diffY)) {
            if (Math.abs(diffX) > 15) {
                if (diffX > 0 && snakeDx !== -1) { nextDx = 1; nextDy = 0; }
                else if (diffX < 0 && snakeDx !== 1) { nextDx = -1; nextDy = 0; }
            }
        } else {
            if (Math.abs(diffY) > 15) {
                if (diffY > 0 && snakeDy !== -1) { nextDx = 0; nextDy = 1; }
                else if (diffY < 0 && snakeDy !== 1) { nextDx = 0; nextDy = -1; }
            }
        }
    }, { passive: true });
}

window.addEventListener('keydown', (e) => {
    if (!isSnakeRunning) return;
    if (e.key === 'ArrowUp' && snakeDy !== 1) { nextDx = 0; nextDy = -1; }
    else if (e.key === 'ArrowDown' && snakeDy !== -1) { nextDx = 0; nextDy = 1; }
    else if (e.key === 'ArrowLeft' && snakeDx !== 1) { nextDx = -1; nextDy = 0; }
    else if (e.key === 'ArrowRight' && snakeDx !== -1) { nextDx = 1; nextDy = 0; }
});