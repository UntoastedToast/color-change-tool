document.addEventListener('DOMContentLoaded', function () {
  const uploadBtn = document.getElementById('upload-btn');
  const imageUploadInput = document.getElementById('image-upload');
  const deselectionBtn = document.getElementById('deselection-btn');
  const coloringBtn = document.getElementById('coloring-btn');
  const saveBtn = document.getElementById('save-btn');
  const imageCanvas = document.getElementById('image-canvas');
  const uploadField = document.getElementById('upload-field');
  const browseBtn = document.getElementById('browse-btn');
  const ctx = imageCanvas.getContext('2d');
  const applySelectionBtn = document.getElementById('apply-selection');
  const applyColorBtn = document.getElementById('apply-color');
  const sourceColorInput = document.getElementById('source-color');
  const targetColorInput = document.getElementById('target-color');
  const clearSelectionBtn = document.getElementById('clear-selection');
  const resetBtn = document.getElementById('reset-btn');
  
  let image = new Image();
  let points = [];
  let polygonComplete = false;
  let showPolygon = true;
  let originalFileName = '';
  let draggingPointIndex = null;

  // Ensure the upload field is visible on page load
  uploadField.classList.add('active');

  uploadBtn.addEventListener('click', function () {
    resetEditor();
    showUploadField();
  });

  resetBtn.addEventListener('click', function () {
    window.location.reload(); // Reload the page
  });

  function showUploadField() {
    uploadField.classList.add('active');
    uploadField.style.display = 'block'; // Ensure it's visible
    imageCanvas.style.display = 'none';
    document.getElementById('selection-toolbar').style.display = 'none';
    document.getElementById('coloring-toolbar').style.display = 'none';
  }

  function resetEditor() {
    image.src = '';
    ctx.clearRect(0, 0, imageCanvas.width, imageCanvas.height);
    deselectionBtn.classList.add('disabled');
    coloringBtn.classList.add('disabled');
    saveBtn.classList.add('disabled');
    points = [];
    polygonComplete = false;
    showPolygon = true;
    originalFileName = '';
  }

  browseBtn.addEventListener('click', function (event) {
    event.stopPropagation();
    imageUploadInput.click();
  });

  imageUploadInput.addEventListener('change', function (e) {
    const file = e.target.files[0];
    if (file) {
      originalFileName = file.name.split('.')[0]; // Get the original file name without extension
      const reader = new FileReader();
      reader.onload = function (event) {
        image.src = event.target.result;
        image.onload = function () {
          resizeCanvas();
          ctx.drawImage(image, 0, 0, imageCanvas.width, imageCanvas.height);
          enableEditingButtons();
          goToDeselectionStep();
          uploadField.classList.remove('active'); // Hide the upload field
          uploadField.style.display = 'none'; // Ensure it's not visible
          imageCanvas.style.display = 'block';
        };
      };
      reader.readAsDataURL(file);
    }
  });

  window.addEventListener('resize', resizeCanvas);

  function resizeCanvas() {
    const container = document.querySelector('.container');
    imageCanvas.width = container.clientWidth - 40; // padding adjustments
    imageCanvas.height = imageCanvas.width * (image.height / image.width);
    if (image.src) {
      ctx.drawImage(image, 0, 0, imageCanvas.width, imageCanvas.height);
      if (polygonComplete && showPolygon) {
        drawPolygon();
      }
    }
  }

  function enableEditingButtons() {
    deselectionBtn.classList.remove('disabled');
    coloringBtn.classList.remove('disabled');
    saveBtn.classList.remove('disabled');
  }

  function goToDeselectionStep() {
    document.getElementById('selection-toolbar').style.display = 'block';
    document.getElementById('coloring-toolbar').style.display = 'none';
    deselectionBtn.classList.add('active');
    coloringBtn.classList.remove('active');
    activatePolygonSelection();
    showPolygon = true;
  }

  function goToColoringStep() {
    document.getElementById('selection-toolbar').style.display = 'none';
    document.getElementById('coloring-toolbar').style.display = 'block';
    deselectionBtn.classList.remove('active');
    coloringBtn.classList.add('active');
    showPolygon = false;
    ctx.clearRect(0, 0, imageCanvas.width, imageCanvas.height);
    ctx.drawImage(image, 0, 0, imageCanvas.width, imageCanvas.height);
  }

  function activatePolygonSelection() {
    imageCanvas.addEventListener('click', addPoint);
    imageCanvas.addEventListener('mousedown', onMouseDown);
    imageCanvas.addEventListener('mousemove', onMouseMove);
    imageCanvas.addEventListener('mouseup', onMouseUp);
    document.addEventListener('keydown', onKeyDown);
  }

  function addPoint(e) {
    if (polygonComplete) return;
    const rect = imageCanvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    points.push({ x, y });
    drawPolygon();
  }

  function drawPolygon() {
    ctx.clearRect(0, 0, imageCanvas.width, imageCanvas.height);
    ctx.drawImage(image, 0, 0, imageCanvas.width, imageCanvas.height);
    if (points.length > 0) {
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      points.forEach(point => {
        ctx.lineTo(point.x, point.y);
      });
      if (points.length > 2) {
        ctx.lineTo(points[0].x, points[0].y);
        ctx.closePath();
        ctx.fillStyle = 'rgba(212,63,58,0.15)'; // Transparent white fill
        ctx.fill();
      }
      ctx.strokeStyle = '#d43f3a'; // Red line
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Draw points
      points.forEach(point => {
        ctx.beginPath();
        ctx.arc(point.x, point.y, 5, 0, 2 * Math.PI);
        ctx.fillStyle = '#d43f3a';
        ctx.fill();
        ctx.strokeStyle = '#d43f3a';
        ctx.stroke();
      });
    }
  }

  function onMouseDown(e) {
    const rect = imageCanvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    draggingPointIndex = points.findIndex(point => Math.hypot(point.x - x, point.y - y) < 5);
  }

  function onMouseMove(e) {
    if (draggingPointIndex !== null) {
      const rect = imageCanvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      points[draggingPointIndex] = { x, y };
      drawPolygon();
    }
  }

  function onMouseUp() {
    draggingPointIndex = null;
  }

  function onKeyDown(e) {
    if (e.key === 'Backspace' || e.key === 'Delete') {
      points.pop();
      drawPolygon();
    }
  }

  applySelectionBtn.addEventListener('click', function () {
    if (points.length > 2) {
      polygonComplete = true;
      goToColoringStep();
    }
  });

  applyColorBtn.addEventListener('click', function () {
    const sourceColor = hexToRgb(sourceColorInput.value);
    const targetColor = hexToRgb(targetColorInput.value);
    applyColorChange(sourceColor, targetColor);
  });

  function applyColorChange(sourceColor, targetColor) {
    const imageData = ctx.getImageData(0, 0, imageCanvas.width, imageCanvas.height);
    const data = imageData.data;
    const tolerance = 50;

    for (let i = 0; i < data.length; i += 4) {
      const x = (i / 4) % imageCanvas.width;
      const y = Math.floor(i / 4 / imageCanvas.width);
      if (isWithinPolygon(x, y)) continue;

      if (colorMatch(data[i], data[i + 1], data[i + 2], sourceColor, tolerance)) {
        data[i] = targetColor.r;
        data[i + 1] = targetColor.g;
        data[i + 2] = targetColor.b;
      }
    }

    ctx.putImageData(imageData, 0, 0);
  }

  function isWithinPolygon(x, y) {
    let inside = false;
    for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
      const xi = points[i].x, yi = points[i].y;
      const xj = points[j].x, yj = points[j].y;
      const intersect = ((yi > y) !== (yj > y)) &&
        (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  }

  function hexToRgb(hex) {
    const bigint = parseInt(hex.slice(1), 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = (bigint & 255);
    return { r, g, b };
  }

  function colorMatch(r, g, b, color, tolerance) {
    return Math.abs(r - color.r) <= tolerance &&
           Math.abs(g - color.g) <= tolerance &&
           Math.abs(b - color.b) <= tolerance;
  }

  saveBtn.addEventListener('click', function () {
    const link = document.createElement('a');
    const hexColor = targetColorInput.value;
    link.download = `${originalFileName}_${hexColor}.jpg`;
    link.href = imageCanvas.toDataURL('image/jpeg');
    link.click();
  });

  clearSelectionBtn.addEventListener('click', function () {
    clearPolygonSelection();
  });

  function clearPolygonSelection() {
    points = [];
    polygonComplete = false;
    ctx.clearRect(0, 0, imageCanvas.width, imageCanvas.height);
    ctx.drawImage(image, 0, 0, imageCanvas.width, imageCanvas.height);
  }
});
