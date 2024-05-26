const upload = document.getElementById('upload');
const canvas = document.getElementById('canvas');
const canvasColor = document.getElementById('canvas-color');
const ctx = canvas.getContext('2d');
const ctxColor = canvasColor.getContext('2d');
const confirmPolygonButton = document.getElementById('confirm-polygon');
const clearSelectionButton = document.getElementById('clear-selection');
const originalColorInput = document.getElementById('original-color');
const newColorInput = document.getElementById('new-color');
const colorToleranceInput = document.getElementById('color-tolerance');
const toleranceValue = document.getElementById('tolerance-value');
const applyColorButton = document.getElementById('apply-color');
const backToPolygonButton = document.getElementById('back-to-polygon');
const exportImageButton = document.getElementById('export-image');
const polygonSection = document.getElementById('polygon-section');
const colorSection = document.getElementById('color-section');

let img = new Image();
let imgFileName = "";
let polygonPoints = [];
let isDrawing = false;
let selectedPointIndex = -1;

colorToleranceInput.addEventListener('input', (e) => {
    toleranceValue.textContent = e.target.value;
});

upload.addEventListener('change', (e) => {
    const file = e.target.files[0];
    imgFileName = file.name.split('.').slice(0, -1).join('.');
    const reader = new FileReader();
    reader.onload = (event) => {
        img.src = event.target.result;
        img.onload = () => {
            updateCanvasSize();
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            selectDominantColor(); // Wählen Sie die dominierende Farbe aus
            document.getElementById('upload-section').style.display = 'none';
            polygonSection.style.display = 'block';
        };
    };
    reader.readAsDataURL(file);
});

canvas.addEventListener('mousedown', (e) => {
    if (polygonSection.style.display === 'block') {
        const { offsetX, offsetY } = e;
        const pointIndex = getPointAtPosition(offsetX, offsetY);

        if (pointIndex >= 0) {
            selectedPointIndex = pointIndex;
        } else {
            isDrawing = true;
            polygonPoints.push({ x: offsetX, y: offsetY });
        }
        drawPolygon();
    }
});

canvas.addEventListener('mousemove', (e) => {
    if (isDrawing) {
        drawPolygon({ x: e.offsetX, y: e.offsetY });
    } else if (selectedPointIndex >= 0) {
        polygonPoints[selectedPointIndex] = { x: e.offsetX, y: e.offsetY };
        drawPolygon();
    }
});

canvas.addEventListener('mouseup', () => {
    isDrawing = false;
    selectedPointIndex = -1;
});

canvas.addEventListener('dblclick', (e) => {
    const { offsetX, offsetY } = e;
    const pointIndex = getPointAtPosition(offsetX, offsetY);

    if (pointIndex >= 0) {
        polygonPoints.splice(pointIndex, 1);
        drawPolygon();
    }
});

confirmPolygonButton.addEventListener('click', () => {
    colorSection.style.display = 'block';
    polygonSection.style.display = 'none';
    updateCanvasSize(canvasColor); // Aktualisieren Sie die Größe des Farb-Canvas
    drawImage(ctxColor, false);  // Zeichne das Bild ohne das Polygon
});

clearSelectionButton.addEventListener('click', () => {
    polygonPoints = [];
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
});

backToPolygonButton.addEventListener('click', () => {
    colorSection.style.display = 'none';
    polygonSection.style.display = 'block';
    drawImage(ctx, true);  // Zeichne das Bild mit dem Polygon
});

applyColorButton.addEventListener('click', () => {
    applyColorChange();
});

exportImageButton.addEventListener('click', () => {
    exportImage();
});

originalColorInput.addEventListener('input', applyColorChange);
newColorInput.addEventListener('input', applyColorChange);

function hexToRgb(hex) {
    const bigint = parseInt(hex.slice(1), 16);
    return {
        r: (bigint >> 16) & 255,
        g: (bigint >> 8) & 255,
        b: bigint & 255
    };
}

