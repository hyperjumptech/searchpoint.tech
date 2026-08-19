import { Company, companyFromHostname, getCompanyAppName } from "@/lib/company";
import { env } from "@/lib/env";
import { applyPublicApiRateLimit, limiterForScope } from "@/lib/rate-limit";
import { NextRequest, NextResponse } from "next/server";

interface TauriPlatformUpdate {
  signature: string;
  url: string;
}

interface TauriUpdateResponse {
  version: string;
  notes: string;
  pub_date: string;
  needReindex: boolean;
  platforms: Record<string, TauriPlatformUpdate>;
}

interface ReleaseMetadata {
  LATEST_VERSION: string;
  RELEASE_DATE: string;
  NEED_REINDEX: boolean;
  RELEASE_NOTES: string[];
}

function resolveCompany(request: NextRequest): Company {
  const queryCompany = request.nextUrl.searchParams.get("company");
  if (
    queryCompany === "smdv" ||
    queryCompany === "sinarmas" ||
    queryCompany === "hyperjump"
  ) {
    return queryCompany;
  }

  // Fall back to the hostname when ?company= is not provided (e.g. direct API calls
  // or default updater config). x-forwarded-host first: sites sit behind a proxy.
  const host = request.headers.get("x-forwarded-host") ?? request.nextUrl.host;
  return companyFromHostname(host);
}

async function fetchSignature(assetUrl: string): Promise<string> {
  const res = await fetch(`${assetUrl}.sig`);
  return res.text();
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
    const company = resolveCompany(request);

    // hyperjump ships from main -> metadata-internal.json
    // smdv and sinarmas ship from tags -> metadata.json
    const metadataFile =
      company === "hyperjump" ? "metadata-internal.json" : "metadata.json";

    const metadataRes = await fetch(
      `${env.UPDATER_BASE_URL}/releases/${metadataFile}`,
    );
    const {
      LATEST_VERSION,
      RELEASE_DATE,
      NEED_REINDEX,
      RELEASE_NOTES,
    }: ReleaseMetadata = await metadataRes.json();

    // Check if there's a newer version available
    if (current_version === LATEST_VERSION) {
      return new NextResponse(null, { status: 204 });
    }

    const baseUrl = `${env.UPDATER_BASE_URL}/releases/v${LATEST_VERSION}`;
    const appName = getCompanyAppName(company, env.APP_NAME);

    const macosAssetUrl = `${baseUrl}/macos/${appName}.app.tar.gz`;
    const windowsAssetUrl = `${baseUrl}/windows/${appName}_${LATEST_VERSION}_x64_en-US.msi`;
    const linuxAssetUrl = `${baseUrl}/linux/${appName}_${LATEST_VERSION}_amd64.deb`;
    const macosDmgUrl = `${baseUrl}/macos/${appName}_${LATEST_VERSION}_aarch64.dmg`;

    const [darwinSig, windowsSig, linuxSig] = await Promise.all([
      fetchSignature(macosAssetUrl),
      fetchSignature(windowsAssetUrl),
      fetchSignature(linuxAssetUrl),
    ]);

    const updateResponse: TauriUpdateResponse = {
      version: LATEST_VERSION,
      notes: RELEASE_NOTES.map((note) => `- ${note}`).join("\n"),
      pub_date: RELEASE_DATE,
      needReindex: NEED_REINDEX,
      platforms: {
        "darwin-aarch64": {
          signature: darwinSig,
          url: macosAssetUrl,
        },
        "windows-x86_64": {
          signature: windowsSig,
          url: windowsAssetUrl,
        },
        "linux-x86_64": {
          signature: linuxSig,
          url: linuxAssetUrl,
        },
        "macOS-download": {
          // Workaround to get the .dmg file instead of the .tar.gz
          signature: "",
          url: macosDmgUrl,
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
