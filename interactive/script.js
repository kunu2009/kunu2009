const canvas = document.getElementById('cat-canvas');
const ctx = canvas.getContext('2d');
const tip = document.querySelector('.cat-tip');
const statusEl = document.getElementById('cat-status');

const btnPlay = document.getElementById('btn-play');
const btnPet = document.getElementById('btn-pet');
const btnSleep = document.getElementById('btn-sleep');
const btnReset = document.getElementById('btn-reset');
const weaveCanvas = document.getElementById('weave-canvas');
const weaveCtx = weaveCanvas ? weaveCanvas.getContext('2d') : null;
const weaveCard = document.querySelector('.text-weave');

const weaveCopy =
    'Drag the cat through this paragraph and watch the words make room for whiskers, paws, and tiny dramatic detours. '
    + 'The layout is measured before it is drawn, so the copy can react to the cat instead of colliding with it. '
    + 'That is the same pretext-style idea: measure first, then shape the text flow yourself.';

const weaveState = {
    width: 0,
    height: 0,
    ratio: 1,
    font: '500 17px Inter, "Segoe UI", Roboto, Arial, sans-serif',
    lineHeight: 27,
    topPadding: 52,
    bottomPadding: 16,
    sidePadding: 18,
};

const pageCards = Array.from(document.querySelectorAll('.card'));
const pageChrome = [document.querySelector('.topbar'), document.querySelector('.cat-tip')].filter(Boolean);

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function lerp(start, end, amount) {
    return start + (end - start) * amount;
}

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

function resizeWeaveCanvas() {
    if (!weaveCanvas || !weaveCtx || !weaveCard) {
        return;
    }

    const rect = weaveCanvas.getBoundingClientRect();
    const width = Math.max(1, Math.floor(weaveCard.clientWidth));
    const height = Math.max(1, Math.floor(rect.height || 214));
    const ratio = Math.min(window.devicePixelRatio || 1, 2);

    if (width === weaveState.width && height === weaveState.height && ratio === weaveState.ratio) {
        return;
    }

    weaveState.width = width;
    weaveState.height = height;
    weaveState.ratio = ratio;

    weaveCanvas.width = Math.floor(width * ratio);
    weaveCanvas.height = Math.floor(height * ratio);
    weaveCanvas.style.width = `${width}px`;
    weaveCanvas.style.height = `${height}px`;

    weaveCtx.setTransform(ratio, 0, 0, ratio, 0, 0);
}

resizeWeaveCanvas();

