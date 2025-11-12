console.log("The interactive cat is coming soon!");

const canvas = document.getElementById('cat-canvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

// Placeholder for future cat logic
function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // We will draw the cat here
    requestAnimationFrame(animate);
}

// animate(); // We'll enable this when we have something to draw
