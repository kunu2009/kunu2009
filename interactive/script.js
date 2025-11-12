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
    }

    draw() {
        ctx.save();
        // Flip sprite if moving left
        if (this.vx < 0) {
            ctx.scale(-1, 1);
            ctx.drawImage(this.image, -this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);
        } else {
            ctx.drawImage(this.image, this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);
        }
        ctx.restore();
    }
    
    drawPlaceholder() {
        ctx.fillStyle = '#fd9a44';
        ctx.fillRect(this.x - 20, this.y - 20, 40, 40);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(this.x - 10, this.y, 20, 20);
    }

    update() {
        this.checkDrag();

        if (this.isBeingDragged) {
            // Track mouse/touch position
            this.vx = (mouse.x - this.x) * 0.3;
            this.vy = (mouse.y - this.y) * 0.3;
            this.x = mouse.x;
            this.y = mouse.y;
        } else {
            // Apply gravity
            this.vy += gravity;
            this.x += this.vx;
            this.y += this.vy;
        }

        // Floor collision
        if (this.y + this.height / 2 > canvas.height) {
            this.y = canvas.height - this.height / 2;
            this.vy *= -0.6; // Bounce
            this.vx *= friction;
        }

        // Wall collision
        if (this.x + this.width / 2 > canvas.width) {
            this.x = canvas.width - this.width / 2;
            this.vx *= -1;
        }
        if (this.x - this.width / 2 < 0) {
            this.x = this.width / 2;
            this.vx *= -1;
        }
    }

    checkDrag() {
        if (mouse.isDown && !this.isBeingDragged) {
            const distance = Math.sqrt(
                (mouse.x - this.x) ** 2 + (mouse.y - this.y) ** 2
            );
            if (distance < Math.max(this.width, this.height) / 2) {
                this.isBeingDragged = true;
            }
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