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
const mouse = { x: -3000, y: -3000 };
let transitionAlpha = 0; // Для плавного проявления сердца

const updatePosition = (e) => {
    const pos = e.touches ? e.touches[0] : e;
    mouse.x = pos.clientX;
    mouse.y = pos.clientY;
};

window.addEventListener('mousemove', updatePosition);
window.addEventListener('touchstart', (e) => { updatePosition(e); }, {passive: false});
window.addEventListener('touchmove', (e) => { updatePosition(e); e.preventDefault(); }, {passive: false});

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
    }, 45);
}

function startFlow() {
    typeText("line1", lines[0], () => {
        setTimeout(() => {
            typeText("line2", lines[1], () => {
                setTimeout(() => {
                    typeText("line3", lines[2], () => {
                        setTimeout(() => {
                            consoleScreen.classList.add('minimized');
                            setTimeout(startAccessPanel, 800);
                        }, 1000);
                    });
                }, 300);
            });
        }, 300);
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
            vx: (Math.random() - 0.5) * 1.5,
            vy: (Math.random() - 0.5) * 1.5,
            friction: 0.92 + Math.random() * 0.03, // Разное трение для глубины
            spring: 0.02 + Math.random() * 0.01,
            opacity: 0.2 + Math.random() * 0.6,
            size: 8 + Math.random() * 3,
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
    
    // Эффект "эха" — очень слабый шлейф для максимальной плавности
    ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
    ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
    
    const time = Date.now() * 0.001;
    const scale = Math.min(window.innerWidth, window.innerHeight) / 45;

    if (heartPhase === 1 && transitionAlpha < 1) transitionAlpha += 0.005;

    particles.forEach((p, i) => {
        if (heartPhase === 0) {
            p.x += p.vx; p.y += p.vy;
            if (p.x < 0 || p.x > window.innerWidth) p.vx *= -1;
            if (p.y < 0 || p.y > window.innerHeight) p.vy *= -1;
            ctx.fillStyle = `rgba(0, 255, 65, ${p.opacity * 0.4})`;
        } else {
            const t = (i / particles.length) * Math.PI * 2;
            const pos = getHeartPoint(t);
            
            // Плавное пульсирующее движение
            const pulse = Math.sin(time * 2 + i * 0.01) * 0.8;
            const targetX = window.innerWidth / 2 + pos.x * (scale + pulse);
            const targetY = (window.innerHeight / 2 - 20) + pos.y * (scale + pulse);

            // МЯГКОЕ ОБТЕКАНИЕ (Интерактив)
            const dx = mouse.x - p.x;
            const dy = mouse.y - p.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const influence = 110; 

            if (dist < influence) {
                const power = (1 - dist / influence) * 0.12; 
                p.vx -= dx * power;
                p.vy -= dy * power;
            }

            // Пружинистый возврат
            p.vx += (targetX - p.x) * p.spring;
            p.vy += (targetY - p.y) * p.spring;

            p.vx *= p.friction;
            p.vy *= p.friction;

            p.x += p.vx;
            p.y += p.vy;

            // Цвет меняется от зеленого к розовому при сборке
            const r = Math.floor(0 + 255 * transitionAlpha);
            const g = Math.floor(255 - 255 * transitionAlpha);
            const b = Math.floor(65 + (85 - 65) * transitionAlpha);
            ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${p.opacity * transitionAlpha})`;
        }
        
        ctx.font = `${p.size}px monospace`;
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
        setTimeout(() => { if(consoleScreen.parentNode) consoleScreen.remove(); }, 1500);
        setTimeout(() => {
            finalMessage.style.opacity = "1";
            finalMessage.style.pointerEvents = "auto";
            finalMessage.onclick = startMiniGame;
        }, 3500);
    }, 4500); 
}

function startMiniGame() {
    heartPhase = 2;
    canvasElement.style.opacity = "0";
    finalMessage.style.opacity = "0";
    setTimeout(() => {
        gameContainer.style.display = 'block';
        spawnBubble();
    }, 1200);
}

function spawnBubble() {
    if (heartPhase !== 2) return;
    if (document.getElementsByClassName('bubble').length > 4) {
        setTimeout(spawnBubble, 600);
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
    setTimeout(() => { if(bubble.parentNode) { bubble.remove(); spawnBubble(); } }, 3500);
}

function showQuote() {
    const quoteEl = document.getElementById('game-quote');
    quoteEl.innerText = quotes[Math.floor(Math.random() * quotes.length)];
    quoteEl.style.opacity = 1;
    setTimeout(() => { quoteEl.style.opacity = 0; }, 2000);
}

window.onload = startFlow;
window.onresize = initCanvas;
