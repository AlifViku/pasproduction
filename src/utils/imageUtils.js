/**
 * Advanced Image Processing for Apparel Mockups & Artwork Extraction
 * 1. Percentage-based Crop with Edge Cleaning
 * 2. Multi-color & Flood-fill Background Removal
 * 3. Color Eyedropper / Color Key
 * 4. Transparent Bounding Box Auto-Trim
 */

// Perceptual color distance in RGB
export function getColorDistance(r1, g1, b1, r2, g2, b2) {
  const dr = r1 - r2;
  const dg = g1 - g2;
  const db = b1 - b2;
  return Math.sqrt(0.299 * dr * dr + 0.587 * dg * dg + 0.114 * db * db);
}

// Sample edge pixels of an image or canvas
export function detectDominantColor(canvasOrImg) {
  const canvas = document.createElement('canvas');
  const w = (canvas.width = Math.min(canvasOrImg.naturalWidth || canvasOrImg.width, 200));
  const h = (canvas.height = Math.min(canvasOrImg.naturalHeight || canvasOrImg.height, 200));
  const ctx = canvas.getContext('2d');
  ctx.drawImage(canvasOrImg, 0, 0, w, h);
  const data = ctx.getImageData(0, 0, w, h).data;

  let rSum = 0, gSum = 0, bSum = 0, count = 0;

  for (let x = 0; x < w; x += 4) {
    let idxTop = (2 * w + x) * 4;
    let idxBot = ((h - 3) * w + x) * 4;
    rSum += data[idxTop] + data[idxBot];
    gSum += data[idxTop + 1] + data[idxBot + 1];
    bSum += data[idxTop + 2] + data[idxBot + 2];
    count += 2;
  }

  for (let y = 0; y < h; y += 4) {
    let idxLeft = (y * w + 2) * 4;
    let idxRight = (y * w + (w - 3)) * 4;
    rSum += data[idxLeft] + data[idxRight];
    gSum += data[idxLeft + 1] + data[idxRight + 1];
    bSum += data[idxLeft + 2] + data[idxRight + 2];
    count += 2;
  }

  const r = Math.round(rSum / Math.max(1, count));
  const g = Math.round(gSum / Math.max(1, count));
  const b = Math.round(bSum / Math.max(1, count));
  const hex = '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
  return { rgb: [r, g, b], hex };
}

/**
 * Trim transparent pixels from all 4 borders of a canvas
 */
export function autoTrimTransparent(canvas) {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const w = canvas.width;
  const h = canvas.height;
  const imgData = ctx.getImageData(0, 0, w, h);
  const data = imgData.data;

  let minX = w, minY = h, maxX = 0, maxY = 0;
  let found = false;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const a = data[(y * w + x) * 4 + 3];
      if (a > 25) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
        found = true;
      }
    }
  }

  if (!found) return canvas;

  // Add 4px padding
  minX = Math.max(0, minX - 4);
  minY = Math.max(0, minY - 4);
  maxX = Math.min(w, maxX + 4);
  maxY = Math.min(h, maxY + 4);

  const trimW = Math.max(1, maxX - minX);
  const trimH = Math.max(1, maxY - minY);

  const trimmed = document.createElement('canvas');
  trimmed.width = trimW;
  trimmed.height = trimH;
  const tCtx = trimmed.getContext('2d');
  tCtx.drawImage(canvas, minX, minY, trimW, trimH, 0, 0, trimW, trimH);
  return trimmed;
}

/**
 * Extract artwork from a t-shirt photo:
 * 1. Crop to central artwork area (eliminating collar, sleeves, hems)
 * 2. Remove background fabric color via flood fill or global key
 * 3. Clean border fringes
 * 4. Auto-trim transparent margins
 */
