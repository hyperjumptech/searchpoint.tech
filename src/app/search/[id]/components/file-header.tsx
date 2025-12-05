import Image from "next/image";
import { TypographyP } from "@/components/typography";
import { TFile } from "@/types";
import { FilePreview } from "./file-preview";
import AccessBadge from "@/components/access/access-badge";

export function FileHeader({ file }: { file: TFile }) {
  return (
    <>
      <div className="flex items-center gap-3 mb-4">
        <div className="shrink-0 p-1.5 bg-muted rounded-full">
          {file.fileIcon && (
            <Image
              width={32}
              height={32}
              src={file.fileIcon}
              alt={`${file.fileName} icon`}
            />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-base md:text-xl truncate font-semibold">
              {file.ownerEmail}
            </p>
            <AccessBadge file={file} />
          </div>
        </div>
      </div>

      <h1 className="text-xl md:text-2xl font-bold mb-3 text-[#005FB7] wrap-break-word">
        {file.fileName}
      </h1>

      {file.fileSource !== "shared folder" && (
        <div className="flex lg:hidden">
          <FilePreview file={file} />
        </div>
      )}

      <TypographyP className="text-base md:text-lg text-muted-foreground mb-10 leading-relaxed wrap-break-word">
        <span className="font-bold">Updated {file.updatedTime}</span> -{" "}
        {file.filePath}
      </TypographyP>
    </>
  );
}
