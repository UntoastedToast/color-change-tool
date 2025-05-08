export default class DOMManager {
  constructor() {
    this.elements = this.cacheElements();
    this.setupEventListeners = this.setupEventListeners.bind(this);
  }

  cacheElements() {
    return {
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
      toleranceSlider: document.getElementById('tolerance-slider'),
      toleranceValue: document.getElementById('tolerance-value'),
      clearSelectionBtn: document.getElementById('clear-selection'),
      resetBtn: document.getElementById('reset-btn'),
      overlay: document.getElementById('overlay'),
      confirmBtn: document.getElementById('confirm-btn'),
      cancelBtn: document.getElementById('cancel-btn'),
    };
  }

  toggleButtons(disabled, ...buttons) {
    buttons.forEach(btn => btn.classList.toggle('disabled', disabled));
  }

  switchToolbar(mode) {
    const { elements } = this;
    ['selection', 'coloring'].forEach(toolbar =>
      document.getElementById(`${toolbar}-toolbar`).style.display = mode === toolbar ? 'block' : 'none'
    );
    
    Object.keys(elements).forEach(key => 
      elements[key].classList && elements[key].classList.remove('active')
    );
    
    if (elements[`${mode}Btn`]) elements[`${mode}Btn`].classList.add('active');
    if (mode === 'selection') elements.deselectionBtn.classList.add('active');
  }

  showUploadField() {
    const { uploadField, imageCanvas, imageUploadInput } = this.elements;
    uploadField.classList.add('active');
    uploadField.style.display = 'block';
    imageCanvas.style.display = 'none';
    imageUploadInput.value = '';
  }

  showOverlay() {
    this.elements.overlay.style.display = 'flex';
  }

  hideOverlay() {
    this.elements.overlay.style.display = 'none';
  }

  getMousePos(e) {
    const rect = this.elements.imageCanvas.getBoundingClientRect();
    return { 
      x: e.clientX - rect.left, 
      y: e.clientY - rect.top 
    };
  }

  setupEventListeners() {
    // This is an empty placeholder - will be implemented by ImageEditor
  }
}
