import { getFileById } from "@/actions/get-file-by-id";
import { AccessLogItem, VersionHistoryItem } from "@/types";
import BackButton from "./components/back-button";
import { ButtonTabsSection } from "./components/button-tabs-section";
import { FileHeader } from "./components/file-header";
import { FileActions } from "./components/file-actions";
import { FilePreview } from "./components/file-preview";
import { RestrictedAccess } from "./components/restricted-access";
import { notFound } from "next/navigation";

export default async function ResultDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (id === "401") {
    return <RestrictedAccess />;
  }
  const file = await getFileById(decodeURIComponent(id));

  if (!file) {
    return notFound();
  }

  const versionHistory: VersionHistoryItem[] = file.versionHistory || [];
  const accessLog: AccessLogItem[] = file.accessLog || [];

  return (
    <main className="mx-auto w-full max-w-7xl px-6 md:px-16 py-8 md:py-16">
      <BackButton />
      <div className="w-full flex flex-col lg:flex-row gap-8">
        <div className="w-full lg:max-w-3/5">
          <FileHeader file={file} />
          {file.filePath?.startsWith("https") && (
            <FileActions url={file.filePath} />
          )}
        </div>
        <div className="w-full hidden lg:flex lg:max-w-2/5">
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
