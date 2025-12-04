import { getFileById } from "@/actions/get-file-by-id";
import NotFound from "../not-found";
import { AccessLogItem, VersionHistoryItem } from "@/types";
import BackButton from "./components/back-button";
import { ButtonTabsSection } from "./components/button-tabs-section";
import { FileHeader } from "./components/file-header";
import { FileActions } from "./components/file-actions";
import { FilePreview } from "./components/file-preview";

export default async function ResultDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const file = await getFileById(id);

  if (!file) {
    return <NotFound />;
  }

  const versionHistory: VersionHistoryItem[] = file.versionHistory || [];
  const accessLog: AccessLogItem[] = file.accessLog || [];

  return (
    <main className="mx-auto w-full max-w-7xl px-6 md:px-16 py-8 md:py-16">
      <BackButton />
      <div className="w-full flex flex-col lg:flex-row gap-8 xl:gap-32">
        <div className="w-full lg:max-w-1/2">
          <FileHeader file={file} />
          {file.filePath?.startsWith("https") && (
            <FileActions url={file.filePath} />
          )}
        </div>
        <div className="w-full hidden lg:flex lg:max-w-1/2">
          {file.fileSource !== "shared folder" && (
            <div className="w-full h-full">
              <FilePreview file={file} />
            </div>
          )}
        </div>
      </div>

      <ButtonTabsSection
        file={file}
        versionHistory={versionHistory}
        accessLog={accessLog}
      />
    </main>
  );
}
