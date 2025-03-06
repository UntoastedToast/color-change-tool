export default class EventHandler {
  constructor(imageEditor) {
    this.imageEditor = imageEditor;
    this.elements = imageEditor.domManager.elements;
  }
  
  init() {
    this.attachEventListeners();
  }
  
  attachEventListeners() {
    const { elements, imageEditor } = this;

    // Reset button
    elements.resetBtn.addEventListener('click', () => {
      imageEditor.state.resetAction = 'reload';
      imageEditor.domManager.showOverlay();
    });

    // Browse button
    elements.browseBtn.addEventListener('click', e => {
      e.stopPropagation();
      elements.imageUploadInput.click();
    });

    // File upload
    elements.imageUploadInput.addEventListener('change', e => 
      imageEditor.handleImageUpload(e.target.files[0])
    );

    // Apply selection
    elements.applySelectionBtn.addEventListener('click', () => {
      if (imageEditor.polygonManager.isValid()) {
        imageEditor.polygonManager.setComplete(true);
        imageEditor.domManager.switchToolbar('coloring');
        const dominantColor = imageEditor.colorManager.detectDominantColor();
        elements.sourceColorInput.value = dominantColor;
      }
    });

    // Apply color
    elements.applyColorBtn.addEventListener('click', () => {
      imageEditor.colorManager.applyColorChange(
        elements.sourceColorInput.value,
        elements.targetColorInput.value,
        parseInt(elements.toleranceSlider.value)
      );
    });

    // Save button
    elements.saveBtn.addEventListener('click', () => {
      const link = document.createElement('a');
      link.download = `${imageEditor.state.originalFileName}_${elements.targetColorInput.value}.jpg`;
      link.href = imageEditor.canvasManager.getDataURL('image/jpeg');
      link.click();
    });

    // Clear selection
    elements.clearSelectionBtn.addEventListener('click', () => {
      imageEditor.polygonManager.clear();
    });

    // Window resize
    window.addEventListener('resize', () => imageEditor.canvasManager.resize());

    // Navigation buttons
    elements.deselectionBtn.addEventListener('click', () => {
      if (!elements.deselectionBtn.classList.contains('disabled')) {
        imageEditor.domManager.switchToolbar('selection');
      }
    });

    elements.coloringBtn.addEventListener('click', () => {
      if (!elements.coloringBtn.classList.contains('disabled')) {
        imageEditor.domManager.switchToolbar('coloring');
        const dominantColor = imageEditor.colorManager.detectDominantColor();
        elements.sourceColorInput.value = dominantColor;
      }
    });

    elements.uploadBtn.addEventListener('click', () => {
      if (!elements.uploadBtn.classList.contains('disabled')) {
        imageEditor.state.resetAction = 'upload';
        imageEditor.domManager.showOverlay();
      }
    });

    // Overlay buttons
    elements.confirmBtn.addEventListener('click', () => {
      imageEditor.domManager.hideOverlay();
      if (imageEditor.state.resetAction === 'reload') {
        location.reload();
      } else if (imageEditor.state.resetAction === 'upload') {
        imageEditor.resetEditor();
      }
    });

    elements.cancelBtn.addEventListener('click', () => imageEditor.domManager.hideOverlay());

    // Canvas interactions
    elements.imageCanvas.addEventListener('click', e => {
      if (imageEditor.polygonManager.isComplete) return;
      const { x, y } = imageEditor.domManager.getMousePos(e);
      imageEditor.polygonManager.addPoint(x, y);
    });

    elements.imageCanvas.addEventListener('mousedown', e => {
      const { x, y } = imageEditor.domManager.getMousePos(e);
      imageEditor.polygonManager.draggingPointIndex = imageEditor.polygonManager.checkPointIntersection(x, y);
    });

    elements.imageCanvas.addEventListener('mousemove', e => {
      if (imageEditor.polygonManager.draggingPointIndex !== null) {
        const { x, y } = imageEditor.domManager.getMousePos(e);
        imageEditor.polygonManager.updatePoint(imageEditor.polygonManager.draggingPointIndex, x, y);
      }
    });

    elements.imageCanvas.addEventListener('mouseup', () => {
      imageEditor.polygonManager.draggingPointIndex = null;
    });

    // Keyboard events
    document.addEventListener('keydown', e => {
      if (['Backspace', 'Delete'].includes(e.key)) {
        imageEditor.polygonManager.removeLastPoint();
      }
    });

    // Drag and drop
    elements.uploadField.addEventListener('dragover', e => imageEditor.handleDragOver(e));
    elements.uploadField.addEventListener('dragleave', () => imageEditor.handleDragLeave());
    elements.uploadField.addEventListener('drop', e => imageEditor.handleDrop(e));

    // Tolerance slider
    elements.toleranceSlider.addEventListener('input', () => {
      elements.toleranceValue.textContent = elements.toleranceSlider.value;
    });
  }
}
