const canvas = document.getElementById('cat-canvas');
const ctx = canvas.getContext('2d');
const tip = document.querySelector('.cat-tip');
const statusEl = document.getElementById('cat-status');

const btnPlay = document.getElementById('btn-play');
const btnPet = document.getElementById('btn-pet');
const btnSleep = document.getElementById('btn-sleep');
const btnReset = document.getElementById('btn-reset');

let viewWidth = window.innerWidth;
let viewHeight = window.innerHeight;

function resizeCanvas() {
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    viewWidth = window.innerWidth;
    viewHeight = window.innerHeight;

    canvas.width = Math.floor(viewWidth * ratio);
    canvas.height = Math.floor(viewHeight * ratio);
    canvas.style.width = `${viewWidth}px`;
    canvas.style.height = `${viewHeight}px`;

    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
}

resizeCanvas();
window.addEventListener('resize', resizeCanvas);

function setStatus(message) {
    if (statusEl) {
        statusEl.textContent = `Mood: ${message}`;
    }
}

const pointer = {
    x: viewWidth * 0.5,
    y: viewHeight * 0.5,
    vx: 0,
    vy: 0,
    isDown: false,
    justPressed: false,
};

function updatePointer(x, y) {
    pointer.vx = x - pointer.x;
    pointer.vy = y - pointer.y;
    pointer.x = x;
    pointer.y = y;
}

canvas.addEventListener('mousedown', (event) => {
    pointer.isDown = true;
    pointer.justPressed = true;
    updatePointer(event.clientX, event.clientY);
});

window.addEventListener('mousemove', (event) => {
    updatePointer(event.clientX, event.clientY);
});

window.addEventListener('mouseup', () => {
    pointer.isDown = false;
});

canvas.addEventListener('touchstart', (event) => {
    event.preventDefault();
    pointer.isDown = true;
    pointer.justPressed = true;
    updatePointer(event.touches[0].clientX, event.touches[0].clientY);
}, { passive: false });

window.addEventListener('touchmove', (event) => {
    if (!event.touches[0]) {
        return;
    }
    updatePointer(event.touches[0].clientX, event.touches[0].clientY);
}, { passive: true });

window.addEventListener('touchend', () => {
    pointer.isDown = false;
});

