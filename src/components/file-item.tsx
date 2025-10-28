import { FileSource } from "@/types/file";
import Image from "next/image";
import { formatTime } from "@/lib/format-time";
import { formatFileSize } from "@/lib/format-file";

export default function FileItem({ _source }: { _source: FileSource }) {
  const { path, owner_email, updated_at, size } = _source;
  const ext = _source?.name.split(".").pop()?.toLowerCase();

  const icon = (() => {
    let src = "/images/microsoft-office-icons/file.svg"; // default icon
    let alt = "file icon";

    switch (ext) {
      case "doc":
      case "docx":
      case "docm":
      case "word":
        src = "/images/microsoft-office-icons/word.svg";
        alt = "Word file";
        break;
      case "xls":
      case "xlsx":
      case "xlsm":
        src = "/images/microsoft-office-icons/excel.svg";
        alt = "Excel file";
        break;
      case "pdf":
        src = "/images/microsoft-office-icons/pdf.svg";
        alt = "PDF file";
        break;
      case "ppt":
      case "pptx":
      case "pptm":
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
            <span className="text-xs text-[#30302F] break-all">
              {owner_email}
            </span>
          </div>
          <div className="text-xs text-[#ACACAC] mt-1 break-all ">{path}</div>
        </div>
      </div>

      <div className="flex-1">
        <div className="text-[#005FB7] break-all hover:text-blue-800 font-bold text-xl">
          {_source?.name}
        </div>
        <div className="text-[#747474] mt-1 break-all">
          <span className="font-bold">{formatTime(updated_at)} </span>-{" "}
          {formatFileSize(size)}
        </div>
      </div>
    </div>
  );
}
