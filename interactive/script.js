const canvas = document.getElementById('cat-canvas');
const ctx = canvas.getContext('2d');
const tip = document.querySelector('.cat-tip');

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

window.addEventListener('mouseup', () => {
    pointer.isDown = false;
});

window.addEventListener('mousemove', (event) => {
    updatePointer(event.clientX, event.clientY);
});

canvas.addEventListener('touchstart', (event) => {
    event.preventDefault();
    pointer.isDown = true;
    pointer.justPressed = true;
    updatePointer(event.touches[0].clientX, event.touches[0].clientY);
}, { passive: false });

window.addEventListener('touchend', () => {
    pointer.isDown = false;
});

window.addEventListener('touchmove', (event) => {
    if (!event.touches[0]) {
        return;
    }
    updatePointer(event.touches[0].clientX, event.touches[0].clientY);
}, { passive: true });

class Spark {
    constructor(x, y, color = 'rgba(170, 207, 255, 0.95)') {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 2.8;
        this.vy = (Math.random() - 0.8) * 2.4;
        this.life = Math.random() * 28 + 22;
        this.size = Math.random() * 2 + 1;
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
        const alpha = Math.max(this.life / 50, 0);
        ctx.fillStyle = this.color.replace('0.95', alpha.toFixed(3));
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

class Cat {
    constructor() {
        this.width = 58;
        this.height = 46;
        this.x = viewWidth * 0.5;
        this.y = viewHeight * 0.26;
        this.vx = (Math.random() - 0.5) * 3;
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
    }

    floorY() {
        return viewHeight - this.height * 0.5;
    }

    startIdle() {
        this.state = 'idle';
        this.stateTimer = Math.random() * 130 + 70;
        this.vx *= 0.2;
    }

    startWalk() {
        this.state = 'walking';
        this.stateTimer = Math.random() * 220 + 120;
        this.walkTarget = Math.random() * (viewWidth - 160) + 80;
    }

    emitSparks(list, amount, color) {
        for (let i = 0; i < amount; i += 1) {
            list.push(new Spark(this.x, this.y - this.height * 0.1, color));
        }
    }

    checkDrag(sparks) {
        if (pointer.justPressed && !this.isBeingDragged) {
            const dx = pointer.x - this.x;
            const dy = pointer.y - this.y;
            const dist = Math.hypot(dx, dy);

            if (dist < this.width * 0.9) {
                this.isBeingDragged = true;
                this.state = 'dragged';
                this.dragOffsetX = this.x - pointer.x;
                this.dragOffsetY = this.y - pointer.y;
                this.emitSparks(sparks, 6, 'rgba(177, 224, 255, 0.95)');
            }
        }

        if (this.isBeingDragged && !pointer.isDown) {
            this.isBeingDragged = false;
            this.state = 'falling';
            this.vx = pointer.vx * 0.65;
            this.vy = pointer.vy * 0.2 - 1.6;
            this.emitSparks(sparks, 10, 'rgba(156, 193, 255, 0.95)');
        }
    }

    updateState(delta) {
        if (this.state === 'idle') {
            this.stateTimer -= delta;
            this.vx *= 0.92;
            if (this.stateTimer <= 0) {
                this.startWalk();
            }
            return;
        }

        if (this.state === 'walking') {
            this.stateTimer -= delta;
            const direction = Math.sign(this.walkTarget - this.x) || 1;
            const speed = 1.25;
            this.vx += (direction * speed - this.vx) * 0.07 * delta;

            if (Math.abs(this.walkTarget - this.x) < 8 || this.stateTimer <= 0) {
                this.startIdle();
            }
        }
    }

    handleCollisions(sparks) {
        const floor = this.floorY();

        if (this.y > floor) {
            const impact = Math.abs(this.vy);
            this.y = floor;
            this.vy = 0;

            if (this.state === 'falling') {
                this.startIdle();
                if (impact > 1.4) {
                    this.emitSparks(sparks, 8, 'rgba(121, 174, 255, 0.95)');
                }
            }
        }

        if (this.x > viewWidth - this.width * 0.5) {
            this.x = viewWidth - this.width * 0.5;
            this.walkTarget = Math.max(80, this.x - 180);
            this.vx *= -0.6;
        }

        if (this.x < this.width * 0.5) {
            this.x = this.width * 0.5;
            this.walkTarget = Math.min(viewWidth - 80, this.x + 180);
            this.vx *= -0.6;
        }
    }

    update(delta, sparks) {
        this.checkDrag(sparks);
        this.breath += 0.08 * delta;
        this.tailWave += (this.state === 'walking' ? 0.2 : 0.07) * delta;

        this.blinkTimer -= delta;
        if (this.blinkTimer <= 0) {
            this.blinkProgress = 1;
            this.blinkTimer = Math.random() * 180 + 100;
        }
        this.blinkProgress = Math.max(0, this.blinkProgress - 0.16 * delta);

        if (this.isBeingDragged) {
            this.x = pointer.x + this.dragOffsetX;
            this.y = pointer.y + this.dragOffsetY;
            this.vx = 0;
            this.vy = 0;
        } else {
            this.updateState(delta);

            if (this.state === 'falling') {
                this.vy += 0.26 * delta;
            } else {
                this.vy += 0.08 * delta;
            }

            this.x += this.vx * delta;
            this.y += this.vy * delta;
        }

        this.handleCollisions(sparks);

        if (Math.abs(this.vx) > 0.2) {
            this.facing = this.vx > 0 ? 1 : -1;
        }
    }

    draw() {
        const bob = Math.sin(this.breath) * 1.6;
        const floorShadow = 12 + Math.min(Math.abs(this.vy), 8) * 1.4;

        ctx.save();
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.ellipse(this.x, this.floorY() + this.height * 0.48, this.width * 0.42, floorShadow * 0.42, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        ctx.save();
        ctx.translate(this.x, this.y + bob);
        ctx.scale(this.facing, 1);

        const bodyWidth = 38;
        const bodyHeight = 24;
        const headRadius = 13;
        const legHeight = 8;

        const step = Math.sin(this.tailWave) * 1.7;

        ctx.fillStyle = '#1f2744';
        ctx.fillRect(-bodyWidth / 2 + 5, bodyHeight / 2, 7, legHeight + step);
        ctx.fillRect(bodyWidth / 2 - 12, bodyHeight / 2, 7, legHeight - step);

        ctx.strokeStyle = '#25315f';
        ctx.lineWidth = 5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-bodyWidth / 2 + 1, -3);
        ctx.quadraticCurveTo(-bodyWidth / 2 - 18, -8 + Math.sin(this.tailWave) * 3, -bodyWidth / 2 - 14, 16);
        ctx.stroke();

        ctx.fillStyle = '#26335f';
        ctx.fillRect(-bodyWidth / 2, -bodyHeight / 2, bodyWidth, bodyHeight);

        ctx.beginPath();
        ctx.arc(0, -bodyHeight / 2 - headRadius / 2 + 1, headRadius, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(-8, -bodyHeight / 2 - headRadius + 2);
        ctx.lineTo(-2, -bodyHeight / 2 - headRadius - 9);
        ctx.lineTo(2, -bodyHeight / 2 - headRadius + 1);
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(8, -bodyHeight / 2 - headRadius + 2);
        ctx.lineTo(2, -bodyHeight / 2 - headRadius - 9);
        ctx.lineTo(-2, -bodyHeight / 2 - headRadius + 1);
        ctx.fill();

        const eyeY = -bodyHeight / 2 - headRadius / 1.55 + 2;
        const eyelid = Math.min(this.blinkProgress * 5, 5);
        ctx.fillStyle = '#e9f2ff';
        ctx.fillRect(-5.8, eyeY, 3.2, Math.max(0.8, 3 - eyelid));
        ctx.fillRect(2.6, eyeY, 3.2, Math.max(0.8, 3 - eyelid));

        ctx.strokeStyle = '#d4e6ff';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(-2, eyeY + 7.2);
        ctx.quadraticCurveTo(0, eyeY + 9, 2, eyeY + 7.2);
        ctx.stroke();

        ctx.restore();
    }
}

const sparks = [];
const cat = new Cat();

const tipMessages = [
    '🐾 Drag the cat around. A playful brand moment = memorable first impression.',
    '✨ Small interactions build trust faster than plain pages.',
    '🚀 Want this quality for your brand? Use “Start your project”.'
];

let tipIndex = 0;
let tipTimer = 0;

function updateTip(delta) {
    if (!tip) {
        return;
    }

    tipTimer += delta;
    if (tipTimer > 380) {
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

    cat.update(delta, sparks);
    cat.draw();

    for (let i = sparks.length - 1; i >= 0; i -= 1) {
        if (!sparks[i].update(delta)) {
            sparks.splice(i, 1);
            continue;
        }
        sparks[i].draw();
    }

    updateTip(delta);

    pointer.justPressed = false;
    requestAnimationFrame(animate);
}

requestAnimationFrame(animate);