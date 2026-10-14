const MAX_DIM = 800;
const JPEG_QUALITY = 0.7;

/** Downscale to 800px and re-encode as JPEG, returned as a data URL small enough to live in a Firestore document. */
export function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > MAX_DIM || height > MAX_DIM) {
          const ratio = Math.min(MAX_DIM / width, MAX_DIM / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) { reject(new Error('Canvas context unavailable')); return; }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', JPEG_QUALITY));
      };
      img.onerror = reject;
      img.src = reader.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

const MAX_DOC_CHARS = 900_000; // Firestore documents cap at 1 MiB; leave room for the other fields

/** True when these data-URL images fit in one product document. */
export function fitsInDoc(images: string[]): boolean {
  return images.reduce((sum, s) => sum + s.length, 0) < MAX_DOC_CHARS;
}
