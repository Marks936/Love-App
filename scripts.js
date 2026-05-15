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
const mouse = { x: null, y: null, radius: 90 }; 

// Отслеживание касаний
const updateMouse = (e) => {
    const rect = canvasElement.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    mouse.x = clientX - rect.left;
    mouse.y = clientY - rect.top;
};

window.addEventListener('mousemove', updateMouse);
window.addEventListener('touchstart', updateMouse, {passive: false});
window.addEventListener('touchmove', (e) => { updateMouse(e); e.preventDefault(); }, {passive: false});
window.addEventListener('touchend', () => { mouse.x = null; mouse.y = null; });

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

function initHeart() {
    canvasElement.width = window.innerWidth;
    canvasElement.height = window.innerHeight;
    particles = [];
    for (let i = 0; i < 2500; i++) {
        particles.push({
            x: Math.random() * canvasElement.width,
            y: Math.random() * canvasElement.height,
            vx: (Math.random() - 0.5) * 2,
            vy: (Math.random() - 0.5) * 2,
            char: Math.random() > 0.5 ? "1" : "0"
        });
    }
}

function getHeartPoint(t) {
    const x = 16 * Math.pow(Math.sin(t), 3);
    const y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
    return { x, y };
}

function draw() {
    if (heartPhase === 2) return;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
    ctx.fillRect(0, 0, canvasElement.width, canvasElement.height);
    
    const time = Date.now() * 0.0015;
    const scale = Math.min(canvasElement.width, canvasElement.height) / 42;

    particles.forEach((p, i) => {
        if (heartPhase === 0) {
            p.x += p.vx * 3;
            p.y += p.vy * 3;
            if (p.x < 0 || p.x > canvasElement.width) p.vx *= -1;
            if (p.y < 0 || p.y > canvasElement.height) p.vy *= -1;
            ctx.fillStyle = '#00ff41';
        } else {
            const t = (i / particles.length) * Math.PI * 2;
            const pos = getHeartPoint(t);
            const targetX = canvasElement.width / 2 + pos.x * (scale + Math.sin(time * 3) * 1.2);
            const targetY = (canvasElement.height / 2 - 30) + pos.y * (scale + Math.sin(time * 3) * 1.2);
            
            // ЛОГИКА ОТТАЛКИВАНИЯ (как в твоем примере)
            if (mouse.x !== null && mouse.y !== null) {
                const dx = mouse.x - p.x;
                const dy = mouse.y - p.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance < mouse.radius) {
                    const force = (mouse.radius - distance) / mouse.radius;
                    const dirX = dx / (distance || 1);
                    const dirY = dy / (distance || 1);
                    // Частицы убегают от пальца
                    p.x -= dirX * force * 12;
                    p.y -= dirY * force * 12;
                }
            }

            // Плавное возвращение к форме сердца
            p.x += (targetX - p.x) * 0.05;
            p.y += (targetY - p.y) * 0.05;
            ctx.fillStyle = '#ff0055';
        }
        
        ctx.font = '10px monospace';
        ctx.fillText(p.char, p.x, p.y);
    });
    requestAnimationFrame(draw);
}

function startHeartPhase() {
    canvasElement.style.opacity = "1";
    initHeart();
    draw();
    consoleScreen.classList.add('fade-out');
    
    setTimeout(() => {
        heartPhase = 1;
        setTimeout(() => { if(consoleScreen.parentNode) consoleScreen.remove(); }, 1200);
        setTimeout(() => {
            finalMessage.style.opacity = "1";
            finalMessage.style.pointerEvents = "auto";
            finalMessage.onclick = startMiniGame;
        }, 4000);
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
window.onresize = () => { initHeart(); };
