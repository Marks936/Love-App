const lines = [
    "Name: Anastasia\u00A0Hatylo",
    "Device: iPhone\u00A013",
    "Password: *************"
];

const quotes = [
    "Умница! 🌟", "Люблю тебя ❤️", "Так держать, солнце! ☀️", 
    "Моя хакерша 🥰", "Просто лучшая! ✨", "Ты со всем справишься! 💪"
];

const consoleScreen = document.getElementById('console-screen');
const accessPanel = document.getElementById('access-panel');
const finalMessage = document.getElementById('final-message');
const canvasElement = document.getElementById('heartCanvas');
const ctx = canvasElement.getContext('2d');
const gameContainer = document.getElementById('game-container');

let particles = [];
let heartPhase = 0; 
let score = 0;
const mouse = { x: -2000, y: -2000 }; // Далеко за экраном в начале

// Обработка взаимодействия
const updateMouse = (e) => {
    if (e.touches) {
        mouse.x = e.touches[0].clientX;
        mouse.y = e.touches[0].clientY;
    } else {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
    }
};

window.addEventListener('mousemove', updateMouse);
window.addEventListener('touchstart', updateMouse, {passive: false});
window.addEventListener('touchmove', (e) => {
    updateMouse(e);
    e.preventDefault(); // Запрет скролла во время "рисования"
}, {passive: false});

function typeText(elementId, text, callback) {
    let i = 0;
    const el = document.getElementById(elementId);
    const interval = setInterval(() => {
        el.innerText += text[i];
        i++;
        if (i === text.length) {
            clearInterval(interval);
            if (callback) callback();
        }
    }, 40);
}

function startFlow() {
    typeText("line1", lines[0], () => {
        setTimeout(() => {
            typeText("line2", lines[1], () => {
                setTimeout(() => {
                    typeText("line3", lines[2], () => {
                        setTimeout(() => {
                            consoleScreen.classList.add('minimized');
                            setTimeout(startAccessPanel, 600);
                        }, 800);
                    });
                }, 200);
            });
        }, 200);
    });
}

function startAccessPanel() {
    accessPanel.style.display = 'block';
    setTimeout(() => {
        accessPanel.style.display = 'none';
        startHeartPhase();
    }, 2000);
}

function initCanvas() {
    const dpr = window.devicePixelRatio || 1;
    canvasElement.width = window.innerWidth * dpr;
    canvasElement.height = window.innerHeight * dpr;
    ctx.scale(dpr, dpr);
    canvasElement.style.width = window.innerWidth + 'px';
    canvasElement.style.height = window.innerHeight + 'px';

    particles = [];
    for (let i = 0; i < 2200; i++) {
        particles.push({
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
            vx: 0,
            vy: 0,
            originalX: 0,
            originalY: 0,
            friction: 0.92, // Трение для мягкости
            spring: 0.04,   // Сила возврата в форму сердца
            char: Math.random() > 0.5 ? "1" : "0"
        });
    }
}

function getHeartPoint(t) {
    const x = 16 * Math.pow(Math.sin(t), 3);
    const y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
    return { x, y };
}

function animate() {
    if (heartPhase === 2) return;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)'; // Хвосты у частиц
    ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
    
    const time = Date.now() * 0.0012;
    const scale = Math.min(window.innerWidth, window.innerHeight) / 42;

    particles.forEach((p, i) => {
        if (heartPhase === 0) {
            // Хаотичное движение в начале
            if(p.vx === 0) { p.vx = (Math.random()-0.5)*4; p.vy = (Math.random()-0.5)*4; }
            p.x += p.vx; p.y += p.vy;
            if (p.x < 0 || p.x > window.innerWidth) p.vx *= -1;
            if (p.y < 0 || p.y > window.innerHeight) p.vy *= -1;
            ctx.fillStyle = '#00ff41';
        } else {
            // Логика сердца
            const t = (i / particles.length) * Math.PI * 2;
            const pos = getHeartPoint(t);
            p.originalX = window.innerWidth / 2 + pos.x * (scale + Math.sin(time * 2) * 1.2);
            p.originalY = (window.innerHeight / 2 - 20) + pos.y * (scale + Math.sin(time * 2) * 1.2);

            // Взаимодействие с пальцем (ИНТЕРАКТИВ)
            const dx = mouse.x - p.x;
            const dy = mouse.y - p.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const maxDist = 100; // Радиус взаимодействия

            if (dist < maxDist) {
                const angle = Math.atan2(dy, dx);
                const push = (maxDist - dist) * 0.15; // Сила отталкивания
                p.vx -= Math.cos(angle) * push;
                p.vy -= Math.sin(angle) * push;
            }

            // Возврат к форме сердца
            p.vx += (p.originalX - p.x) * p.spring;
            p.vy += (p.originalY - p.y) * p.spring;

            p.vx *= p.friction;
            p.vy *= p.friction;

            p.x += p.vx;
            p.y += p.vy;

            ctx.fillStyle = '#ff0055';
        }
        ctx.font = '10px monospace';
        ctx.fillText(p.char, p.x, p.y);
    });
    requestAnimationFrame(animate);
}

function startHeartPhase() {
    canvasElement.style.opacity = "1";
    initCanvas();
    animate();
    consoleScreen.classList.add('fade-out');
    
    setTimeout(() => {
        heartPhase = 1;
        setTimeout(() => { if(consoleScreen.parentNode) consoleScreen.remove(); }, 1000);
        setTimeout(() => {
            finalMessage.style.opacity = "1";
            finalMessage.style.pointerEvents = "auto";
            finalMessage.onclick = startMiniGame;
        }, 3000);
    }, 4000); 
}

function startMiniGame() {
    heartPhase = 2;
    canvasElement.style.opacity = "0";
    finalMessage.style.opacity = "0";
    setTimeout(() => {
        gameContainer.style.display = 'block';
        spawnBubble();
    }, 1000);
}

function spawnBubble() {
    if (heartPhase !== 2) return;
    if (document.getElementsByClassName('bubble').length > 4) {
        setTimeout(spawnBubble, 500);
        return;
    }
    const bubble = document.createElement('div');
    bubble.className = 'bubble';
    const size = 65;
    bubble.style.width = size + 'px';
    bubble.style.height = size + 'px';
    bubble.style.left = Math.random() * (window.innerWidth - size) + 'px';
    bubble.style.top = Math.random() * (window.innerHeight - 250) + 180 + 'px';
    bubble.innerText = "0x" + Math.floor(Math.random()*99);
    
    bubble.onclick = (e) => {
        e.stopPropagation();
        if (navigator.vibrate) navigator.vibrate(40);
        score++;
        document.getElementById('score').innerText = score;
        bubble.remove();
        if (score % 10 === 0) showQuote();
        spawnBubble();
    };
    
    gameContainer.appendChild(bubble);
    setTimeout(() => { if(bubble.parentNode) { bubble.remove(); spawnBubble(); } }, 3000);
}

function showQuote() {
    const quoteEl = document.getElementById('game-quote');
    quoteEl.innerText = quotes[Math.floor(Math.random() * quotes.length)];
    quoteEl.style.opacity = 1;
    setTimeout(() => { quoteEl.style.opacity = 0; }, 2000);
}

window.onload = startFlow;
window.onresize = initCanvas;
