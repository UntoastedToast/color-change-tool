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

/**
 * Converts RGB color to HSL color space
 * @param {number} r - Red value (0-255)
 * @param {number} g - Green value (0-255)
 * @param {number} b - Blue value (0-255)
 * @returns {object} HSL color object with h, s, l properties (all 0-1)
 */
export function rgbToHsl(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;
  
  if (max === min) {
    h = s = 0; // achromatic
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    
    h /= 6;
  }
  
  return { h, s, l };
}

// Polygon operations
export const isWithinPolygon = (x, y, points) => points.reduce((inside, point, i, arr) => {
  const j = (i + 1) % arr.length;
  const { x: x1, y: y1 } = point;
  const { x: x2, y: y2 } = arr[j];
  const intersect = ((y1 > y) !== (y2 > y)) && (x < ((x2 - x1) * (y - y1)) / (y2 - y1) + x1);
  return intersect ? !inside : inside;
}, false);
