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
  _: NextRequest,
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
    const baseUrl = `${env.UPDATER_BASE_URL}/releases/v${LATEST_VERSION}`;
    const [darwinSig, windowsSig, linuxSig] = await Promise.all([
      fetch(`${baseUrl}/macos/${env.APP_NAME}.app.tar.gz.sig`).then((res) =>
        res.text(),
      ),
      fetch(
        `${baseUrl}/windows/${env.APP_NAME}_${LATEST_VERSION}_x64_en-US.msi.sig`,
      ).then((res) => res.text()),
      fetch(
        `${baseUrl}/linux/${env.APP_NAME}_${LATEST_VERSION}_amd64.deb.sig`,
      ).then((res) => res.text()),
    ]);

    const updateResponse: TauriUpdateResponse = {
      version: LATEST_VERSION,
      notes: RELEASE_NOTES.map((note: string) => `- ${note}`).join("\n"),
      pub_date: RELEASE_DATE,
      needReindex: NEED_REINDEX,
      platforms: {
        ["darwin-aarch64"]: {
          signature: darwinSig,
          url: `${baseUrl}/macos/${env.APP_NAME}.app.tar.gz`,
        },
        ["windows-x86_64"]: {
          signature: windowsSig,
          url: `${baseUrl}/windows/${env.APP_NAME}_${LATEST_VERSION}_x64_en-US.msi`,
        },
        ["linux-x86_64"]: {
          signature: linuxSig,
          url: `${baseUrl}/linux/${env.APP_NAME}_${LATEST_VERSION}_amd64.deb`,
        },
        ["macOS-download"]: {
          // this is a workaround to get the .dmg file instead of the .tar.gz
          signature: "",
          url: `${baseUrl}/macos/${env.APP_NAME}_${LATEST_VERSION}_aarch64.dmg`,
        },
      },
    };

    return NextResponse.json(updateResponse);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to check for updates: " + (error as Error).message },
      { status: 500 },
    );
  }
}
