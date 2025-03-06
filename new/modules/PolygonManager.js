import * as helpers from './helpers.js';

export default class PolygonManager {
  constructor(canvasManager) {
    this.canvasManager = canvasManager;
    this.ctx = canvasManager.ctx;
    this.points = [];
    this.isComplete = false;
    this.draggingPointIndex = null;
  }

  addPoint(x, y) {
    this.points.push({ x, y });
    this.draw();
  }

  clear() {
    this.points = [];
    this.isComplete = false;
    this.canvasManager.reset();
  }

  removeLastPoint() {
    this.points.pop();
    this.draw();
  }

  draw() {
    this.canvasManager.reset();
    
    if (this.points.length === 0) return;

    // Draw polygon path
    this.ctx.beginPath();
    this.ctx.moveTo(this.points[0].x, this.points[0].y);
    
    for (let i = 1; i < this.points.length; i++) {
      this.ctx.lineTo(this.points[i].x, this.points[i].y);
    }

    if (this.points.length > 2) {
      this.ctx.closePath();
      this.ctx.fillStyle = 'rgba(212,63,58,0.15)';
      this.ctx.fill();
    }

    // Draw stroke
    this.ctx.strokeStyle = '#d43f3a';
    this.ctx.lineWidth = 2;
    this.ctx.stroke();

    // Draw points
    this.points.forEach(point => {
      this.ctx.beginPath();
      this.ctx.arc(point.x, point.y, 5, 0, 2 * Math.PI);
      this.ctx.fillStyle = '#d43f3a';
      this.ctx.fill();
    });
  }

  checkPointIntersection(x, y, radius = 5) {
    return this.points.findIndex(p => 
      Math.hypot(p.x - x, p.y - y) < radius
    );
  }

  updatePoint(index, x, y) {
    if (index >= 0 && index < this.points.length) {
      this.points[index] = { x, y };
      this.draw();
    }
  }

  isPointInPolygon(x, y) {
    return helpers.isWithinPolygon(x, y, this.points);
  }

  setComplete(complete) {
    this.isComplete = complete;
  }

  isValid() {
    return this.points.length >= 3;
  }

  getPoints() {
    return this.points;
  }
}
