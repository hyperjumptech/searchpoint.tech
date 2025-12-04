import { Eye } from "lucide-react";
import { TFile } from "@/types";

const imageExtensions = [
  "jpg",
  "jpeg",
  "png",
  "gif",
  "webp",
  "avif",
  "heic",
  "bmp",
  "tiff",
  "tif",
  "svg",
  "ico",
  "psd",
  "raw",
  "cr2",
  "nef",
  "arw",
  "eps",
];

const videoExtensions = ["mp4", "mov", "avi", "mkv", "webm", "flv", "wmv"];

export function FilePreview({ file }: { file: TFile }) {
  const fileExt = file.fileExtension.toLowerCase();
  const isImage = imageExtensions.includes(fileExt);
  const isVideo = videoExtensions.includes(fileExt);

  if (!isImage && !isVideo) {
    return null;
  }

  return (
    <div className="block w-full h-max bg-muted border rounded-lg p-4 mb-10 lg:mb-0">
      {isImage ? (
        <ImagePreview file={file} />
      ) : isVideo ? (
        <VideoPreview file={file} />
      ) : null}
    </div>
  );
}

const VideoPreview = ({ file }: { file: TFile }) => {
  return (
    <video
      src={file.filePath}
      controls
      width={100}
      height={100}
      className="w-full h-auto object-cover aspect-video rounded-md"
    />
  );
};

const ImagePreview = ({ file }: { file: TFile }) => {
  return (
    // Need to use native image because Next.js Image component cannot request to SharePoint images
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={file.filePath}
      alt={file.fileName}
      width={100}
      height={100}
      className="w-full h-auto object-cover aspect-video rounded-md"
    />
  );
};

const PreviewUnavailable = () => {
  return (
    <div className="text-center text-sm text-muted-foreground">
      <Eye className="mx-auto mb-2 h-6 w-6 opacity-50" />
      <p>Preview Unavailable</p>
    </div>
  );
};
