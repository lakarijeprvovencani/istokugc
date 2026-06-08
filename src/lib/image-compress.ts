/**
 * Klijentska kompresija slike pre uploada.
 * Downscale na max dimenziju + JPEG kompresija -> manji fajl, manji storage trošak,
 * brže učitavanje. Ako bilo šta krene po zlu, vraća originalni fajl (bezbedan fallback).
 */
const MAX_DIMENSION = 1600;
const QUALITY = 0.82;

export async function compressImage(file: File): Promise<File> {
  // Kompresuj samo prave rasterske slike; GIF (animacija) i ne-slike ostavi
  if (!file.type.startsWith('image/') || file.type === 'image/gif') {
    return file;
  }

  try {
    const dataUrl: string = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = dataUrl;
    });

    let { width, height } = img;
    const longest = Math.max(width, height);
    if (longest > MAX_DIMENSION) {
      const scale = MAX_DIMENSION / longest;
      width = Math.round(width * scale);
      height = Math.round(height * scale);
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    ctx.drawImage(img, 0, 0, width, height);

    const blob: Blob | null = await new Promise((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', QUALITY)
    );
    if (!blob || blob.size >= file.size) {
      // Ako kompresija nije pomogla, zadrži original
      return file;
    }

    const newName = file.name.replace(/\.[^.]+$/, '') + '.jpg';
    return new File([blob], newName, { type: 'image/jpeg' });
  } catch {
    return file;
  }
}
