export function formatFileSize(bytes: number) {
  if (bytes === 0) return "0 bytes";

  const units = ["bytes", "KB", "MB", "GB", "TB"];
  const unitIndex = Math.floor(Math.log(bytes) / Math.log(1024));
  const sizeInUnit = bytes / Math.pow(1024, unitIndex);

  const displayValue = sizeInUnit.toFixed(
    sizeInUnit < 10 && unitIndex > 0 ? 1 : 0
  );

  const unitLabel = units[unitIndex];

  return `${displayValue} ${unitLabel}`;
}
