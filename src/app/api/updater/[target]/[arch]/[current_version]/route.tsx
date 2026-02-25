import { NextRequest, NextResponse } from "next/server";

interface TauriUpdateResponse {
  version: string;
  notes: string;
  pub_date: string;
  needReindex: boolean;
  platforms: {
    [key: string]: {
      signature: string;
      url: string;
    };
  };
}

// Update Configuration - Edit these values for new releases
const LATEST_VERSION = "0.12.1";
const RELEASE_DATE = "2026-02-25T00:00:00Z";
const NEED_REINDEX = false;
const RELEASE_NOTES = [
  "Cancel scanning and processing",
  "Fix invalidate date on update info",
  "Show file size info",
  "Fix handle masking result",
];

export async function GET(
  request: NextRequest,
  {
    params,
  }: {
    params: Promise<{ target: string; arch: string; current_version: string }>;
  },
) {
  try {
    const { current_version } = await params;

    // Check if there's a newer version available
    if (current_version === LATEST_VERSION) {
      return new NextResponse(null, { status: 204 });
    }

    // Fetch signatures from MinIO
    const baseUrl = `https://searchpoint-nss-1.nos.wjv-1.neo.id/releases/v${LATEST_VERSION}`;

    const [darwinSig, windowsSig, linuxSig] = await Promise.all([
      fetch(`${baseUrl}/macos/SearchPoint.app.tar.gz.sig`).then((res) =>
        res.text(),
      ),
      fetch(
        `${baseUrl}/windows/SearchPoint_${LATEST_VERSION}_x64_en-US.msi.sig`,
      ).then((res) => res.text()),
      fetch(
        `${baseUrl}/linux/SearchPoint_${LATEST_VERSION}_amd64.deb.sig`,
      ).then((res) => res.text()),
    ]);

    const updateResponse: TauriUpdateResponse = {
      version: LATEST_VERSION,
      notes: RELEASE_NOTES.map((note) => `- ${note}`).join("\n"),
      pub_date: RELEASE_DATE,
      needReindex: NEED_REINDEX,
      platforms: {
        ["darwin-aarch64"]: {
          signature: darwinSig,
          url: `${baseUrl}/macos/SearchPoint.app.tar.gz`,
        },
        ["windows-x86_64"]: {
          signature: windowsSig,
          url: `${baseUrl}/windows/SearchPoint_${LATEST_VERSION}_x64_en-US.msi`,
        },
        ["linux-x86_64"]: {
          signature: linuxSig,
          url: `${baseUrl}/linux/SearchPoint_${LATEST_VERSION}_amd64.deb`,
        },
        ["macOS-download"]: {
          // this is a workaround to get the .dmg file instead of the .tar.gz
          signature: "",
          url: `${baseUrl}/macos/SearchPoint_${LATEST_VERSION}_universal.dmg`,
        },
      },
    };

    return NextResponse.json(updateResponse);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to check for updates" + (error as Error).message },
      { status: 500 },
    );
  }
}
