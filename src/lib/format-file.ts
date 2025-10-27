export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 bytes";
  const sizes = ["bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const value = bytes / Math.pow(1024, i);
  return `${value.toFixed(value < 10 && i > 0 ? 1 : 0)} ${sizes[i]}`;
}
