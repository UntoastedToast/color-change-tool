export default class CanvasManager {
  constructor(canvas, domManager) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.domManager = domManager;
    this.image = new Image();
    this.originalImageData = null;
  }

  loadImage(src) {
    return new Promise((resolve) => {
      this.image.src = src;
      this.image.onload = () => {
        this.resize();
        this.drawImage();
        this.originalImageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        resolve();
      };
    });
  }

  resize() {
    const container = document.querySelector('.container');
    this.canvas.width = container.clientWidth - 40;
    this.canvas.height = this.canvas.width * (this.image.height / this.image.width);
    this.drawImage();
  }

  drawImage() {
    if (this.image.src) {
      this.ctx.drawImage(this.image, 0, 0, this.canvas.width, this.canvas.height);
    }
  }

  reset() {
    if (this.originalImageData) {
      this.ctx.putImageData(this.originalImageData, 0, 0);
    }
  }

  clear() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  getImageData() {
    return this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
  }

  putImageData(imageData) {
    this.ctx.putImageData(imageData, 0, 0);
  }

  getDataURL(type = 'image/jpeg', quality = 1.0) {
    return this.canvas.toDataURL(type, quality);
  }
}
