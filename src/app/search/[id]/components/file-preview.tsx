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

export function FilePreview({
  file,
  aspectRatio,
}: {
  file: TFile;
  aspectRatio?: string;
}) {
  const fileExt = file.fileExtension.toLowerCase();
  const isImage = imageExtensions.includes(fileExt);
  const isVideo = videoExtensions.includes(fileExt);

  return (
    <div className="w-full h-full">
      {isImage && <ImagePreview file={file} aspectRatio={aspectRatio} />}
      {isVideo && <VideoPreview file={file} aspectRatio={aspectRatio} />}
    </div>
  );
}

const VideoPreview = ({
  file,
  aspectRatio,
}: {
  file: TFile;
  aspectRatio?: string;
}) => {
  return (
    <video
      src={file.filePath}
      controls
      width={100}
      height={100}
      className={`w-full h-auto object-cover ${aspectRatio} rounded-md`}
    />
  );
};

const ImagePreview = ({
  file,
  aspectRatio = "aspect-square",
}: {
  file: TFile;
  aspectRatio?: string;
}) => {
  return (
    // Need to use native image because Next.js Image component cannot request to SharePoint images
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={file.filePath}
      alt={file.fileName}
      width={100}
      height={100}
      className={`w-full h-auto object-contain ${aspectRatio} rounded-md bg-gray-200`}
    />
  );
};
