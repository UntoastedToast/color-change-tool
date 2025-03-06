import * as helpers from './helpers.js';

export default class ColorManager {
  constructor(canvasManager, polygonManager) {
    this.canvasManager = canvasManager;
    this.polygonManager = polygonManager;
    this.debugMode = true; // Enable debug mode by default
  }

  detectDominantColor() {
    const imageData = this.canvasManager.getImageData();
    const data = imageData.data;
    const canvas = this.canvasManager.canvas;
    
    // Group colors into buckets for better detection
    const colorBuckets = new Map();
    // Reduce the step for a more accurate sampling
    const step = Math.max(1, Math.floor((canvas.width * canvas.height) / 100000));
    
    // Check if polygons exist
    const hasPolygon = this.polygonManager && typeof this.polygonManager.hasPolygon === 'function' && 
                      this.polygonManager.hasPolygon();
    
    let sampledPixels = 0;
    
    for (let i = 0; i < data.length; i += 4 * step) {
      const x = (i / 4) % canvas.width;
      const y = Math.floor((i / 4) / canvas.width);
      
      // Skip pixels inside the polygon
      if (hasPolygon && this.polygonManager.isPointInPolygon(x, y)) {
        continue;
      }
      
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];
      
      // Ignore fully transparent pixels
      if (a === 0) continue;
      
      // Simplified relevance check - exclude only extreme gray values and white
      if (this.isExtremeGrayOrWhite(r, g, b)) continue;
      
      // "Bucketize" color - group similar colors together
      const bucketKey = this.getBucketKey(r, g, b);
      
      // Increase counter value in the bucket
      colorBuckets.set(bucketKey, (colorBuckets.get(bucketKey) || 0) + 1);
      sampledPixels++;
    }

    // No relevant colors found
    if (sampledPixels === 0) {
      console.warn("No relevant colors found outside the polygon");
      return '#FF0000';  // Fallback
    }

    // Sort buckets by frequency
    const sortedBuckets = [...colorBuckets.entries()].sort((a, b) => b[1] - a[1]);
    
    // Convert the bucket key back to a real hex color value
    const dominantColorBucket = sortedBuckets[0][0];
    const [rBucket, gBucket, bBucket] = dominantColorBucket.split(',').map(Number);
    const dominantColor = helpers.rgbToHex(rBucket, gBucket, bBucket);
    
    if (this.debugMode) {
      console.log(`Analyzed a total of ${sampledPixels} pixels`);
      console.log(`Top 5 dominant color ranges (of ${colorBuckets.size} detected ranges):`);
      sortedBuckets.slice(0, 5).forEach((bucket, i) => {
        const [r, g, b] = bucket[0].split(',').map(Number);
        const hex = helpers.rgbToHex(r, g, b);
        const percentage = ((bucket[1] / sampledPixels) * 100).toFixed(2);
        console.log(`${i + 1}. ${hex} (${bucket[1]} pixels, ${percentage}%)`);
      });
    }
    
    return dominantColor;
  }
  
  /**
   * Creates a bucket key for similar colors
   * @param {number} r - Red value
   * @param {number} g - Green value
   * @param {number} b - Blue value
   * @returns {string} Bucket key as RGB string
   */
  getBucketKey(r, g, b) {
    // Quantize the color into 8 levels per channel (instead of 256)
    // This groups similar colors together
    const bucketSize = 32; // 256/8 = 32
    const rBucket = Math.floor(r / bucketSize) * bucketSize + bucketSize/2;
    const gBucket = Math.floor(g / bucketSize) * bucketSize + bucketSize/2;
    const bBucket = Math.floor(b / bucketSize) * bucketSize + bucketSize/2;
    
    return `${rBucket},${gBucket},${bBucket}`;
  }
  
  /**
   * Simplified check for extreme gray tones and white
   * @param {number} r - Red value
   * @param {number} g - Green value
   * @param {number} b - Blue value
   * @returns {boolean} True if it is an extreme gray tone or white
   */
  isExtremeGrayOrWhite(r, g, b) {
    const isGrayscale = Math.abs(r - g) < 20 && Math.abs(g - b) < 20 && Math.abs(r - b) < 20;
    const isVeryDark = r < 30 && g < 30 && b < 30; // Almost black
    const isWhiteOrBrightGray = r > 240 && g > 240 && b > 240; // White or very light gray
    
    return isGrayscale && (isVeryDark || isWhiteOrBrightGray);
  }

  /**
   * Changes a source color to a target color within the canvas
   * @param {string} sourceColor - Hex color value of the color to be replaced
   * @param {string} targetColor - Hex color value of the new color
   * @param {number} tolerance - Tolerance value for color matching (0-255)
   * @returns {ImageData} The modified image data
   */
  applyColorChange(sourceColor, targetColor, tolerance) {
    this.canvasManager.reset();
    const imageData = this.canvasManager.getImageData();
    const data = imageData.data;
    const canvas = this.canvasManager.canvas;
    const sourceRgb = helpers.hexToRgb(sourceColor);
    const targetRgb = helpers.hexToRgb(targetColor);

    // For large images: Process in chunks to avoid UI blocking
    const chunkSize = 100000; // Number of pixels per chunk
    const processChunk = (startIndex) => {
      const endIndex = Math.min(startIndex + chunkSize * 4, data.length);
      
      for (let i = startIndex; i < endIndex; i += 4) {
        const x = (i / 4) % canvas.width;
        const y = Math.floor((i / 4) / canvas.width);
        
        // Check color match first, then polygon check (more efficient)
        if (helpers.colorMatch(data[i], data[i + 1], data[i + 2], sourceRgb, tolerance) && 
            !this.polygonManager.isPointInPolygon(x, y)) {
          data[i] = targetRgb.r;
          data[i + 1] = targetRgb.g;
          data[i + 2] = targetRgb.b;
        }
      }
      
      // If there are still chunks to process, schedule the next chunk
      if (endIndex < data.length) {
        setTimeout(() => processChunk(endIndex), 0);
        
        // Update Canvas with intermediate results for visual feedback
        if (endIndex % (chunkSize * 20) === 0) {
          this.canvasManager.putImageData(imageData);
        }
      } else {
        // Done - show final result
        this.canvasManager.putImageData(imageData);
      }
    };
    
    // Start processing with the first chunk
    processChunk(0);
    
    return imageData;
  }
}