function rgbToHex(r, g, b) {
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()}`;
}

function rgbToHsl(r, g, b) {
    r /= 255, g /= 255, b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
        h = s = 0; // achromatic
    } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch(max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    return [ h * 360, s * 100, l * 100 ];
}

function isColorInRange(color1, color2, tolerance) {
    return Math.abs(color1.r - color2.r) <= tolerance &&
           Math.abs(color1.g - color2.g) <= tolerance &&
           Math.abs(color1.b - color2.b) <= tolerance;
}

function isPointInPolygon(point, polygon) {
    let isInside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const xi = polygon[i].x, yi = polygon[i].y;
        const xj = polygon[j].x, yj = polygon[j].y;
        const intersect = ((yi > point.y) !== (yj > point.y))
            && (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi);
        if (intersect) isInside = !isInside;
    }
    return isInside;
}

function getPointAtPosition(x, y) {
    const radius = 10; // Radius der Punkte
    for (let i = 0; i < polygonPoints.length; i++) {
        const point = polygonPoints[i];
        if (Math.abs(point.x - x) < radius && Math.abs(point.y - y) < radius) {
            return i;
        }
    }
    return -1;
}

function drawPolygon(lastPoint) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    ctx.beginPath();
    ctx.moveTo(polygonPoints[0]?.x ?? 0, polygonPoints[0]?.y ?? 0);

    for (let i = 1; i < polygonPoints.length; i++) {
        ctx.lineTo(polygonPoints[i].x, polygonPoints[i].y);
    }

    if (lastPoint) {
        ctx.lineTo(lastPoint.x, lastPoint.y);
    }

    ctx.closePath();
    ctx.stroke();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fill();

    for (const point of polygonPoints) {
        ctx.fillStyle = 'red';
        ctx.beginPath();
        ctx.arc(point.x, point.y, 10, 0, Math.PI * 2); // Größere Punkte anzeigen
        ctx.fill();
    }
}

function drawImage(context, showPolygon) {
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(img, 0, 0, canvas.width, canvas.height);

    if (showPolygon && polygonPoints.length > 0) {
        context.beginPath();
        context.moveTo(polygonPoints[0]?.x ?? 0, polygonPoints[0]?.y ?? 0);

        for (let i = 1; i < polygonPoints.length; i++) {
            context.lineTo(polygonPoints[i].x, polygonPoints[i].y);
        }

        context.closePath();
        context.stroke();
        context.fillStyle = 'rgba(0, 0, 0, 0.3)';
        context.fill();

        for (const point of polygonPoints) {
            context.fillStyle = 'red';
            context.beginPath();
            context.arc(point.x, point.y, 10, 0, Math.PI * 2); // Größere Punkte anzeigen
            ctx.fill();
        }
    }
}

function updateCanvasSize(canvasElement = canvas) {
    const aspectRatio = img.width / img.height;
    const maxWidth = 800;
    const newWidth = Math.min(maxWidth, window.innerWidth - 40);
    const newHeight = newWidth / aspectRatio;

    canvasElement.width = newWidth;
    canvasElement.height = newHeight;
    canvasElement.style.width = `${newWidth}px`;
    canvasElement.style.height = `${newHeight}px`;

    if (canvasElement === canvas) {
        ctx.drawImage(img, 0, 0, newWidth, newHeight);
    } else {
        ctxColor.drawImage(img, 0, 0, newWidth, newHeight);
    }
}

function applyColorChange() {
    if (!img.complete) return;

    const originalColor = hexToRgb(originalColorInput.value);
    const newColor = hexToRgb(newColorInput.value);
    const colorTolerance = parseInt(colorToleranceInput.value, 10);

    drawImage(ctxColor, false);  // Zeichne das Bild ohne das Polygon

    const imageData = ctxColor.getImageData(0, 0, canvasColor.width, canvasColor.height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
        const pixelColor = { r: data[i], g: data[i + 1], b: data[i + 2] };

        if (!isPointInPolygon({ x: (i / 4) % canvasColor.width, y: Math.floor(i / 4 / canvasColor.height) }, polygonPoints)) {
            if (isColorInRange(pixelColor, originalColor, colorTolerance)) {
                data[i] = newColor.r;
                data[i + 1] = newColor.g;
                data[i + 2] = newColor.b;
            }
        }
    }

    ctxColor.putImageData(imageData, 0, 0);
}

function selectDominantColor() {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const colorCount = {};

    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // Farben in HSL umrechnen
        const [h, s, l] = rgbToHsl(r, g, b);

        // Grau, Weiß und Schwarz ausschließen
        if (s < 20 || l > 90 || l < 10) {
            continue;
        }

        const color = `${r},${g},${b}`;

        if (!colorCount[color]) {
            colorCount[color] = 0;
        }

        colorCount[color]++;
    }

    let dominantColor = null;
    let maxCount = 0;

    for (const color in colorCount) {
        if (colorCount[color] > maxCount) {
            maxCount = colorCount[color];
            dominantColor = color;
        }
    }

    if (dominantColor) {
        const [r, g, b] = dominantColor.split(',').map(Number);
        originalColorInput.value = rgbToHex(r, g, b);
    }
}

function exportImage() {
    const newColorHex = newColorInput.value;
    const link = document.createElement('a');
    link.download = `${imgFileName}_${newColorHex}.jpg`;
    link.href = canvasColor.toDataURL('image/jpeg', 1.0);
    link.click();
}
