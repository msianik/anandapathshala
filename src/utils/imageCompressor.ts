/**
 * Image Compression & Optimization Utility
 * -----------------------------------------
 * Resizes and compresses image Files, Blobs, or data URLs using HTML5 Canvas.
 * Keeps student photos within ~20KB - 40KB (max 360x360 px), preventing
 * Firestore document size limits (1MB) and localStorage quota exhaustion.
 */

export async function compressImageToDataUrl(
  input: File | Blob | string,
  maxWidth = 360,
  maxHeight = 360,
  quality = 0.75
): Promise<string> {
  return new Promise((resolve) => {
    // If empty input, resolve immediately
    if (!input) {
      resolve('');
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';

    const processImage = () => {
      let width = img.naturalWidth || img.width;
      let height = img.naturalHeight || img.height;

      if (!width || !height) {
        resolve(typeof input === 'string' ? input : '');
        return;
      }

      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      try {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(typeof input === 'string' ? input : '');
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      } catch {
        resolve(typeof input === 'string' ? input : '');
      }
    };

    img.onload = processImage;
    img.onerror = () => {
      resolve(typeof input === 'string' ? input : '');
    };

    if (typeof input === 'string') {
      img.src = input;
    } else {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          img.src = reader.result;
        } else {
          resolve('');
        }
      };
      reader.onerror = () => resolve('');
      reader.readAsDataURL(input);
    }
  });
}
