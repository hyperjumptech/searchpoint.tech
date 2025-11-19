"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { performSearch, FileDetail } from "@/actions/search";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import BackButton from "@/components/back-button";
import { TypographyP } from "@/components/typography";
import { Button } from "@/components/ui/button";
import { CircleAlert, Eye, SquareArrowOutUpRight } from "lucide-react";
import Loading from "./loading";
import dataJson from "../../../data/data.json";
import { formatTimeAgo } from "@/lib/format-time-ago";

type VersionHistoryItem = {
  version: string;
  date: string;
  description: string;
};

type AccessLogItem = {
  user: string;
  type: string;
  date: string;
};

export default function DocumentDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const [file, setFile] = useState<FileDetail | null>(null);

  useEffect(() => {
    async function load() {
      const results = await performSearch(params.id);
      setFile(results[0] ?? null);
    }
    load();
  }, [params.id]);

  if (!file) return <Loading />;

  const versionHistory: VersionHistoryItem[] = dataJson.versionHistory || [];
  const accessLog: AccessLogItem[] = dataJson.accessLog || [];

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <BackButton />
      <div className="flex flex-col lg:flex-row justify-between gap-6 mb-10">
        <div className="flex-1 min-w-0">
          <FileHeader file={file} />
        </div>
        <PreviewPlaceholder />
      </div>

      <ButtonTabsSection
        file={file}
        versionHistory={versionHistory}
        accessLog={accessLog}
      />
    </main>
  );
}

function FileHeader({ file }: { file: FileDetail }) {
  return (
    <>
      <div className="flex items-center gap-3 mb-4">
        <div className="shrink-0 p-1.5 bg-muted rounded-full">
          <Image
            width={32}
            height={32}
            src={file.fileIcon}
            alt={`${file.fileName} icon`}
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-base md:text-xl truncate font-semibold">
              {file.ownerEmail}
            </p>
            <Badge variant="outline" className="text-xs shrink-0">
              Public
            </Badge>
          </div>
        </div>
      </div>

      <h1 className="text-2xl md:text-3xl font-bold mb-3 text-[#005FB7] break-words">
        {file.fileName}
      </h1>

      <TypographyP className="text-base md:text-xl text-muted-foreground mb-10 leading-relaxed">
        <span className="font-bold">Updated {file.updatedTime}</span> -{" "}
        {file.filePath}
      </TypographyP>
    </>
  );
}

function FileActions() {
  return (
    <div className="flex flex-col gap-4 mb-6">
      <Button
        size="lg"
        variant="outline"
        className="rounded-full font-bold w-fit">
        <SquareArrowOutUpRight /> Open in Google
      </Button>
      <TypographyP className="text-muted-foreground max-w-md flex items-center gap-2">
        <CircleAlert className="w-4 h-4 shrink-0" /> For privacy and security
        reasons, we can’t open this file for you. Please access it directly in
        OneDrive.
      </TypographyP>
    </div>
  );
}

function PreviewPlaceholder() {
  return (
    <div className="flex justify-center items-center w-full lg:w-[400px] h-[200px] lg:h-[300px] bg-muted border rounded-lg shrink-0 mb-10 lg:mb-0">
      <div className="text-center text-sm text-muted-foreground">
        <Eye className="mx-auto mb-2 h-6 w-6 opacity-50" />
        <p>Preview Unavailable</p>
      </div>
    </div>
  );
}

function ButtonTabsSection({
  file,
  versionHistory,
  accessLog,
}: {
  file: FileDetail;
  versionHistory: VersionHistoryItem[];
  accessLog: AccessLogItem[];
}) {
  const [activeTab, setActiveTab] = useState<
    "metadata" | "version" | "access" | "statistic"
  >("metadata");

  const tabs = [
    { id: "metadata" as const, label: "Metadata" },
    { id: "version" as const, label: "Version History" },
    { id: "access" as const, label: "Access Log" },
    { id: "statistic" as const, label: "Statistic" },
  ];

  return (
    <section>
      <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar">
        {tabs.map((tab) => (
          <Button
            key={tab.id}
            variant={activeTab === tab.id ? "default" : "outline"}
            size="sm"
            className={
              activeTab === tab.id
                ? "bg-[#30302F] hover:bg-gray-600"
                : "text-[#747474]"
            }
            onClick={() => setActiveTab(tab.id)}>
            {tab.label}
          </Button>
        ))}
      </div>

      {activeTab === "metadata" && (
        <Card>
          <CardHeader>
            <CardTitle>Document Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex flex-col">
                <span className="text-sm text-gray-500">File Type</span>
                <span className="font-medium">
                  {file.fileName?.split(".").pop()?.toUpperCase()}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm text-gray-500">Size</span>
                <span className="font-medium">{file.fileSize}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm text-gray-500">Location</span>
                <span className="font-medium">Local</span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm text-gray-500">Version</span>
                <span className="font-medium">1.0</span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm text-gray-500">Language</span>
                <span className="font-medium">English</span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm text-gray-500">Slides/Sheets</span>
                <span className="font-medium">Multiple pages</span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm text-gray-500">Created</span>
                <span className="font-medium">{file.createdTime}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm text-gray-500">Updated</span>
                <span className="font-medium">{file.updatedTime}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === "version" && (
        <Card>
          <CardHeader>
            <CardTitle>Version History</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="relative border-[#58A6FF]">
              {versionHistory.map((v, i) => (
                <li key={i} className="mb-6 relative">
                  <div className="ml-2">
                    <div className="flex items-center gap-2 mb-1">
                      {i === 0 && (
                        <span className="px-2 py-0.5 text-xs font-medium text-blue-300 bg-[#30302F] rounded">
                          {v.version}
                        </span>
                      )}
                      {i === versionHistory.length - 1 && (
                        <span className="px-2 py-0.5 text-xs font-medium text-white bg-[#30302F] rounded">
                          Initial
                        </span>
                      )}
                      <span className="text-sm text-gray-500">
                        {formatTimeAgo(v.date)}
                      </span>
                    </div>
                    <p className="text-sm">{v.description}</p>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {activeTab === "access" && (
        <Card>
          <CardHeader>
            <CardTitle>Access Log</CardTitle>
          </CardHeader>
          <CardContent>
            {accessLog.length > 0 ? (
              <ul className="space-y-4">
                {accessLog.map((a, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <Avatar className="h-10 w-10 shrink-0">
                      <AvatarFallback>{a.user[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm">
                        <strong>{a.user}</strong> {a.type}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatTimeAgo(a.date)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No access log available</p>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === "statistic" && (
        <Card>
          <CardHeader>
            <CardTitle>Sharing Permissions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-3 rounded-lg">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="text-xs">PU</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="text-sm font-semibold">Public</p>
                  <p className="text-xs text-muted-foreground">
                    130 people (Employee, Staff, & Manager)
                  </p>
                </div>
                <Badge variant="outline" className="shrink-0">
                  View
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </section>
  );
}
