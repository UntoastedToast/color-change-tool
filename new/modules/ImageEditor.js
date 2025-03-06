import DOMManager from './DOMManager.js';
import CanvasManager from './CanvasManager.js';
import PolygonManager from './PolygonManager.js';
import ColorManager from './ColorManager.js';

export default class ImageEditor {
  constructor() {
    this.domManager = new DOMManager();
    this.elements = this.domManager.elements;
    
    this.canvasManager = new CanvasManager(this.elements.imageCanvas, this.domManager);
    this.polygonManager = new PolygonManager(this.canvasManager);
    this.colorManager = new ColorManager(this.canvasManager, this.polygonManager);
    
    this.state = {
      originalFileName: '',
      resetAction: null,
    };
  }

  init() {
    this.domManager.switchToolbar('upload');
    this.setupEventListeners();
  }

  resetEditor() {
    this.polygonManager.clear();
    this.state.originalFileName = '';
    this.canvasManager.clear();
    
    this.domManager.showUploadField();
    this.domManager.toggleButtons(
      true, 
      this.elements.deselectionBtn, 
      this.elements.coloringBtn, 
      this.elements.saveBtn
    );
    this.domManager.switchToolbar('upload');
  }

  handleImageUpload(file) {
    if (!file) return;
    
    this.state.originalFileName = file.name.split('.')[0];
    
    const reader = new FileReader();
    reader.onload = async (event) => {
      await this.canvasManager.loadImage(event.target.result);
      
      this.domManager.toggleButtons(
        false, 
        this.elements.deselectionBtn, 
        this.elements.coloringBtn, 
        this.elements.saveBtn
      );
      
      this.domManager.switchToolbar('selection');
      this.elements.uploadField.classList.remove('active');
      this.elements.uploadField.style.display = 'none';
      this.elements.imageCanvas.style.display = 'block';
    };
    reader.readAsDataURL(file);
  }

  handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    this.elements.uploadField.classList.add('drag-over');
  }

  handleDragLeave() {
    this.elements.uploadField.classList.remove('drag-over');
  }

  handleDrop(e) {
    e.preventDefault();
    this.elements.uploadField.classList.remove('drag-over');
    this.handleImageUpload(e.dataTransfer.files[0]);
  }

  setupEventListeners() {
    const { elements } = this;

    elements.resetBtn.addEventListener('click', () => {
      this.state.resetAction = 'reload';
      this.domManager.showOverlay();
    });

    elements.browseBtn.addEventListener('click', e => {
      e.stopPropagation();
      elements.imageUploadInput.click();
    });

    elements.imageUploadInput.addEventListener('change', e => 
      this.handleImageUpload(e.target.files[0])
    );

    elements.applySelectionBtn.addEventListener('click', () => {
      if (this.polygonManager.isValid()) {
        this.polygonManager.setComplete(true);
        this.domManager.switchToolbar('coloring');
        const dominantColor = this.colorManager.detectDominantColor();
        elements.sourceColorInput.value = dominantColor;
      }
    });

    elements.applyColorBtn.addEventListener('click', () => {
      this.colorManager.applyColorChange(
        elements.sourceColorInput.value,
        elements.targetColorInput.value,
        parseInt(elements.toleranceSlider.value)
      );
    });

    elements.saveBtn.addEventListener('click', () => {
      const link = document.createElement('a');
      link.download = `${this.state.originalFileName}_${elements.targetColorInput.value}.jpg`;
      link.href = this.canvasManager.getDataURL('image/jpeg');
      link.click();
    });

    elements.clearSelectionBtn.addEventListener('click', () => {
      this.polygonManager.clear();
    });

    window.addEventListener('resize', () => this.canvasManager.resize());

    elements.deselectionBtn.addEventListener('click', () => {
      if (!elements.deselectionBtn.classList.contains('disabled')) {
        this.domManager.switchToolbar('selection');
      }
    });

    elements.coloringBtn.addEventListener('click', () => {
      if (!elements.coloringBtn.classList.contains('disabled')) {
        this.domManager.switchToolbar('coloring');
        const dominantColor = this.colorManager.detectDominantColor();
        elements.sourceColorInput.value = dominantColor;
      }
    });

    elements.uploadBtn.addEventListener('click', () => {
      if (!elements.uploadBtn.classList.contains('disabled')) {
        this.state.resetAction = 'upload';
        this.domManager.showOverlay();
      }
    });

    elements.confirmBtn.addEventListener('click', () => {
      this.domManager.hideOverlay();
      if (this.state.resetAction === 'reload') {
        location.reload();
      } else if (this.state.resetAction === 'upload') {
        this.resetEditor();
      }
    });

    elements.cancelBtn.addEventListener('click', () => this.domManager.hideOverlay());

    elements.imageCanvas.addEventListener('click', e => {
      if (this.polygonManager.isComplete) return;
      const { x, y } = this.domManager.getMousePos(e);
      this.polygonManager.addPoint(x, y);
    });

    elements.imageCanvas.addEventListener('mousedown', e => {
      const { x, y } = this.domManager.getMousePos(e);
      this.polygonManager.draggingPointIndex = this.polygonManager.checkPointIntersection(x, y);
    });

    elements.imageCanvas.addEventListener('mousemove', e => {
      if (this.polygonManager.draggingPointIndex !== null) {
        const { x, y } = this.domManager.getMousePos(e);
        this.polygonManager.updatePoint(this.polygonManager.draggingPointIndex, x, y);
      }
    });

    elements.imageCanvas.addEventListener('mouseup', () => {
      this.polygonManager.draggingPointIndex = null;
    });

    document.addEventListener('keydown', e => {
      if (['Backspace', 'Delete'].includes(e.key)) {
        this.polygonManager.removeLastPoint();
      }
    });

    elements.uploadField.addEventListener('dragover', e => this.handleDragOver(e));
    elements.uploadField.addEventListener('dragleave', () => this.handleDragLeave());
    elements.uploadField.addEventListener('drop', e => this.handleDrop(e));

    elements.toleranceSlider.addEventListener('input', () => {
      elements.toleranceValue.textContent = elements.toleranceSlider.value;
    });
  }
}
