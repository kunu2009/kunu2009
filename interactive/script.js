console.log("Phase 3.1: Drawing the cat with code!");

const canvas = document.getElementById('cat-canvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

// --- Interaction ---
const mouse = {
    x: 0,
    y: 0,
    isDown: false,
};

// Mouse events
canvas.addEventListener('mousedown', (e) => {
    mouse.isDown = true;
    mouse.x = e.clientX;
    mouse.y = e.clientY;
});
canvas.addEventListener('mouseup', () => {
    mouse.isDown = false;
});
canvas.addEventListener('mousemove', (e) => {
    if (mouse.isDown) {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
    }
});
canvas.addEventListener('mouseleave', () => {
    mouse.isDown = false;
});

// Touch events
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    mouse.isDown = true;
    mouse.x = e.touches[0].clientX;
    mouse.y = e.touches[0].clientY;
}, { passive: false });
canvas.addEventListener('touchend', (e) => {
    e.preventDefault();
    mouse.isDown = false;
}, { passive: false });
canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    if (mouse.isDown) {
        mouse.x = e.touches[0].clientX;
        mouse.y = e.touches[0].clientY;
    }
}, { passive: false });


// --- Physics & Cat Logic ---
const gravity = 0.4;
const friction = 0.9;
const walkSpeed = 1.5;

class Cat {
    constructor() {
        this.width = 50; 
        this.height = 40;
        this.x = canvas.width / 2;
        this.y = canvas.height / 2;
        this.vx = (Math.random() - 0.5) * 4;
        this.vy = (Math.random() - 0.5) * 4;
        
        this.isBeingDragged = false;
        this.state = 'falling'; // Initial state
        this.stateTimer = 0;
        this.facing = 1; // 1 for right, -1 for left
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        
        // Update facing direction based on velocity, but only if not being dragged
        if (!this.isBeingDragged && this.vx !== 0) {
            this.facing = this.vx > 0 ? 1 : -1;
        }
        ctx.scale(this.facing, 1);

        const bodyWidth = 35;
        const bodyHeight = 22;
        const headRadius = 12;
        const earHeight = 10;
        const legHeight = 8;
        const tailLength = 15;

        // Legs (draw them first so they are behind the body)
        ctx.fillStyle = '#222222'; // Darker gray for legs
        ctx.fillRect(-bodyWidth / 2 + 4, bodyHeight / 2, 6, legHeight);
        ctx.fillRect(bodyWidth / 2 - 10, bodyHeight / 2, 6, legHeight);

        // Tail
        ctx.strokeStyle = '#333333';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(-bodyWidth / 2, 0);
        ctx.quadraticCurveTo(-bodyWidth / 2 - tailLength, -10, -bodyWidth / 2 - tailLength, tailLength);
        ctx.stroke();

        // Body
        ctx.fillStyle = '#333333'; // Main body color
        ctx.fillRect(-bodyWidth / 2, -bodyHeight / 2, bodyWidth, bodyHeight);

        // Head
        ctx.beginPath();
        ctx.arc(0, -bodyHeight / 2 - headRadius / 2 + 2, headRadius, 0, Math.PI * 2);
        ctx.fill();

        // Ears
        ctx.beginPath();
        ctx.moveTo(-headRadius / 1.5, -bodyHeight / 2 - headRadius + 2);
        ctx.lineTo(-headRadius / 3, -bodyHeight / 2 - headRadius - earHeight + 2);
        ctx.lineTo(0, -bodyHeight / 2 - headRadius + 2);
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(headRadius / 1.5, -bodyHeight / 2 - headRadius + 2);
        ctx.lineTo(headRadius / 3, -bodyHeight / 2 - headRadius - earHeight + 2);
        ctx.lineTo(0, -bodyHeight / 2 - headRadius + 2);
        ctx.fill();

        // Eyes
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(-headRadius / 3, -bodyHeight / 2 - headRadius / 1.5 + 2, 2, 0, Math.PI * 2);
        ctx.arc(headRadius / 3, -bodyHeight / 2 - headRadius / 1.5 + 2, 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    update() {
        this.checkDrag();

        if (this.isBeingDragged) {
            this.x = mouse.x;
            this.y = mouse.y;
            this.vx = 0;
            this.vy = 0;
        } else {
            // State machine logic
            switch (this.state) {
                case 'falling':
                    this.updateFalling();
                    break;
                case 'idle':
                    this.updateIdle();
                    break;
                case 'walking':
                    this.updateWalking();
                    break;
            }
            // Common physics for all non-dragged states
            this.vy += gravity;
            this.x += this.vx;
            this.y += this.vy;
        }

        // Common collision detection
        this.handleCollisions();
    }

    updateFalling() {
        // State transition: land on the floor
        if (this.y + this.height / 2 >= canvas.height) {
            this.state = 'idle';
            this.stateTimer = Math.random() * 120 + 60; // Idle for 1-3 seconds
            this.vx = 0;
        }
    }

    updateIdle() {
        this.stateTimer--;
        if (this.stateTimer <= 0) {
            this.state = 'walking';
            this.vx = (Math.random() < 0.5 ? -1 : 1) * walkSpeed;
            this.stateTimer = Math.random() * 180 + 120; // Walk for 2-5 seconds
        }
    }

    updateWalking() {
        this.stateTimer--;
        if (this.stateTimer <= 0) {
            this.state = 'idle';
            this.vx = 0;
            this.stateTimer = Math.random() * 120 + 60; // Idle for 1-3 seconds
        }
    }

    handleCollisions() {
        // Floor collision
        if (this.y + this.height / 2 > canvas.height) {
            this.y = canvas.height - this.height / 2;
            this.vy = 0; // Stop vertical movement on ground
            if (this.state === 'falling') { // Only apply friction bounce on landing
                 this.vx *= friction;
            }
        }

        // Wall collision
        if (this.x + this.width / 2 > canvas.width) {
            this.x = canvas.width - this.width / 2;
            this.vx *= -1; // Turn around
        }
        if (this.x - this.width / 2 < 0) {
            this.x = this.width / 2;
            this.vx *= -1; // Turn around
        }
    }

    checkDrag() {
        // Check if mouse is pressed and over the cat
        if (mouse.isDown && !this.isBeingDragged) {
            const distance = Math.sqrt(
                (mouse.x - this.x) ** 2 + (mouse.y - this.y) ** 2
            );
            if (distance < Math.max(this.width, this.height)) { // Increased hitbox
                this.isBeingDragged = true;
                this.state = 'dragged';
            }
        }

        // If mouse is released, stop dragging
        if (!mouse.isDown && this.isBeingDragged) {
            this.isBeingDragged = false;
            this.state = 'falling';
            // Give it a little toss based on recent mouse movement
            this.vx = (this.x - (mouse.x - this.vx)) * 0.1; 
            this.vy = (this.y - (mouse.y - this.vy)) * 0.1;
        }
    }
}

const cat = new Cat();

function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    cat.update();
    cat.draw();

    requestAnimationFrame(animate);
}

animate();