import { env } from "@/lib/env";
import { applyPublicApiRateLimit, limiterForScope } from "@/lib/rate-limit";
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
  const rateLimited = await applyPublicApiRateLimit(
    request,
    limiterForScope("updater"),
  );
  if (rateLimited) {
    return rateLimited;
  }

  try {
    const { current_version } = await params;

    // A request with no ?company= is either a first-time download from the
    // website or an app built before COMPANY existed. Defaulting to hyperjump
    // hands SMDV users the wrong build, so fall back to the host that was
    // actually asked. x-forwarded-host first: both sites sit behind a proxy.
    const host =
      request.headers.get("x-forwarded-host") ?? request.nextUrl.host ?? "";
    const hostname = host.toLowerCase().split(":")[0];
    const company =
      request.nextUrl.searchParams.get("company") ||
      (hostname === "smdv.com" || hostname.endsWith(".smdv.com")
        ? "smdv"
        : "hyperjump");

    // hyperjump ships from main -> metadata-internal.json
    // smdv      ships from tags -> metadata.json
    const metadataFile =
      company === "smdv" ? "metadata.json" : "metadata-internal.json";

    const metadata = await fetch(
      `${env.UPDATER_BASE_URL}/releases/${metadataFile}`,
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
    const macosFolder = company === "smdv" ? "macos" : `macos-${company}`;
    const windowsFolder = company === "smdv" ? "windows" : `windows-${company}`;
    const linuxFolder = company === "smdv" ? "linux" : `linux-${company}`;

    const [darwinSig, windowsSig, linuxSig] = await Promise.all([
      fetch(`${baseUrl}/${macosFolder}/${env.APP_NAME}.app.tar.gz.sig`).then(
        (res) => res.text(),
      ),
      fetch(
        `${baseUrl}/${windowsFolder}/${env.APP_NAME}_${LATEST_VERSION}_x64_en-US.msi.sig`,
      ).then((res) => res.text()),
      fetch(
        `${baseUrl}/${linuxFolder}/${env.APP_NAME}_${LATEST_VERSION}_amd64.deb.sig`,
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
          url: `${baseUrl}/${macosFolder}/${env.APP_NAME}.app.tar.gz`,
        },
        ["windows-x86_64"]: {
          signature: windowsSig,
          url: `${baseUrl}/${windowsFolder}/${env.APP_NAME}_${LATEST_VERSION}_x64_en-US.msi`,
        },
        ["linux-x86_64"]: {
          signature: linuxSig,
          url: `${baseUrl}/${linuxFolder}/${env.APP_NAME}_${LATEST_VERSION}_amd64.deb`,
        },
        ["macOS-download"]: {
          // this is a workaround to get the .dmg file instead of the .tar.gz
          signature: "",
          url: `${baseUrl}/${macosFolder}/${env.APP_NAME}_${LATEST_VERSION}_aarch64.dmg`,
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
