// Global variables
let model;
let video;
let canvas;
let ctx;
let isModelLoaded = false;

// DOM Elements
const countElement = document.getElementById('count');
const errorMessage = document.getElementById('error-message');

// Initialize the application
async function init() {
    try {
        // Get DOM elements
        video = document.getElementById('video');
        canvas = document.getElementById('canvas');
        ctx = canvas.getContext('2d');

        // Load the COCO-SSD model
        console.log('Loading COCO-SSD model...');
        model = await cocoSsd.load();
        isModelLoaded = true;
        console.log('Model loaded successfully');

        // Start camera
        await startCamera();

        // Wait for video to be ready before starting detection
        video.addEventListener('loadedmetadata', () => {
            // Ensure canvas matches video size
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            detectFrame();
        }, { once: true });
    } catch (error) {
        showError('Failed to initialize: ' + error.message);
    }
}

// Start camera
async function startCamera() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: {
                width: 640,
                height: 480,
                facingMode: 'environment'
            }
        });
        video.srcObject = stream;
    } catch (error) {
        showError('Camera access denied: ' + error.message);
    }
}

// Main detection loop
async function detectFrame() {
    if (!isModelLoaded) return;

    try {
        // Get predictions
        const predictions = await model.detect(video);
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw video frame
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Count people and draw bounding boxes
        let personCount = 0;
        predictions.forEach(prediction => {
            if (prediction.class === 'person') {
                personCount++;
                drawBoundingBox(prediction);
            }
        });
        
        // Update count display
        countElement.textContent = personCount;
        
        // Continue detection loop
        requestAnimationFrame(detectFrame);
    } catch (error) {
        showError('Detection error: ' + error.message);
    }
}

// Draw bounding box for detected person
function drawBoundingBox(prediction) {
    const [x, y, width, height] = prediction.bbox;
    
    // Draw box
    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, width, height);
    
    // Draw label
    ctx.fillStyle = '#00ff00';
    ctx.font = '16px Arial';
    ctx.fillText(
        `Person (${Math.round(prediction.score * 100)}%)`,
        x,
        y > 20 ? y - 5 : 20
    );
}

// Show error message
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.add('show');
    console.error(message);
}

// Start the application when the page loads
window.addEventListener('load', init); 