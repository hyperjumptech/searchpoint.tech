import FilterToggleGroup, { FilterItem } from "./filter-toggle-group";
import XLSXFileIcon from "@/components/icons/xlsx-file";
import DOCXFileIcon from "@/components/icons/docx-file";
import PPTXFileIcon from "@/components/icons/pptx-file";
import PDFFileIcon from "@/components/icons/pdf-file";

export type TFileFilter = {
  type: "pdf" | "pptx" | "docx" | "xlsx";
  count: number;
};

const typesLabels: Record<TFileFilter["type"], string> = {
  pdf: "PDF",
  pptx: "PPTX",
  docx: "DOCX",
  xlsx: "XLSX",
};

const renderIcon = (type: TFileFilter["type"]) => {
  switch (type) {
    case "pdf":
      return <PDFFileIcon />;
    case "pptx":
      return <PPTXFileIcon />;
    case "docx":
      return <DOCXFileIcon />;
    case "xlsx":
      return <XLSXFileIcon />;
  }
};

export default function FileFilter({ data }: { data: TFileFilter[] }) {
  const items: FilterItem<TFileFilter["type"]>[] = data.map((item) => ({
    value: item.type,
    count: item.count,
  }));

  return (
    <FilterToggleGroup
      items={items}
      labels={typesLabels}
      renderIcon={renderIcon}
    />
  );
}
