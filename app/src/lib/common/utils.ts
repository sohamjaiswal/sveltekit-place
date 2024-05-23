import ColorThief from 'colorthief';

export const isBrowser = new Function("try {return this===window;}catch(e){ return false;}");
export const isNode = new Function("try {return this===global;}catch(e){return false;}");

export const hexToRgb = (hex: string) => {
  hex = hex.replace(/^#/, '');
  const bigint = parseInt(hex, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return [r, g, b];
}

export function updateUniqueItem(array: unknown[], targetItem: unknown, updateFn: (item: unknown) => unknown): void {
  const index = array.findIndex(item => item === targetItem);

  if (index !== -1) {
    // Use the updateFn to modify the item
    array[index] = updateFn(array[index]);
  }
}

export type RGBColor = [number, number, number];

export async function getColorsFromImage(imageUrl: string, quality = 10, palette = 2): Promise<string[] | null> {
  if (isBrowser() && !isNode()) {
    try {
      const img = new Image();
  
      const loadImage = (url: string) => {
        return new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = (error) => reject(error);
          img.src = url;
          img.crossOrigin = "Anonymous";
        });
      };
  
      await loadImage(imageUrl);
  
      const colorThief = new ColorThief();
      const colors: RGBColor[] | null = colorThief.getPalette(img, palette, quality);
  
      if (!colors) {
        throw new Error("Failed to extract colors from the image.");
      }
  
      const hexadecimalColors = colors.map(rgbToHex);
  
      return hexadecimalColors;
    } catch (error) {
      console.error("Error:", error);
      return null;
    }
  }
  return null;
}

export function toTwoDigitHex(value: number): string {
  const hex = value.toString(16);
  return hex.length === 1 ? "0" + hex : hex;
}

export function rgbToHex(rgb: RGBColor): string {
  const [r, g, b] = rgb;
  return `#${toTwoDigitHex(r)}${toTwoDigitHex(g)}${toTwoDigitHex(b)}`;
}
