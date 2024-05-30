document.addEventListener('DOMContentLoaded', () => {
  const elements = {
    uploadBtn: document.getElementById('upload-btn'),
    imageUploadInput: document.getElementById('image-upload'),
    deselectionBtn: document.getElementById('deselection-btn'),
    coloringBtn: document.getElementById('coloring-btn'),
    saveBtn: document.getElementById('save-btn'),
    imageCanvas: document.getElementById('image-canvas'),
    uploadField: document.getElementById('upload-field'),
    browseBtn: document.getElementById('browse-btn'),
    ctx: document.getElementById('image-canvas').getContext('2d'),
    applySelectionBtn: document.getElementById('apply-selection'),
    applyColorBtn: document.getElementById('apply-color'),
    sourceColorInput: document.getElementById('source-color'),
    targetColorInput: document.getElementById('target-color'),
    clearSelectionBtn: document.getElementById('clear-selection'),
    resetBtn: document.getElementById('reset-btn'),
    overlay: document.getElementById('overlay'),
    confirmBtn: document.getElementById('confirm-btn'),
    cancelBtn: document.getElementById('cancel-btn'),
  };

  let state = {
    image: new Image(),
    points: [],
    polygonComplete: false,
    originalFileName: '',
    originalImageData: null,
    resetAction: null,
    draggingPointIndex: null,
  };

  const toggleButtons = (disabled, ...buttons) =>
    buttons.forEach(btn => btn.classList.toggle('disabled', disabled));

  const switchToolbar = mode => {
    ['selection', 'coloring'].forEach(toolbar =>
      document.getElementById(`${toolbar}-toolbar`).style.display = mode === toolbar ? 'block' : 'none'
    );
    Object.keys(elements).forEach(key => elements[key].classList && elements[key].classList.remove('active'));
    if (elements[`${mode}Btn`]) elements[`${mode}Btn`].classList.add('active');
    if (mode === 'selection') elements.deselectionBtn.classList.add('active'); // Ensure De-Selection button is active
  };

  const resetEditor = () => {
    state.points = [];
    state.polygonComplete = false;
    state.originalFileName = '';
    state.originalImageData = null;
    elements.ctx.clearRect(0, 0, elements.imageCanvas.width, elements.imageCanvas.height);
    showUploadField();
    toggleButtons(true, elements.deselectionBtn, elements.coloringBtn, elements.saveBtn);
    switchToolbar('upload');
  };

  const showUploadField = () => {
    elements.uploadField.classList.add('active');
    elements.uploadField.style.display = 'block';
    elements.imageCanvas.style.display = 'none';
    elements.imageUploadInput.value = '';
  };

  const handleImageUpload = file => {
    if (file) {
      state.originalFileName = file.name.split('.')[0];
      const reader = new FileReader();
      reader.onload = event => {
        state.image.src = event.target.result;
        state.image.onload = () => {
          resizeCanvas();
          elements.ctx.drawImage(state.image, 0, 0, elements.imageCanvas.width, elements.imageCanvas.height);
          state.originalImageData = elements.ctx.getImageData(0, 0, elements.imageCanvas.width, elements.imageCanvas.height);
          toggleButtons(false, elements.deselectionBtn, elements.coloringBtn, elements.saveBtn);
          switchToolbar('selection');
          elements.uploadField.classList.remove('active');
          elements.uploadField.style.display = 'none';
          elements.imageCanvas.style.display = 'block';
        };
      };
      reader.readAsDataURL(file);
    }
  };

  const resizeCanvas = () => {
    const container = document.querySelector('.container');
    elements.imageCanvas.width = container.clientWidth - 40;
    elements.imageCanvas.height = elements.imageCanvas.width * (state.image.height / state.image.width);
    if (state.image.src) {
      elements.ctx.drawImage(state.image, 0, 0, elements.imageCanvas.width, elements.imageCanvas.height);
      if (state.polygonComplete) drawPolygon();
    }
  };

  // Add drag-and-drop functionality
  const handleDragOver = e => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    elements.uploadField.classList.add('drag-over');
  };

  const handleDragLeave = e => {
    elements.uploadField.classList.remove('drag-over');
  };

  const handleDrop = e => {
    e.preventDefault();
    elements.uploadField.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    handleImageUpload(file);
  };

  elements.uploadField.addEventListener('dragover', handleDragOver);
  elements.uploadField.addEventListener('dragleave', handleDragLeave);
  elements.uploadField.addEventListener('drop', handleDrop);

  const applyColorChange = () => {
    elements.ctx.putImageData(state.originalImageData, 0, 0);
    const imageData = elements.ctx.getImageData(0, 0, elements.imageCanvas.width, elements.imageCanvas.height);
    const sourceColor = hexToRgb(elements.sourceColorInput.value);
    const targetColor = hexToRgb(elements.targetColorInput.value);
    const tolerance = 50;
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      const x = (i / 4) % elements.imageCanvas.width;
      const y = Math.floor(i / 4 / elements.imageCanvas.width);
      if (!isWithinPolygon(x, y) && colorMatch(data[i], data[i + 1], data[i + 2], sourceColor, tolerance)) {
        data[i] = targetColor.r;
        data[i + 1] = targetColor.g;
        data[i + 2] = targetColor.b;
      }
    }
    elements.ctx.putImageData(imageData, 0, 0);
  };

  const detectDominantColor = () => {
    const imageData = elements.ctx.getImageData(0, 0, elements.imageCanvas.width, elements.imageCanvas.height);
    const data = imageData.data;
    const colorCounts = new Map();
    const excludeColors = new Set(['#808080', '#FFFFFF']);
    const step = Math.max(1, Math.floor((elements.imageCanvas.width * elements.imageCanvas.height) / 10000));

    for (let i = 0; data.length > i; i += 4 * step) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const hex = rgbToHex(r, g, b);

      if (!excludeColors.has(hex) && !isGrayOrWhite(r, g, b)) {
        colorCounts.set(hex, (colorCounts.get(hex) || 0) + 1);
      }
    }

    let dominantColor = '';
    let maxCount = 0;

    for (const [color, count] of colorCounts) {
      if (count > maxCount) {
        maxCount = count;
        dominantColor = color;
      }
    }

    elements.sourceColorInput.value = dominantColor;
  };

  const drawPolygon = () => {
    elements.ctx.putImageData(state.originalImageData, 0, 0);
    if (state.points.length) {
      elements.ctx.beginPath();
      elements.ctx.moveTo(state.points[0].x, state.points[0].y);
      state.points.forEach(p => elements.ctx.lineTo(p.x, p.y));
      if (state.points.length > 2) {
        elements.ctx.closePath();
        elements.ctx.fillStyle = 'rgba(212,63,58,0.15)';
        elements.ctx.fill();
      }
      elements.ctx.strokeStyle = '#d43f3a';
      elements.ctx.lineWidth = 2;
      elements.ctx.stroke();
      state.points.forEach(p => {
        elements.ctx.beginPath();
        elements.ctx.arc(p.x, p.y, 5, 0, 2 * Math.PI);
        elements.ctx.fillStyle = '#d43f3a';
        elements.ctx.fill();
      });
    }
  };

  const hexToRgb = hex => {
    const bigint = parseInt(hex.slice(1), 16);
    return { r: (bigint >> 16) & 255, g: (bigint >> 8) & 255, b: bigint & 255 };
  };

  const rgbToHex = (r, g, b) => `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()}`;

  const isGrayOrWhite = (r, g, b) => (Math.abs(r - g) <= 10 && Math.abs(g - b) <= 10 && Math.abs(b - r) <= 10) || (r > 240 && g > 240 && b > 240);

  const isWithinPolygon = (x, y) => state.points.reduce((inside, point, i, arr) => {
    const j = (i + 1) % arr.length;
    const { x: x1, y: y1 } = point;
    const { x: x2, y: y2 } = arr[j];
    const intersect = ((y1 > y) !== (y2 > y)) && (x < ((x2 - x1) * (y - y1)) / (y2 - y1) + x1);
    return intersect ? !inside : inside;
  }, false);

  const colorMatch = (r, g, b, color, tolerance) => Math.abs(r - color.r) <= tolerance && Math.abs(g - color.g) <= tolerance && Math.abs(b - color.b) <= tolerance;

  const showOverlay = () => elements.overlay.style.display = 'flex';
  const hideOverlay = () => elements.overlay.style.display = 'none';

  elements.resetBtn.addEventListener('click', () => {
    state.resetAction = 'reload';
    showOverlay();
  });

  elements.browseBtn.addEventListener('click', e => {
    e.stopPropagation();
    elements.imageUploadInput.click();
  });

  elements.imageUploadInput.addEventListener('change', (e) => handleImageUpload(e.target.files[0]));

  elements.applySelectionBtn.addEventListener('click', () => {
    if (state.points.length > 2) {
      state.polygonComplete = true;
      switchToolbar('coloring');
      detectDominantColor();
    }
  });

  elements.applyColorBtn.addEventListener('click', applyColorChange);

  elements.saveBtn.addEventListener('click', () => {
    const link = document.createElement('a');
    link.download = `${state.originalFileName}_${elements.targetColorInput.value}.jpg`;
    link.href = elements.imageCanvas.toDataURL('image/jpeg');
    link.click();
  });

  elements.clearSelectionBtn.addEventListener('click', () => {
    state.points = [];
    state.polygonComplete = false;
    elements.ctx.putImageData(state.originalImageData, 0, 0);
  });

  window.addEventListener('resize', resizeCanvas);

  elements.deselectionBtn.addEventListener('click', () => {
    if (!elements.deselectionBtn.classList.contains('disabled')) {
      switchToolbar('selection');
    }
  });

  elements.coloringBtn.addEventListener('click', () => {
    if (!elements.coloringBtn.classList.contains('disabled')) {
      switchToolbar('coloring');
      detectDominantColor();
    }
  });

  elements.uploadBtn.addEventListener('click', () => {
    if (!elements.uploadBtn.classList.contains('disabled')) {
      state.resetAction = 'upload';
      showOverlay();
    }
  });

  elements.confirmBtn.addEventListener('click', () => {
    hideOverlay();
    if (state.resetAction === 'reload') {
      location.reload();
    } else if (state.resetAction === 'upload') {
      resetEditor();
    }
  });

  elements.cancelBtn.addEventListener('click', hideOverlay);

  elements.imageCanvas.addEventListener('click', e => {
    if (state.polygonComplete) return;
    const { x, y } = getMousePos(e);
    state.points.push({ x, y });
    drawPolygon();
  });

  elements.imageCanvas.addEventListener('mousedown', e => {
    const { x, y } = getMousePos(e);
    state.draggingPointIndex = state.points.findIndex(p => Math.hypot(p.x - x, p.y - y) < 5);
  });

  elements.imageCanvas.addEventListener('mousemove', e => {
    if (state.draggingPointIndex !== null) {
      const { x, y } = getMousePos(e);
      state.points[state.draggingPointIndex] = { x, y };
      drawPolygon();
    }
  });

  elements.imageCanvas.addEventListener('mouseup', () => {
    state.draggingPointIndex = null;
  });

  document.addEventListener('keydown', e => {
    if (['Backspace', 'Delete'].includes(e.key)) {
      state.points.pop();
      drawPolygon();
    }
  });

  const getMousePos = e => {
    const rect = elements.imageCanvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  switchToolbar('upload');
});
