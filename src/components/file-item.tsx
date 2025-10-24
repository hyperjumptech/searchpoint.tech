import { Badge } from "./ui/badge";
import Link from "next/link";
import { FileSource } from "@/types/search";
import Image from "next/image";

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 bytes";
  const sizes = ["bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const value = bytes / Math.pow(1024, i);
  return `${value.toFixed(value < 10 && i > 0 ? 1 : 0)} ${sizes[i]}`;
}

export default function FileItem({
  name,
  path,
  owner_email,
  updated_at,
  size,
  keywords,
}: FileSource) {
  const ext = name.split(".").pop()?.toLowerCase();
  const visibility = keywords?.includes("private") ? "private" : "public";

  const icon = (() => {
    let src = "/images/microsoft-office-icons/file.svg"; // default icon
    let alt = "file icon";

    switch (ext) {
      case "doc":
      case "docx":
      case "docm": // macro-enabled Word
      case "word":
        src = "/images/microsoft-office-icons/word.svg";
        alt = "Word file";
        break;
      case "xls":
      case "xlsx":
      case "xlsm": // macro-enabled Excel
        src = "/images/microsoft-office-icons/excel.svg";
        alt = "Excel file";
        break;
      case "pdf":
        src = "/images/microsoft-office-icons/pdf.svg";
        alt = "PDF file";
        break;
      case "ppt":
      case "pptx":
      case "pptm": // macro-enabled PowerPoint
        src = "/images/microsoft-office-icons/ppt.svg";
        alt = "PowerPoint file";
        break;
      case "txt":
        src = "/images/microsoft-office-icons/file.svg";
        alt = "Text file";
        break;
      default:
        src = "/images/microsoft-office-icons/file.svg";
        alt = "Unknown file";
    }

    return (
      <Image
        src={src}
        alt={alt}
        width={20}
        height={20}
        className="inline-block"
      />
    );
  })();

  return (
    <div className="flex items-start flex-col py-4 space-y-4">
      <div className="flex space-x-3 flex-row">
        <div className="w-6 h-6 bg-[#F9F9F9] rounded flex items-center justify-center flex-shrink-0 mt-1">
          {icon}
        </div>
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-xs text-[#30302F]">{owner_email}</span>
            <Badge variant="secondary">{visibility}</Badge>
          </div>
          <div className="text-xs text-[#ACACAC] mt-1">{path}</div>
        </div>
      </div>

      <div className="flex-1">
        <Link
          href="#"
          className="text-[#005FB7] cursor-pointer hover:text-blue-800 font-bold text-xl"
        >
          {name}
        </Link>
        <div className="text-[#747474] mt-1">
          <span className="font-bold">
            updated {new Date(updated_at).toLocaleString()} —{" "}
          </span>{" "}
          {formatFileSize(size)}
        </div>
      </div>
    </div>
  );
}