function drawWeavePanel() {
    if (!weaveCanvas || !weaveCtx || !weaveCard) {
        return;
    }

    resizeWeaveCanvas();

    const width = weaveState.width;
    const height = weaveState.height;
    if (!width || !height) {
        return;
    }

    const ratio = weaveState.ratio;
    const panelRect = weaveCanvas.getBoundingClientRect();
    const catLeft = cat.x - cat.width * 0.5 - panelRect.left;
    const catTop = cat.y - cat.height * 0.5 - panelRect.top;
    const catBox = {
        left: catLeft,
        right: catLeft + cat.width,
        top: catTop,
        bottom: catTop + cat.height,
    };

    weaveCtx.save();
    weaveCtx.setTransform(ratio, 0, 0, ratio, 0, 0);
    weaveCtx.clearRect(0, 0, width, height);

    const background = weaveCtx.createLinearGradient(0, 0, width, height);
    background.addColorStop(0, 'rgba(21, 30, 61, 0.92)');
    background.addColorStop(1, 'rgba(11, 16, 37, 0.98)');
    weaveCtx.fillStyle = background;
    weaveCtx.fillRect(0, 0, width, height);

    weaveCtx.strokeStyle = 'rgba(141, 159, 255, 0.18)';
    weaveCtx.lineWidth = 1;
    weaveCtx.strokeRect(0.5, 0.5, width - 1, height - 1);

    weaveCtx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    weaveCtx.fillRect(0, 0, width, 40);

    weaveCtx.font = weaveState.font;
    weaveCtx.textBaseline = 'top';
    weaveCtx.fillStyle = 'rgba(240, 244, 255, 0.96)';
    weaveCtx.shadowColor = 'rgba(17, 24, 50, 0.35)';
    weaveCtx.shadowBlur = 0;

    const words = weaveCopy.split(/\s+/);
    const leftEdge = weaveState.sidePadding;
    const rightEdge = width - weaveState.sidePadding;
    const gap = 16;
    let wordIndex = 0;
    let y = weaveState.topPadding;

    while (wordIndex < words.length && y < height - weaveState.bottomPadding) {
        const lineTop = y;
        const lineBottom = y + weaveState.lineHeight;
        const overlapsCat = lineBottom > catBox.top - 4 && lineTop < catBox.bottom + 4;

        const segments = overlapsCat
            ? [
                {
                    x: leftEdge,
                    w: Math.max(0, catBox.left - gap - leftEdge),
                },
                {
                    x: Math.min(rightEdge, catBox.right + gap),
                    w: Math.max(0, rightEdge - Math.min(rightEdge, catBox.right + gap)),
                },
            ].filter((segment) => segment.w > 36)
            : [{ x: leftEdge, w: rightEdge - leftEdge }];

        if (!segments.length) {
            segments.push({ x: leftEdge, w: rightEdge - leftEdge });
        }

        for (const segment of segments) {
            if (wordIndex >= words.length) {
                break;
            }

            const segmentWords = [];

            while (wordIndex < words.length) {
                const candidate = segmentWords.length ? `${segmentWords.join(' ')} ${words[wordIndex]}` : words[wordIndex];
                const candidateWidth = weaveCtx.measureText(candidate).width;

                if (candidateWidth <= segment.w || segmentWords.length === 0) {
                    segmentWords.push(words[wordIndex]);
                    wordIndex += 1;

                    if (candidateWidth > segment.w && segmentWords.length === 1) {
                        break;
                    }
                } else {
                    break;
                }
            }

            if (!segmentWords.length) {
                continue;
            }

            const lineText = segmentWords.join(' ');
            weaveCtx.save();
            weaveCtx.beginPath();
            weaveCtx.rect(segment.x, y, segment.w, weaveState.lineHeight);
            weaveCtx.clip();
            weaveCtx.fillText(lineText, segment.x, y);
            weaveCtx.restore();
        }

        y += weaveState.lineHeight;
    }

    weaveCtx.shadowBlur = 0;
    weaveCtx.fillStyle = 'rgba(135, 154, 255, 0.12)';
    weaveCtx.fillRect(0, height - 26, width, 26);
    weaveCtx.fillStyle = 'rgba(227, 234, 255, 0.85)';
    weaveCtx.font = '600 12px Inter, "Segoe UI", sans-serif';
    weaveCtx.fillText('Drag the cat through the paragraph to watch the gap move with it.', weaveState.sidePadding, height - 20);
    weaveCtx.restore();
}

resizeCanvas();
window.addEventListener('resize', resizeCanvas);
window.addEventListener('resize', resizeWeaveCanvas);

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
    activity: 0,
};

function updatePointer(x, y) {
    pointer.vx = x - pointer.x;
    pointer.vy = y - pointer.y;
    pointer.x = x;
    pointer.y = y;
    pointer.activity = 90;
}

const interactiveSelector = 'a, button, input, textarea, select, summary, label';

function shouldIgnorePointerStart(target) {
    return target instanceof Element && Boolean(target.closest(interactiveSelector));
}

