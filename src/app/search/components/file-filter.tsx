import { Toggle } from "@/components/ui/toggle";
import { FileIcon, FileTextIcon, FileTypeIcon, ImageIcon } from "lucide-react";

export type TSourcesFilter = {
  type: "all" | "office" | "pdf" | "images";
  count: number;
};

const typesLabels: Record<TSourcesFilter["type"], string> = {
  all: "All",
  office: "Microsoft Office",
  pdf: "PDF",
  images: "Images",
};

export default function FileFilter({ data }: { data: TSourcesFilter[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {data.map((item) => (
        <Toggle
          key={item.type}
          variant="outline"
          className="group flex flex-row items-center text-sm rounded-md text-muted-foreground cursor-pointer hover:text-black data-[state=on]:bg-red-600 data-[state=on]:text-white transition-all duration-300">
          <RenderIcon type={item.type} />
          {typesLabels[item.type]}
          <span className="text-xs">({item.count})</span>
        </Toggle>
      ))}
    </div>
  );
}

const RenderIcon = ({ type }: { type: TSourcesFilter["type"] }) => {
  switch (type) {
    case "all":
      return <FileIcon />;
    case "office":
      return <FileTypeIcon />;
    case "pdf":
      return <FileTextIcon />;
    case "images":
      return <ImageIcon />;
  }
};
