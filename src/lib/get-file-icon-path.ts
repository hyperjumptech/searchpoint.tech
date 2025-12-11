export function getFileIconPath(extension: string) {
  // Normalize extension by removing dot prefix if present
  const normalizedExt = extension.startsWith(".")
    ? extension.slice(1).toLowerCase()
    : extension.toLowerCase();

  switch (normalizedExt) {
    case "doc":
    case "docx":
    case "docm":
      return "/images/file-icons/ms-word.svg";
    case "xls":
    case "xlsx":
    case "xlsm":
      return "/images/file-icons/ms-excel.svg";
    case "pdf":
      return "/images/file-icons/pdf.svg";
    case "ppt":
    case "pptx":
    case "pptm":
      return "/images/file-icons/ms-powerpoint.svg";
    case "jpg":
    case "jpeg":
    case "png":
    case "webp":
    case "gif":
      return "/images/file-icons/image.png";
    default:
      return "/images/file-icons/default.svg";
  }
}
