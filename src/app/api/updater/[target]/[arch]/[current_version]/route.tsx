import { NextRequest, NextResponse } from "next/server";

interface TauriUpdateResponse {
  version: string;
  notes: string;
  pub_date: string;
  platforms: {
    [key: string]: {
      signature: string;
      url: string;
    };
  };
}

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
    const latestVersion = "0.4.3";

    if (current_version === latestVersion) {
      return new NextResponse(null, { status: 204 });
    }

    // Fetch signatures from MinIO
    const baseUrl = `https://storage.scse.hyperjump.tech/scse/releases/v${latestVersion}`;

    const [darwinSig, windowsSig, linuxSig] = await Promise.all([
      fetch(`${baseUrl}/macos/SearchPoint.app.tar.gz.sig`).then((res) =>
        res.text(),
      ),
      fetch(
        `${baseUrl}/windows/SearchPoint_${latestVersion}_x64_en-US.msi.sig`,
      ).then((res) => res.text()),
      fetch(
        `${baseUrl}/linux/SearchPoint_${latestVersion}_amd64.AppImage.sig`,
      ).then((res) => res.text()),
    ]);

    const updateResponse: TauriUpdateResponse = {
      version: latestVersion,
      notes: "Improvements and bug fixes.",
      pub_date: new Date().toISOString(),
      platforms: {
        ["darwin-aarch64"]: {
          signature: darwinSig,
          url: `${baseUrl}/macos/SearchPoint.app.tar.gz`,
        },
        ["windows-x86_64"]: {
          signature: windowsSig,
          url: `${baseUrl}/windows/SearchPoint_${latestVersion}_x64_en-US.msi`,
        },
        ["linux-x86_64"]: {
          signature: linuxSig,
          url: `${baseUrl}/linux/SearchPoint_${latestVersion}_amd64.AppImage`,
        },
        ["macOS-download"]: {
          // this is a workaround to get the .dmg file instead of the .tar.gz
          signature: "",
          url: `${baseUrl}/macos/SearchPoint_${latestVersion}_universal.dmg`,
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
