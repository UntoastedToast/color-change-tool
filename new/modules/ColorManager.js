import * as helpers from './helpers.js';

export default class ColorManager {
  constructor(canvasManager, polygonManager) {
    this.canvasManager = canvasManager;
    this.polygonManager = polygonManager;
    this.debugMode = true; // Enable debug mode by default
    this.updateFrequency = 20; // How often to update the canvas during processing
  }

  detectDominantColor() {
    const imageData = this.canvasManager.getImageData();
    const data = imageData.data;
    const canvas = this.canvasManager.canvas;
    
    // Group colors into buckets for better detection
    const colorBuckets = new Map();
    const step = Math.max(1, Math.floor((canvas.width * canvas.height) / 100000));
    
    // Check if polygons exist
    const hasPolygon = this.polygonManager?.hasPolygon?.();
    
    let sampledPixels = 0;
    
    for (let i = 0; i < data.length; i += 4 * step) {
      const x = (i / 4) % canvas.width;
      const y = Math.floor((i / 4) / canvas.width);
      
      // Skip pixels inside polygon or transparent pixels
      if ((hasPolygon && this.polygonManager.isPointInPolygon(x, y)) || data[i + 3] === 0) {
        continue;
      }
      
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      // Skip extreme gray values and white
      if (this.isExtremeGrayOrWhite(r, g, b)) continue;
      
      // Group similar colors together
      const bucketKey = this.getBucketKey(r, g, b);
      colorBuckets.set(bucketKey, (colorBuckets.get(bucketKey) || 0) + 1);
      sampledPixels++;
    }

    // Handle case with no relevant colors
    if (sampledPixels === 0) {
      console.warn("No relevant colors found outside the polygon");
      return '#FF0000';  // Fallback
    }

    // Get the most frequent color
    const sortedBuckets = [...colorBuckets.entries()].sort((a, b) => b[1] - a[1]);
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
   */
  getBucketKey(r, g, b) {
    const bucketSize = 32; // 256/8 = 32
    const offset = bucketSize/2;
    const rBucket = Math.floor(r / bucketSize) * bucketSize + offset;
    const gBucket = Math.floor(g / bucketSize) * bucketSize + offset;
    const bBucket = Math.floor(b / bucketSize) * bucketSize + offset;
    
    return `${rBucket},${gBucket},${bBucket}`;
  }
  
  /**
   * Check for extreme gray tones and white
   */
  isExtremeGrayOrWhite(r, g, b) {
    const isGrayscale = Math.abs(r - g) < 20 && Math.abs(g - b) < 20 && Math.abs(r - b) < 20;
    return isGrayscale && ((r < 30 && g < 30 && b < 30) || (r > 240 && g > 240 && b > 240));
  }

  /**
   * Changes a source color to a target color within the canvas
   */
  applyColorChange(sourceColor, targetColor, tolerance) {
    this.canvasManager.reset();
    const imageData = this.canvasManager.getImageData();
    const data = imageData.data;
    const canvas = this.canvasManager.canvas;
    const sourceRgb = helpers.hexToRgb(sourceColor);
    const targetRgb = helpers.hexToRgb(targetColor);
    const sourceHsl = helpers.rgbToHsl(sourceRgb.r, sourceRgb.g, sourceRgb.b);
    const maxRgbDiff = tolerance * 1.5;

    // Process in chunks to avoid UI blocking
    const chunkSize = 100000; // Number of pixels per chunk
    const processChunk = (startIndex) => {
      try {
        const endIndex = Math.min(startIndex + chunkSize * 4, data.length);
        
        for (let i = startIndex; i < endIndex; i += 4) {
          const x = (i / 4) % canvas.width;
          const y = Math.floor((i / 4) / canvas.width);
          
          // Skip pixels inside polygon
          if (this.polygonManager.isPointInPolygon(x, y)) continue;
          
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          
          // Calculate RGB difference
          const rgbDiff = Math.sqrt(
            Math.pow(r - sourceRgb.r, 2) + 
            Math.pow(g - sourceRgb.g, 2) + 
            Math.pow(b - sourceRgb.b, 2)
          );
          
          // Early exit if RGB difference is too large
          if (rgbDiff > maxRgbDiff * 1.2) continue;
          
          // Color is close enough in RGB space, do HSL comparison
          const pixelHsl = helpers.rgbToHsl(r, g, b);
          const hueDiff = Math.min(
            Math.abs(pixelHsl.h - sourceHsl.h), 
            1 - Math.abs(pixelHsl.h - sourceHsl.h)
          );
          
          const isSameHue = hueDiff < 0.08;
          const isSimilarShade = isSameHue && Math.abs(pixelHsl.s - sourceHsl.s) < 0.3;
          
          if (rgbDiff <= maxRgbDiff || isSimilarShade) {
            // Calculate blending factor
            const blendFactor = isSimilarShade
              ? Math.pow(1 - (rgbDiff / (maxRgbDiff * 1.5)), 0.8)
              : Math.pow(1 - (rgbDiff / maxRgbDiff), 0.7);
            
            const colorBoost = 1.2;
            
            // Apply color transformation with clamping to valid RGB range
            for (let j = 0; j < 3; j++) {
              data[i + j] = Math.min(255, Math.max(0, Math.round(
                data[i + j] + blendFactor * colorBoost * (targetRgb[['r', 'g', 'b'][j]] - data[i + j])
              )));
            }
          }
        }
        
        // Continue processing chunks
        if (endIndex < data.length) {
          setTimeout(() => processChunk(endIndex), 0);
          
          // Update Canvas with intermediate results
          if (endIndex % (chunkSize * this.updateFrequency) === 0) {
            this.canvasManager.putImageData(imageData);
          }
        } else {
          // Processing complete - show final result
          this.canvasManager.putImageData(imageData);
        }
      } catch (error) {
        console.error("Error during color processing:", error);
        this.canvasManager.putImageData(imageData);
      }
    };
    
    // Start processing
    processChunk(0);
    
    return imageData;
  }
}