class Particle {
    constructor(x, y, color = 'rgba(170, 207, 255, 0.95)', size = 2.2) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 2.8;
        this.vy = (Math.random() - 0.8) * 2.8;
        this.size = Math.random() * size + 0.9;
        this.life = Math.random() * 28 + 22;
        this.color = color;
    }

    update(delta) {
        this.life -= delta;
        this.vy += 0.07 * delta;
        this.x += this.vx * delta;
        this.y += this.vy * delta;
        return this.life > 0;
    }

    draw() {
        const alpha = Math.max(this.life / 52, 0);
        ctx.fillStyle = this.color.replace('0.95', alpha.toFixed(3));
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

class ToyBall {
    constructor() {
        this.active = false;
        this.radius = 9;
        this.x = 0;
        this.y = 0;
        this.vx = 0;
        this.vy = 0;
    }

    spawn(x, y, velocityX) {
        this.active = true;
        this.x = x;
        this.y = y;
        this.vx = velocityX;
        this.vy = -3.2;
    }

    update(delta) {
        if (!this.active) {
            return;
        }

        this.vy += 0.22 * delta;
        this.x += this.vx * delta;
        this.y += this.vy * delta;

        const floor = viewHeight - this.radius - 4;

        if (this.y > floor) {
            this.y = floor;
            this.vy *= -0.52;
            this.vx *= 0.91;
            if (Math.abs(this.vy) < 0.3) {
                this.vy = 0;
            }
        }

        if (this.x < this.radius || this.x > viewWidth - this.radius) {
            this.x = Math.max(this.radius, Math.min(viewWidth - this.radius, this.x));
            this.vx *= -0.88;
        }

        if (Math.abs(this.vx) < 0.04 && Math.abs(this.vy) < 0.04 && this.y >= floor) {
            this.active = false;
        }
    }

    draw() {
        if (!this.active) {
            return;
        }

        ctx.save();
        const grad = ctx.createRadialGradient(this.x - 2, this.y - 2, 1, this.x, this.y, this.radius + 4);
        grad.addColorStop(0, '#dff4ff');
        grad.addColorStop(0.6, '#79c8ff');
        grad.addColorStop(1, '#4c7cff');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

class Cat {
    constructor() {
        this.width = 58;
        this.height = 46;
        this.x = viewWidth * 0.5;
        this.y = viewHeight * 0.25;
        this.vx = (Math.random() - 0.5) * 2.4;
        this.vy = 0;

        this.state = 'falling';
        this.stateTimer = 0;
        this.walkTarget = this.x;
        this.facing = 1;
        this.dragOffsetX = 0;
        this.dragOffsetY = 0;
        this.isBeingDragged = false;

        this.blinkTimer = 90;
        this.blinkProgress = 0;
        this.breath = 0;
        this.tailWave = 0;
        this.petGlow = 0;
        this.sleepWave = 0;
    }

    floorY() {
        return viewHeight - this.height * 0.5;
    }

    emitParticles(list, amount, color, size = 2.2) {
        for (let i = 0; i < amount; i += 1) {
            list.push(new Particle(this.x, this.y - this.height * 0.1, color, size));
        }
    }

    resetToCurious() {
        this.state = 'idle';
        this.stateTimer = Math.random() * 130 + 90;
        this.walkTarget = this.x;
        this.vx *= 0.2;
        setStatus('curious and ready to play');
    }

    startWalk() {
        this.state = 'walking';
        this.stateTimer = Math.random() * 200 + 130;
        this.walkTarget = Math.random() * (viewWidth - 140) + 70;
        setStatus('exploring the screen');
    }

    pet(particles) {
        this.petGlow = 1;
        this.state = 'happy';
        this.stateTimer = 80;
        this.vx *= 0.65;
        setStatus('happy purr mode');
        this.emitParticles(particles, 12, 'rgba(255, 176, 219, 0.95)', 2.8);
    }

    nap() {
        this.state = 'sleeping';
        this.stateTimer = 420;
        this.vx = 0;
        setStatus('sleeping peacefully');
    }

    throwToy(toy, particles) {
        const direction = Math.random() < 0.5 ? -1 : 1;
        const startX = this.x + direction * 30;
        const targetX = Math.max(24, Math.min(viewWidth - 24, startX + direction * (120 + Math.random() * 180)));
        const speed = (targetX - startX) / 26;

        toy.spawn(startX, this.y - 28, speed);
        this.state = 'chasing';
        this.stateTimer = 260;
        setStatus('locked in on the toy');
        this.emitParticles(particles, 9, 'rgba(175, 220, 255, 0.95)', 2.5);
    }

    checkDrag(particles) {
        if (pointer.justPressed && !this.isBeingDragged) {
            const dx = pointer.x - this.x;
            const dy = pointer.y - this.y;
            const dist = Math.hypot(dx, dy);

            if (dist < this.width * 0.9) {
                this.isBeingDragged = true;
                this.state = 'dragged';
                this.dragOffsetX = this.x - pointer.x;
                this.dragOffsetY = this.y - pointer.y;
                setStatus('being dragged (no complaints yet)');
                this.emitParticles(particles, 6, 'rgba(177, 224, 255, 0.95)', 2.2);
            }
        }

        if (this.isBeingDragged && !pointer.isDown) {
            this.isBeingDragged = false;
            this.state = 'falling';
            this.vx = pointer.vx * 0.65;
            this.vy = pointer.vy * 0.2 - 1.6;
            this.emitParticles(particles, 8, 'rgba(156, 193, 255, 0.95)', 2.5);
            setStatus('airborne acrobatics');
        }
    }

    updateState(delta, toy, particles) {
        if (this.state === 'sleeping') {
            this.stateTimer -= delta;
            this.vx *= 0.84;
            if (this.stateTimer <= 0) {
                this.resetToCurious();
            }
            return;
        }

        if (toy.active && this.state !== 'dragged') {
            this.state = 'chasing';
            const direction = Math.sign(toy.x - this.x) || 1;
            this.vx += (direction * 2.2 - this.vx) * 0.08 * delta;
            this.stateTimer -= delta;

            const toyDistance = Math.hypot(toy.x - this.x, toy.y - this.y);
            if (toyDistance < this.width * 0.7) {
                toy.active = false;
                this.petGlow = 1;
                this.state = 'happy';
                this.stateTimer = 100;
                setStatus('caught the toy like a champion');
                this.emitParticles(particles, 15, 'rgba(165, 217, 255, 0.95)', 2.7);
                return;
            }

            if (this.stateTimer <= 0) {
                this.resetToCurious();
            }
            return;
        }

        if (this.state === 'idle') {
            this.stateTimer -= delta;
            this.vx *= 0.91;
            if (this.stateTimer <= 0) {
                this.startWalk();
            }
            return;
        }

        if (this.state === 'walking') {
            this.stateTimer -= delta;
            const direction = Math.sign(this.walkTarget - this.x) || 1;
            this.vx += (direction * 1.35 - this.vx) * 0.07 * delta;

            if (Math.abs(this.walkTarget - this.x) < 8 || this.stateTimer <= 0) {
                this.resetToCurious();
            }
            return;
        }

        if (this.state === 'happy') {
            this.stateTimer -= delta;
            this.vx *= 0.9;
            if (this.stateTimer <= 0) {
                this.resetToCurious();
            }
        }
    }

    handleCollisions(particles) {
        const floor = this.floorY();

        if (this.y > floor) {
            const impact = Math.abs(this.vy);
            this.y = floor;
            this.vy = 0;

            if (this.state === 'falling') {
                this.resetToCurious();
                if (impact > 1.4) {
                    this.emitParticles(particles, 8, 'rgba(121, 174, 255, 0.95)', 2.4);
                }
            }
        }

        if (this.x > viewWidth - this.width * 0.5) {
            this.x = viewWidth - this.width * 0.5;
            this.walkTarget = Math.max(80, this.x - 160);
            this.vx *= -0.6;
        }

        if (this.x < this.width * 0.5) {
            this.x = this.width * 0.5;
            this.walkTarget = Math.min(viewWidth - 80, this.x + 160);
            this.vx *= -0.6;
        }
    }

    update(delta, toy, particles) {
        this.checkDrag(particles);

        this.breath += 0.08 * delta;
        this.tailWave += (this.state === 'walking' || this.state === 'chasing' ? 0.23 : 0.08) * delta;
        this.sleepWave += 0.05 * delta;
        this.petGlow = Math.max(0, this.petGlow - 0.024 * delta);

        this.blinkTimer -= delta;
        if (this.blinkTimer <= 0) {
            this.blinkProgress = 1;
            this.blinkTimer = Math.random() * 170 + 110;
        }
        this.blinkProgress = Math.max(0, this.blinkProgress - 0.16 * delta);

        if (this.isBeingDragged) {
            this.x = pointer.x + this.dragOffsetX;
            this.y = pointer.y + this.dragOffsetY;
            this.vx = 0;
            this.vy = 0;
        } else {
            this.updateState(delta, toy, particles);

            this.vy += (this.state === 'falling' ? 0.26 : 0.09) * delta;
            this.x += this.vx * delta;
            this.y += this.vy * delta;
        }

        this.handleCollisions(particles);

        if (Math.abs(this.vx) > 0.2) {
            this.facing = this.vx > 0 ? 1 : -1;
        }
    }

    draw() {
        const sleepBob = this.state === 'sleeping' ? Math.sin(this.sleepWave) * 1.4 : 0;
        const bob = Math.sin(this.breath) * 1.5 + sleepBob;
        const floorShadow = 12 + Math.min(Math.abs(this.vy), 8) * 1.35;

        ctx.save();
        ctx.globalAlpha = 0.28;
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.ellipse(this.x, this.floorY() + this.height * 0.48, this.width * 0.44, floorShadow * 0.43, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        ctx.save();
        ctx.translate(this.x, this.y + bob);
        ctx.scale(this.facing, 1);

        const bodyWidth = 38;
        const bodyHeight = this.state === 'sleeping' ? 20 : 24;
        const headRadius = this.state === 'sleeping' ? 11.5 : 13;
        const legHeight = this.state === 'sleeping' ? 5 : 8;
        const step = Math.sin(this.tailWave) * (this.state === 'sleeping' ? 0.3 : 1.7);

        if (this.petGlow > 0.02) {
            ctx.save();
            ctx.globalAlpha = this.petGlow * 0.28;
            ctx.fillStyle = '#ff9ed8';
            ctx.beginPath();
            ctx.ellipse(0, -10, 34, 23, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        ctx.fillStyle = '#1f2744';
        ctx.fillRect(-bodyWidth / 2 + 5, bodyHeight / 2, 7, legHeight + step);
        ctx.fillRect(bodyWidth / 2 - 12, bodyHeight / 2, 7, legHeight - step);

        ctx.strokeStyle = '#25315f';
        ctx.lineWidth = 5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-bodyWidth / 2 + 1, -2);
        ctx.quadraticCurveTo(-bodyWidth / 2 - 18, -8 + Math.sin(this.tailWave) * 2.8, -bodyWidth / 2 - 13, 16);
        ctx.stroke();

        ctx.fillStyle = '#26335f';
        ctx.fillRect(-bodyWidth / 2, -bodyHeight / 2, bodyWidth, bodyHeight);

        ctx.beginPath();
        ctx.arc(0, -bodyHeight / 2 - headRadius / 2 + 1.4, headRadius, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(-8, -bodyHeight / 2 - headRadius + 3);
        ctx.lineTo(-2, -bodyHeight / 2 - headRadius - 8);
        ctx.lineTo(2, -bodyHeight / 2 - headRadius + 1.4);
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(8, -bodyHeight / 2 - headRadius + 3);
        ctx.lineTo(2, -bodyHeight / 2 - headRadius - 8);
        ctx.lineTo(-2, -bodyHeight / 2 - headRadius + 1.4);
        ctx.fill();

        const eyeY = -bodyHeight / 2 - headRadius / 1.5 + 2.4;
        const eyelid = this.state === 'sleeping' ? 2.6 : Math.min(this.blinkProgress * 5, 5);

        ctx.fillStyle = '#e9f2ff';
        ctx.fillRect(-5.8, eyeY, 3.2, Math.max(0.8, 3 - eyelid));
        ctx.fillRect(2.6, eyeY, 3.2, Math.max(0.8, 3 - eyelid));

        ctx.strokeStyle = '#d4e6ff';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(-2, eyeY + 7.2);
        ctx.quadraticCurveTo(0, eyeY + (this.state === 'sleeping' ? 8.6 : 9), 2, eyeY + 7.2);
        ctx.stroke();

        if (this.state === 'sleeping') {
            ctx.fillStyle = 'rgba(210, 225, 255, 0.85)';
            ctx.font = '12px Inter, Segoe UI, sans-serif';
            ctx.fillText('z', 16, -28 + Math.sin(this.sleepWave * 1.2) * 2.6);
            ctx.fillText('z', 22, -36 + Math.sin(this.sleepWave * 1.4) * 1.8);
        }

        ctx.restore();
    }
}

const particles = [];
const toy = new ToyBall();
const cat = new Cat();

cat.resetToCurious();

function throwToyFromControls() {
    cat.throwToy(toy, particles);
}

function petFromControls() {
    cat.pet(particles);
}

function sleepFromControls() {
    toy.active = false;
    cat.nap();
}

function resetFromControls() {
    toy.active = false;
    cat.resetToCurious();
}

if (btnPlay) {
    btnPlay.addEventListener('click', throwToyFromControls);
}

if (btnPet) {
    btnPet.addEventListener('click', petFromControls);
}

if (btnSleep) {
    btnSleep.addEventListener('click', sleepFromControls);
}

if (btnReset) {
    btnReset.addEventListener('click', resetFromControls);
}

function applyHashAction(hashValue) {
    const action = (hashValue || '').replace('#', '').trim().toLowerCase();
    if (!action) {
        return;
    }

    if (action === 'play') {
        throwToyFromControls();
        return;
    }

    if (action === 'pet') {
        petFromControls();
        return;
    }

    if (action === 'sleep') {
        sleepFromControls();
    }
}

window.addEventListener('hashchange', () => {
    applyHashAction(window.location.hash);
});

setTimeout(() => {
    applyHashAction(window.location.hash);
}, 120);

const tipMessages = [
    '🐾 Drag the cat around the scene for instant interaction.',
    '🎾 Use “Throw toy” and watch the cat chase it.',
    '💖 Try “Pet cat” and “Nap mode” to see mood changes.',
    '🚀 This playful UX is built to make your brand memorable.'
];

let tipIndex = 0;
let tipTimer = 0;

function updateTip(delta) {
    if (!tip) {
        return;
    }

    tipTimer += delta;
    if (tipTimer > 320) {
        tipTimer = 0;
        tipIndex = (tipIndex + 1) % tipMessages.length;
        tip.textContent = tipMessages[tipIndex];
    }
}

let lastTime = performance.now();

function animate(now) {
    const delta = Math.min((now - lastTime) / 16.6667, 2);
    lastTime = now;

    ctx.clearRect(0, 0, viewWidth, viewHeight);

    toy.update(delta);
    cat.update(delta, toy, particles);

    toy.draw();
    cat.draw();

    for (let i = particles.length - 1; i >= 0; i -= 1) {
        if (!particles[i].update(delta)) {
            particles.splice(i, 1);
            continue;
        }
        particles[i].draw();
    }

    updateTip(delta);

    pointer.justPressed = false;
    requestAnimationFrame(animate);
}

requestAnimationFrame(animate);