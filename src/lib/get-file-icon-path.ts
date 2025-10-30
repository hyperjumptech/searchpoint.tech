export function getFileIconPath(extension: string) {
  switch (extension) {
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
    default:
      return "/images/file-icons/default.svg";
  }
}