export function extractArtwork(imageSrc, options = {}) {
  const {
    crop = { top: 20, bottom: 20, left: 18, right: 18 },
    tolerance = 45,
    targetColor = null,
    mode = 'flood',
    removeWhiteOuter = true,
    autoTrim = true
  } = options;

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const origW = img.naturalWidth || img.width;
      const origH = img.naturalHeight || img.height;

      // 1. Calculate Crop Rect
      const startX = Math.floor((origW * (crop.left || 0)) / 100);
      const startY = Math.floor((origH * (crop.top || 0)) / 100);
      const endX = Math.floor(origW - (origW * (crop.right || 0)) / 100);
      const endY = Math.floor(origH - (origH * (crop.bottom || 0)) / 100);
      const cropW = Math.max(10, endX - startX);
      const cropH = Math.max(10, endY - startY);

      // 2. Draw cropped region to canvas
      const canvas = document.createElement('canvas');
      canvas.width = cropW;
      canvas.height = cropH;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(img, startX, startY, cropW, cropH, 0, 0, cropW, cropH);

      const imgData = ctx.getImageData(0, 0, cropW, cropH);
      const data = imgData.data;

      // 3. Detect dominant fabric color on the cropped border if targetColor not provided
      let [tr, tg, tb] = targetColor || [240, 235, 225];
      if (!targetColor) {
        const detected = detectDominantColor(canvas);
        tr = detected.rgb[0];
        tg = detected.rgb[1];
        tb = detected.rgb[2];
      }

      // 4. Flood fill removal from outer edges of cropped region
      if (mode === 'flood') {
        const visited = new Uint8Array(cropW * cropH);
        const queue = [];

        // Seed with all border pixels
        for (let x = 0; x < cropW; x++) {
          queue.push(x);
          queue.push((cropH - 1) * cropW + x);
        }
        for (let y = 1; y < cropH - 1; y++) {
          queue.push(y * cropW);
          queue.push(y * cropW + (cropW - 1));
        }

        let head = 0;
        while (head < queue.length) {
          const pos = queue[head++];
          if (visited[pos]) continue;
          visited[pos] = 1;

          const idx = pos * 4;
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];

          const dist = getColorDistance(r, g, b, tr, tg, tb);
          // Also check if pixel is near-white (outer photo background)
          const isWhite = removeWhiteOuter && (r > 235 && g > 235 && b > 235);

          if (dist <= tolerance || isWhite) {
            // Feather edge
            const feather = tolerance * 0.25;
            if (dist <= tolerance - feather || isWhite) {
              data[idx + 3] = 0;
            } else {
              const alphaRatio = (dist - (tolerance - feather)) / feather;
              data[idx + 3] = Math.round(data[idx + 3] * alphaRatio);
            }

            const px = pos % cropW;
            const py = Math.floor(pos / cropW);

            if (px > 0 && !visited[pos - 1]) queue.push(pos - 1);
            if (px < cropW - 1 && !visited[pos + 1]) queue.push(pos + 1);
            if (py > 0 && !visited[pos - cropW]) queue.push(pos - cropW);
            if (py < cropH - 1 && !visited[pos + cropW]) queue.push(pos + cropW);
          }
        }
      } else {
        // Global color key
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const dist = getColorDistance(r, g, b, tr, tg, tb);
          const isWhite = removeWhiteOuter && (r > 235 && g > 235 && b > 235);

          if (dist <= tolerance || isWhite) {
            const feather = tolerance * 0.25;
            if (dist <= tolerance - feather || isWhite) {
              data[i + 3] = 0;
            } else {
              const alphaRatio = (dist - (tolerance - feather)) / feather;
              data[i + 3] = Math.round(data[i + 3] * alphaRatio);
            }
          }
        }
      }

      ctx.putImageData(imgData, 0, 0);

      // 5. Clean fringes / isolated edge noise
      // Zero out 2px outer border to ensure no dark seam lines survive
      ctx.clearRect(0, 0, cropW, 2);
      ctx.clearRect(0, cropH - 2, cropW, 2);
      ctx.clearRect(0, 0, 2, cropH);
      ctx.clearRect(cropW - 2, 0, 2, cropH);

      // 6. Auto-trim transparent empty space
      const finalCanvas = autoTrim ? autoTrimTransparent(canvas) : canvas;
      resolve(finalCanvas.toDataURL('image/png'));
    };
    img.onerror = reject;
    img.src = imageSrc;
  });
}
