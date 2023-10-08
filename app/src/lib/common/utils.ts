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