window.addEventListener('mousedown', (event) => {
    if (shouldIgnorePointerStart(event.target)) {
        return;
    }
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

window.addEventListener('touchstart', (event) => {
    if (!event.touches[0] || shouldIgnorePointerStart(event.target)) {
        return;
    }
    pointer.isDown = true;
    pointer.justPressed = true;
    updatePointer(event.touches[0].clientX, event.touches[0].clientY);
}, { passive: true });

window.addEventListener('touchmove', (event) => {
    if (!event.touches[0]) {
        return;
    }
    if (pointer.isDown) {
        event.preventDefault();
    }
    updatePointer(event.touches[0].clientX, event.touches[0].clientY);
}, { passive: false });

window.addEventListener('touchend', () => {
    pointer.isDown = false;
});

function getPageTargets() {
    const targets = [];

    for (const card of pageCards) {
        const rect = card.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0) {
            continue;
        }

        targets.push({
            x: rect.left + rect.width * 0.5,
            y: rect.top + rect.height * 0.5,
            width: rect.width,
            height: rect.height,
            element: card,
        });
    }

    return targets;
}

function chooseCatTarget(currentCat) {
    if (pointer.activity > 6) {
        return {
            x: pointer.x,
            y: pointer.y,
            kind: 'pointer',
        };
    }

    const targets = getPageTargets();
    if (!targets.length) {
        return {
            x: viewWidth * 0.5,
            y: viewHeight * 0.5,
            kind: 'center',
        };
    }

    let bestTarget = targets[0];
    let bestScore = Number.POSITIVE_INFINITY;

    for (const target of targets) {
        const dx = target.x - currentCat.x;
        const dy = target.y - currentCat.y;
        const dist = Math.hypot(dx, dy);
        const jitter = Math.random() * 70;
        const score = dist - Math.min(target.width, target.height) * 0.18 + jitter;

        if (score < bestScore) {
            bestScore = score;
            bestTarget = target;
        }
    }

    return {
        x: bestTarget.x,
        y: bestTarget.y,
        kind: 'site',
    };
}

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
        this.width = 66;
        this.height = 52;
        this.x = viewWidth * 0.5;
        this.y = viewHeight * 0.25;
        this.vx = (Math.random() - 0.5) * 2.4;
        this.vy = 0;

        this.state = 'falling';
        this.stateTimer = 0;
        this.walkTarget = this.x;
        this.walkTargetY = this.y;
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
        this.gazeX = 0;
        this.gazeY = 0;
        this.earFlick = 0;
        this.stepWave = 0;
        this.moodPulse = 0;
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
        this.walkTargetY = this.y;
        this.vx *= 0.2;
        setStatus('curious and ready to play');
    }

    startWalk() {
        this.state = 'walking';
        this.stateTimer = Math.random() * 200 + 130;
        const target = chooseCatTarget(this);
        this.walkTarget = target.x;
        this.walkTargetY = target.y;
        setStatus(target.kind === 'pointer' ? 'following your curiosity' : 'exploring the screen');
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
            if (pointer.activity > 8) {
                this.state = 'walking';
                this.stateTimer = 120;
                const target = chooseCatTarget(this);
                this.walkTarget = target.x;
                this.walkTargetY = target.y;
                setStatus('following your cursor');
                return;
            }
            if (this.stateTimer <= 0) {
                this.startWalk();
            }
            return;
        }

        if (this.state === 'walking') {
            this.stateTimer -= delta;
            const target = chooseCatTarget(this);
            if (target.kind === 'pointer') {
                this.walkTarget = target.x;
                this.walkTargetY = target.y;
            }

            const direction = Math.sign(this.walkTarget - this.x) || 1;
            const verticalPull = clamp((this.walkTargetY - this.y) * 0.018, -0.6, 0.6);
            this.vx += (direction * 1.5 - this.vx) * 0.08 * delta;
            this.vy += verticalPull * 0.08 * delta;

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
        this.stepWave += (Math.abs(this.vx) > 0.2 ? Math.abs(this.vx) : 0.15) * 0.06 * delta;
        this.petGlow = Math.max(0, this.petGlow - 0.024 * delta);
        this.moodPulse = Math.max(0, this.moodPulse - 0.015 * delta);

        const gazeTargetX = clamp((pointer.activity > 6 ? pointer.x : this.walkTarget) - this.x, -160, 160);
        const gazeTargetY = clamp((pointer.activity > 6 ? pointer.y : this.walkTargetY) - this.y, -120, 120);
        this.gazeX = lerp(this.gazeX, gazeTargetX * 0.06, 0.12 * delta);
        this.gazeY = lerp(this.gazeY, gazeTargetY * 0.06, 0.12 * delta);
        this.earFlick = lerp(this.earFlick, Math.sin(this.tailWave * 1.4) * 0.8, 0.12 * delta);

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
        const lookX = clamp(this.gazeX, -4.5, 4.5);
        const lookY = clamp(this.gazeY, -3.2, 3.2);
        const bodyTilt = clamp(this.vx * 0.02, -0.22, 0.22);
        const bodySquash = this.state === 'walking' || this.state === 'chasing' ? 1 + Math.sin(this.stepWave * 2) * 0.03 : 1;
        const earWiggle = this.state === 'sleeping' ? 0.2 : this.earFlick * 0.7;
        const palette = {
            outline: '#1a2f61',
            bodyTop: '#d3e5ff',
            bodyBottom: '#7ea4ff',
            bodyShadow: '#5f84f0',
            belly: '#eef6ff',
            accent: '#ff96c9',
            eye: '#f8fbff',
            pupil: '#23498f',
            nose: '#ff8dc1',
        };

        ctx.save();
        ctx.globalAlpha = 0.28;
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.ellipse(this.x, this.floorY() + this.height * 0.48, this.width * 0.44, floorShadow * 0.43, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        ctx.save();
        ctx.globalAlpha = 0.17;
        ctx.fillStyle = '#9fc2ff';
        ctx.beginPath();
        ctx.ellipse(this.x, this.y - 8 + bob, 38, 25, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        ctx.save();
        ctx.translate(this.x, this.y + bob);
        ctx.scale(this.facing, 1);

        const bodyWidth = this.state === 'sleeping' ? 40 : 44;
        const bodyHeight = this.state === 'sleeping' ? 22 : 28;
        const headRadius = this.state === 'sleeping' ? 14 : 16;
        const legHeight = this.state === 'sleeping' ? 5 : 9;
        const step = Math.sin(this.tailWave) * (this.state === 'sleeping' ? 0.2 : 1.6);
        const pupilShiftX = lookX * 0.12;
        const pupilShiftY = lookY * 0.12;
        const chestGlow = this.petGlow * 0.32;

        ctx.rotate(bodyTilt);

        const tailGrad = ctx.createLinearGradient(-36, -2, -70, 24);
        tailGrad.addColorStop(0, palette.bodyBottom);
        tailGrad.addColorStop(1, palette.bodyShadow);

        ctx.save();
        ctx.strokeStyle = tailGrad;
        ctx.lineWidth = this.state === 'sleeping' ? 4.5 : 5.6;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-bodyWidth / 2 + 1, 2);
        ctx.quadraticCurveTo(-bodyWidth / 2 - 14, -8 + Math.sin(this.tailWave) * 3.4, -bodyWidth / 2 - 12, 16);
        ctx.quadraticCurveTo(-bodyWidth / 2 - 7, 27 + Math.sin(this.tailWave * 1.2) * 3.2, -bodyWidth / 2 + 5, 18);
        ctx.stroke();
        ctx.fillStyle = palette.accent;
        ctx.beginPath();
        ctx.arc(-bodyWidth / 2 - 12, 16, this.state === 'sleeping' ? 3 : 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        if (this.petGlow > 0.02) {
            ctx.save();
            ctx.globalAlpha = this.petGlow * 0.3;
            ctx.fillStyle = '#ff9ed8';
            ctx.beginPath();
            ctx.ellipse(0, -10, 36, 24, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        ctx.fillStyle = palette.bodyShadow;
        ctx.beginPath();
        ctx.ellipse(0, 6, bodyWidth * 0.46, bodyHeight * 0.48 * bodySquash, 0, 0, Math.PI * 2);
        ctx.fill();

        const bodyGrad = ctx.createLinearGradient(0, -bodyHeight * 0.55, 0, bodyHeight * 0.55);
        bodyGrad.addColorStop(0, palette.bodyTop);
        bodyGrad.addColorStop(0.6, '#a8c0ff');
        bodyGrad.addColorStop(1, palette.bodyBottom);
        ctx.fillStyle = bodyGrad;
        ctx.beginPath();
        ctx.ellipse(0, 0, bodyWidth * 0.47, bodyHeight * 0.48 * bodySquash, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.save();
        ctx.globalAlpha = 0.18 + chestGlow;
        ctx.fillStyle = palette.belly;
        ctx.beginPath();
        ctx.ellipse(3, 7, bodyWidth * 0.18, bodyHeight * 0.22, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        ctx.fillStyle = palette.bodyShadow;
        ctx.beginPath();
        ctx.ellipse(-11, 18 + step, 5.2, legHeight + 1.2, 0, 0, Math.PI * 2);
        ctx.ellipse(10, 18 - step, 5.2, legHeight + 1.2, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = palette.belly;
        ctx.beginPath();
        ctx.ellipse(-11, 19 + step * 0.4, 4.2, legHeight * 0.72, 0, 0, Math.PI * 2);
        ctx.ellipse(10, 19 - step * 0.4, 4.2, legHeight * 0.72, 0, 0, Math.PI * 2);
        ctx.fill();

        const headY = -bodyHeight * 0.62 + (this.state === 'sleeping' ? 2.2 : 0);
        const headGrad = ctx.createLinearGradient(-14, headY - headRadius, 10, headY + headRadius);
        headGrad.addColorStop(0, '#f5faff');
        headGrad.addColorStop(0.45, '#d7e7ff');
        headGrad.addColorStop(1, '#8fb2ff');
        ctx.fillStyle = headGrad;
        ctx.beginPath();
        ctx.arc(0, headY, headRadius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = palette.outline;
        ctx.lineWidth = 2.1;
        ctx.stroke();

        ctx.fillStyle = '#edf4ff';
        ctx.beginPath();
        ctx.moveTo(-11, headY - headRadius + 3.5);
        ctx.lineTo(-2.5, headY - headRadius - 9.2 - earWiggle);
        ctx.lineTo(2.5, headY - headRadius + 0.5);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(11, headY - headRadius + 3.5);
        ctx.lineTo(2.5, headY - headRadius - 9.2 + earWiggle);
        ctx.lineTo(-2.5, headY - headRadius + 0.5);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#ffc7e0';
        ctx.beginPath();
        ctx.moveTo(-7.4, headY - headRadius + 5.2);
        ctx.lineTo(-2.2, headY - headRadius - 5.2);
        ctx.lineTo(0, headY - headRadius + 1.2);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(7.4, headY - headRadius + 5.2);
        ctx.lineTo(2.2, headY - headRadius - 5.2);
        ctx.lineTo(0, headY - headRadius + 1.2);
        ctx.closePath();
        ctx.fill();

        const eyeY = headY - 3.2 + lookY * 0.12;
        const eyelid = this.state === 'sleeping' ? 2.9 : Math.min(this.blinkProgress * 5.2, 5.2);

        if (this.state === 'sleeping') {
            ctx.strokeStyle = palette.outline;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(-7.2, eyeY + 1.2);
            ctx.quadraticCurveTo(-4.2, eyeY - 1.2, -1.8, eyeY + 1.2);
            ctx.moveTo(1.8, eyeY + 1.2);
            ctx.quadraticCurveTo(4.2, eyeY - 1.2, 7.2, eyeY + 1.2);
            ctx.stroke();
        } else {
            ctx.fillStyle = palette.eye;
            ctx.beginPath();
            ctx.ellipse(-5.4, eyeY, 3.7, Math.max(1.1, 3.4 - eyelid), 0, 0, Math.PI * 2);
            ctx.ellipse(5.4, eyeY, 3.7, Math.max(1.1, 3.4 - eyelid), 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = palette.pupil;
            ctx.beginPath();
            ctx.ellipse(-5.4 + pupilShiftX, eyeY + 0.4 + pupilShiftY, 1.2, 1.75, 0, 0, Math.PI * 2);
            ctx.ellipse(5.4 + pupilShiftX, eyeY + 0.4 + pupilShiftY, 1.2, 1.75, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.fillStyle = palette.nose;
        ctx.beginPath();
        ctx.moveTo(-1.8, headY + 3.1);
        ctx.lineTo(1.8, headY + 3.1);
        ctx.lineTo(0, headY + 5.2);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = palette.outline;
        ctx.lineWidth = 1.35;
        ctx.beginPath();
        ctx.moveTo(0, headY + 5.2);
        ctx.quadraticCurveTo(-1.8, headY + 8.5, -4.1, headY + 7.2);
        ctx.moveTo(0, headY + 5.2);
        ctx.quadraticCurveTo(1.8, headY + 8.5, 4.1, headY + 7.2);
        ctx.stroke();

        ctx.lineWidth = 1.1;
        ctx.beginPath();
        ctx.moveTo(-10.5, headY + 1.3);
        ctx.lineTo(-19.5, headY - 0.2);
        ctx.moveTo(-10.5, headY + 4.2);
        ctx.lineTo(-19.2, headY + 5.6);
        ctx.moveTo(10.5, headY + 1.3);
        ctx.lineTo(19.5, headY - 0.2);
        ctx.moveTo(10.5, headY + 4.2);
        ctx.lineTo(19.2, headY + 5.6);
        ctx.stroke();

        if (this.state === 'sleeping') {
            ctx.fillStyle = 'rgba(210, 225, 255, 0.85)';
            ctx.font = '12px Inter, Segoe UI, sans-serif';
            ctx.fillText('z', 22, -30 + Math.sin(this.sleepWave * 1.2) * 2.6);
            ctx.fillText('z', 28, -40 + Math.sin(this.sleepWave * 1.4) * 1.8);
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
    '🐾 Drag the cat through the paragraph and the text will make room.',
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

function updatePageMotion() {
    const cards = pageCards.length ? pageCards : [];

    for (const card of cards) {
        const rect = card.getBoundingClientRect();
        const centerX = rect.left + rect.width * 0.5;
        const centerY = rect.top + rect.height * 0.5;
        const dx = cat.x - centerX;
        const dy = cat.y - centerY;
        const distance = Math.max(1, Math.hypot(dx, dy));
        const influence = clamp(1 - distance / 560, 0, 1);
        const lift = 1 + influence * 0.02;
        const tiltX = clamp(dy / 180, -4, 4) * influence;
        const tiltY = clamp(-dx / 210, -4, 4) * influence;

        card.style.transform = `translate3d(${tiltY}px, ${-influence * 5}px, 0) scale(${lift})`;
        card.style.borderColor = `rgba(165, 180, 255, ${0.28 + influence * 0.2})`;
        card.style.boxShadow = `0 ${20 + influence * 18}px ${60 + influence * 24}px rgba(0, 0, 0, ${0.42 + influence * 0.08})`;
        card.style.filter = `saturate(${1 + influence * 0.08}) brightness(${1 + influence * 0.05})`;
        card.style.setProperty('--cat-tilt-x', `${tiltX.toFixed(2)}deg`);
    }

    for (const chrome of pageChrome) {
        const rect = chrome.getBoundingClientRect();
        const centerY = rect.top + rect.height * 0.5;
        const lift = clamp(1 - Math.abs(cat.y - centerY) / 680, 0, 1);
        chrome.style.transform = `translate3d(0, ${-lift * 4}px, 0)`;
        chrome.style.filter = `drop-shadow(0 ${8 + lift * 10}px ${18 + lift * 12}px rgba(0, 0, 0, ${0.16 + lift * 0.1}))`;
    }
}

let lastTime = performance.now();

function animate(now) {
    const delta = Math.min((now - lastTime) / 16.6667, 2);
    lastTime = now;
    pointer.activity = Math.max(0, pointer.activity - delta * 1.5);

    ctx.clearRect(0, 0, viewWidth, viewHeight);

    toy.update(delta);
    cat.update(delta, toy, particles);

    updatePageMotion();
    drawWeavePanel();

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