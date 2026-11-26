/**
 * Compresses and resizes an image file selected from a phone/desktop gallery
 * so it stays well under Firestore's 250,000-character document field limit
 * and loads rapidly on mobile networks.
 */
export async function compressImageFile(
  file: File,
  maxDimension: number = 720,
  maxDataUrlLength: number = 220000
): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('El archivo seleccionado no es una imagen válida.');
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('No se pudo leer la imagen seleccionada.'));
      image.src = objectUrl;
    });

    const scale = Math.min(1, maxDimension / Math.max(img.width, img.height, 1));
    let targetWidth = Math.max(1, Math.round(img.width * scale));
    let targetHeight = Math.max(1, Math.round(img.height * scale));

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Tu navegador no permite procesar imágenes.');
    }

    let quality = 0.82;
    let result = '';

    for (let attempt = 0; attempt < 5; attempt++) {
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      ctx.clearRect(0, 0, targetWidth, targetHeight);
      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

      result = canvas.toDataURL('image/jpeg', quality);
      if (result.length <= maxDataUrlLength) {
        return result;
      }

      quality = Math.max(0.45, quality - 0.12);
      targetWidth = Math.max(240, Math.round(targetWidth * 0.8));
      targetHeight = Math.max(240, Math.round(targetHeight * 0.8));
    }

    if (result.length > maxDataUrlLength) {
      throw new Error('La imagen sigue siendo muy pesada. Prueba con otra foto más ligera.');
    }

    return result;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
