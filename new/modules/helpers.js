// Color conversion helpers
export const hexToRgb = hex => {
  const bigint = parseInt(hex.slice(1), 16);
  return { 
    r: (bigint >> 16) & 255, 
    g: (bigint >> 8) & 255, 
    b: bigint & 255 
  };
};

export const rgbToHex = (r, g, b) => 
  `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()}`;

export const isGrayOrWhite = (r, g, b) => 
  (Math.abs(r - g) <= 10 && Math.abs(g - b) <= 10 && Math.abs(b - r) <= 10) || 
  (r > 240 && g > 240 && b > 240);

export const colorMatch = (r, g, b, color, tolerance) => 
  Math.abs(r - color.r) <= tolerance && 
  Math.abs(g - color.g) <= tolerance && 
  Math.abs(b - color.b) <= tolerance;

// Polygon operations
export const isWithinPolygon = (x, y, points) => points.reduce((inside, point, i, arr) => {
  const j = (i + 1) % arr.length;
  const { x: x1, y: y1 } = point;
  const { x: x2, y: y2 } = arr[j];
  const intersect = ((y1 > y) !== (y2 > y)) && (x < ((x2 - x1) * (y - y1)) / (y2 - y1) + x1);
  return intersect ? !inside : inside;
}, false);
