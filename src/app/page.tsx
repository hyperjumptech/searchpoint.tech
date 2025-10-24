"use server";

import Navbar from "@/components/nav";
import Footer from "@/components/footer";
import SearchBar from "@/components/search/searchbar";
import FileItem from "@/components/file-item";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import fs from "fs";
import path from "path";
import { ApiResponse, FileSource } from "@/types/search";

export async function getFiles(): Promise<ApiResponse | null> {
  try {
    const filePath = path.join(process.cwd(), "public/data.json");
    const raw = fs.readFileSync(filePath, "utf-8");
    const json = JSON.parse(raw);
    return json;
  } catch (err) {
    console.error("Failed to get files:", err);
    return null;
  }
}

export default async function HomePage() {
  const data = await getFiles();

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-gray-500">
        <p>Failed to load files data.</p>
      </div>
    );
  }

  const { user, value } = data;
  const files: FileSource[] = value.map((item) => item._source);

  const publicCount =
    files.filter((file) =>
      file.keywords.some((kw) => kw.toLowerCase() === "public"),
    ).length || 0;

  const privateCount =
    files.filter((file) =>
      file.keywords.some((kw) => kw.toLowerCase() === "private"),
    ).length || 0;

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Navbar user={user} />
      <main className="flex flex-col items-center px-6 pt-28 pb-12">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-[#30302F] mb-5">
            Welcome, {user.name}!
          </h1>
          <p className="text-[#909090] font-normal max-w-3xl leading-relaxed">
            Search across both public resources and your organization&apos;s
            private files with enterprise-grade security and role-based access
            control.
          </p>
        </div>

        <SearchBar />

        <div className="w-full max-w-5xl">
          <Badge className="bg-[#EFF6FF] text-[#3593EA] text-sm py-2 px-5 whitespace-normal break-words text-center">
            Search results: Secure Search shows {publicCount} public +{" "}
            {privateCount} private results
          </Badge>

          <div className="space-y-4 mt-4">
            {files.length > 0 ? (
              files.map((file, idx) => (
                <div key={file.hash || idx}>
                  <FileItem {...file} />
                  {idx < files.length - 1 && <Separator />}
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center mt-6">No files found.</p>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
