"use client";

import { AccessLogItem, TFile, VersionHistoryItem } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { useState } from "react";
import { FileIcon } from "lucide-react";

export function ButtonTabsSection({
  file,
}: {
  file: TFile;
  versionHistory?: VersionHistoryItem[];
  accessLog?: AccessLogItem[];
}) {
  const [activeTab, setActiveTab] = useState<
    "metadata" | "version" | "access" | "statistic"
  >("metadata");

  const tabs = [
    { id: "metadata" as const, label: "Metadata" },
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
                : "text-[#747474] cursor-pointer"
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
                  {file.fileExtension.toUpperCase()}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm text-gray-500">Size</span>
                <span className="font-medium">{file.fileSize}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm text-gray-500">Location</span>
                <span className="font-medium capitalize">
                  {file.fileSource}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm text-gray-500">Version</span>
                <span className="font-medium">{file.version}</span>
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

      {activeTab === "statistic" && (
        <Card>
          <CardHeader>
            <CardTitle>Sharing Permissions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-3 rounded-lg">
                <div className="h-10 w-10 bg-green-100 items-center justify-center rounded-full flex">
                  <FileIcon className="w-4 h-4 text-green-500" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-normal text-muted-foreground">
                    Can Access
                  </p>
                  <p className="text-sm font-medium">
                    {new Set(file.allowList).size} people
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </section>
  );
}
