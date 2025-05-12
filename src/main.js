// Global variables
let model;
let video;
let canvas;
let ctx;
let isModelLoaded = false;
let stream = null; // Store camera stream for stopping
let detectionActive = false; // Track detection state
let animationFrameId = null; // For canceling detection loop

// DOM Elements
const countElement = document.getElementById('count');
const errorMessage = document.getElementById('error-message');
const cameraToggleBtn = document.getElementById('camera-toggle');
const cameraEnableBtn = document.getElementById('camera-enable');
const cameraDisableBtn = document.getElementById('camera-disable');

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
            startDetection();
            updateCameraButtons();
        }, { once: true });

        // Camera enable/disable button events
        cameraEnableBtn.addEventListener('click', async () => {
            await startCamera();
            video.addEventListener('loadedmetadata', () => {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                startDetection();
                updateCameraButtons();
            }, { once: true });
        });
        cameraDisableBtn.addEventListener('click', () => {
            stopDetection();
            stopCamera();
            updateCameraButtons();
        });

        // Set initial button state
        updateCameraButtons();
    } catch (error) {
        showError('Failed to initialize: ' + error.message);
    }
}

// Start camera
async function startCamera() {
    try {
        stream = await navigator.mediaDevices.getUserMedia({
            video: {
                width: 640,
                height: 480,
                facingMode: 'environment'
            }
        });
        video.srcObject = stream;
        // Show video and canvas
        video.style.display = '';
        canvas.style.display = '';
    } catch (error) {
        showError('Camera access denied: ' + error.message);
    }
}

// Stop camera
function stopCamera() {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        stream = null;
        video.srcObject = null;
    }
    // Hide video and canvas
    video.style.display = 'none';
    canvas.style.display = 'none';
}

// Start detection loop
function startDetection() {
    detectionActive = true;
    detectFrame();
}

// Stop detection loop
function stopDetection() {
    detectionActive = false;
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
    // Clear canvas and count
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    countElement.textContent = 0;
}

// Main detection loop
async function detectFrame() {
    if (!isModelLoaded || !detectionActive) return;

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
        animationFrameId = requestAnimationFrame(detectFrame);
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

// Toggle camera and detection
async function toggleCamera() {
    if (stream) {
        // Disable camera
        stopDetection();
        stopCamera();
        cameraToggleBtn.textContent = 'Enable Camera';
    } else {
        // Enable camera
        await startCamera();
        video.addEventListener('loadedmetadata', () => {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            startDetection();
        }, { once: true });
        cameraToggleBtn.textContent = 'Disable Camera';
    }
}

function updateCameraButtons() {
    if (stream) {
        cameraEnableBtn.style.display = 'none';
        cameraDisableBtn.style.display = '';
    } else {
        cameraEnableBtn.style.display = '';
        cameraDisableBtn.style.display = 'none';
    }
}

// Start the application when the page loads
window.addEventListener('load', init); 