import { env } from "@/lib/env";
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

    const metadata = await fetch(
      `${env.UPDATER_BASE_URL}/releases/metadata.json`,
    );
    const metadataResponse = await metadata.json();
    const { LATEST_VERSION, RELEASE_DATE, NEED_REINDEX, RELEASE_NOTES } =
      metadataResponse;

    // Check if there's a newer version available
    if (current_version === LATEST_VERSION) {
      return new NextResponse(null, { status: 204 });
    }

    // Fetch signatures from MinIO
    const stagingUrl = "https://searchpoint-nss-1.nos.wjv-1.neo.id";
    const updaterBaseUrl = env.UPDATER_BASE_URL || stagingUrl;
    const appName =
      updaterBaseUrl === stagingUrl ? "SearchPoint-Staging" : "SearchPoint";
    const baseUrl = `${updaterBaseUrl}/releases/v${LATEST_VERSION}`;

    const [darwinSig, windowsSig, linuxSig] = await Promise.all([
      fetch(`${baseUrl}/macos/${appName}.app.tar.gz.sig`).then((res) =>
        res.text(),
      ),
      fetch(
        `${baseUrl}/windows/${appName}_${LATEST_VERSION}_x64_en-US.msi.sig`,
      ).then((res) => res.text()),
      fetch(`${baseUrl}/linux/${appName}_${LATEST_VERSION}_amd64.deb.sig`).then(
        (res) => res.text(),
      ),
    ]);

    const updateResponse: TauriUpdateResponse = {
      version: LATEST_VERSION,
      notes: RELEASE_NOTES.map((note: string) => `- ${note}`).join("\n"),
      pub_date: RELEASE_DATE,
      needReindex: NEED_REINDEX,
      platforms: {
        ["darwin-aarch64"]: {
          signature: darwinSig,
          url: `${baseUrl}/macos/${appName}.app.tar.gz`,
        },
        ["windows-x86_64"]: {
          signature: windowsSig,
          url: `${baseUrl}/windows/${appName}_${LATEST_VERSION}_x64_en-US.msi`,
        },
        ["linux-x86_64"]: {
          signature: linuxSig,
          url: `${baseUrl}/linux/${appName}_${LATEST_VERSION}_amd64.deb`,
        },
        ["macOS-download"]: {
          // this is a workaround to get the .dmg file instead of the .tar.gz
          signature: "",
          url: `${baseUrl}/macos/${appName}_${LATEST_VERSION}_universal.dmg`,
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
