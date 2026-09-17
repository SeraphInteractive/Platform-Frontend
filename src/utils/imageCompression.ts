/**
 * Client-side browser native image compression.
 * Converts files to WebP at max 1920x1080 with 85% quality.
 */
export interface CompressionResult {
  file: File;
  dataUrl: string;
  originalSize: number;
  compressedSize: number;
  reductionPercentage: number;
}

export async function compressImageToWebP(
  file: File,
  maxWidth = 1920,
  maxHeight = 1080,
  quality = 0.85
): Promise<CompressionResult> {
  return new Promise((resolve, reject) => {
    // If SVG or gif (animations), don't compress via canvas
    if (file.type === 'image/svg+xml' || file.type === 'image/gif') {
      const reader = new FileReader();
      reader.onload = () => {
        resolve({
          file,
          dataUrl: reader.result as string,
          originalSize: file.size,
          compressedSize: file.size,
          reductionPercentage: 0,
        });
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
      return;
    }

    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };

    reader.onerror = (err) => reject(err);

    img.onload = () => {
      let { width, height } = img;

      // Scale down if exceeding max bounds
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas 2D context unavailable'));
        return;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Canvas compression failed'));
            return;
          }

          const originalName = file.name.replace(/\.[^/.]+$/, '');
          const compressedFile = new File([blob], `${originalName}.webp`, {
            type: 'image/webp',
            lastModified: Date.now(),
          });

          const dataUrl = canvas.toDataURL('image/webp', quality);
          const reductionPercentage = Math.round(
            ((file.size - compressedFile.size) / file.size) * 100
          );

          resolve({
            file: compressedFile,
            dataUrl,
            originalSize: file.size,
            compressedSize: compressedFile.size,
            reductionPercentage: Math.max(0, reductionPercentage),
          });
        },
        'image/webp',
        quality
      );
    };

    img.onerror = (err) => reject(err);

    reader.readAsDataURL(file);
  });
}
