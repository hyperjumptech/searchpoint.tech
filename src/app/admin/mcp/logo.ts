function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read the image."));
    };
    img.src = url;
  });
}

export async function fileToPng32DataUrl(file: File): Promise<string> {
  const bitmap =
    typeof createImageBitmap === "function"
      ? await createImageBitmap(file)
      : null;
  const canvas = document.createElement("canvas");
  canvas.width = 32;
  canvas.height = 32;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not read the image.");
  if (bitmap) {
    ctx.drawImage(bitmap, 0, 0, 32, 32);
    bitmap.close();
  } else {
    const img = await loadImageFromFile(file);
    ctx.drawImage(img, 0, 0, 32, 32);
  }
  return canvas.toDataURL("image/png");
}
