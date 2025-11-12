console.log("Phase 2: Bringing the cat to life!");

const canvas = document.getElementById('cat-canvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// --- Asset Loading ---
const catImage = new Image();
catImage.src = 'assets/cat-sprite.png'; // We'll use the image you provided
let isImageLoaded = false;
catImage.onload = () => {
    isImageLoaded = true;
};
catImage.onerror = () => {
    console.error("Failed to load cat sprite. Using a placeholder.");
};


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
    if (cat.isBeingDragged) {
        cat.isBeingDragged = false;
    }
});
canvas.addEventListener('mousemove', (e) => {
    if (mouse.isDown) {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
    }
});
canvas.addEventListener('mouseleave', () => {
    mouse.isDown = false;
    if (cat.isBeingDragged) {
        cat.isBeingDragged = false;
    }
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
    if (cat.isBeingDragged) {
        cat.isBeingDragged = false;
    }
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
    constructor(image) {
        this.image = image;
        this.width = 80; // Approximate width from image
        this.height = 60; // Approximate height
        this.x = canvas.width / 2;
        this.y = canvas.height / 2;
        this.vx = (Math.random() - 0.5) * 4;
        this.vy = (Math.random() - 0.5) * 4;
        
        this.isBeingDragged = false;
        this.state = 'falling'; // Initial state
        this.stateTimer = 0;
    }

    draw() {
// ...existing code...
        ctx.restore();
    }
    
    drawPlaceholder() {
// ...existing code...
        ctx.fillRect(this.x - 10, this.y, 20, 20);
    }

    update() {
        this.checkDrag();

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

        // Common physics for all states (except dragged)
        if (!this.isBeingDragged) {
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
            this.vx *= friction;
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
            if (distance < Math.max(this.width, this.height) / 2) {
                this.isBeingDragged = true;
                this.state = 'dragged';
                this.vx = 0;
                this.vy = 0;
            }
        }

        // If being dragged, update position
        if (this.isBeingDragged) {
            this.x = mouse.x;
            this.y = mouse.y;
        }

        // If mouse is released, stop dragging
        if (!mouse.isDown && this.isBeingDragged) {
            this.isBeingDragged = false;
            this.state = 'falling';
            // Give it a little toss based on mouse movement
            this.vx = (mouse.x - this.x) * 0.1; 
            this.vy = (mouse.y - this.y) * 0.1;
        }
    }
}

const cat = new Cat(catImage);


function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    cat.update();

    if (isImageLoaded) {
        cat.draw();
    } else {
        cat.drawPlaceholder();
    }

    requestAnimationFrame(animate);
}

animate();