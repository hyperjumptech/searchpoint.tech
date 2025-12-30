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
    const latestVersion = "0.4.1";

    if (current_version === latestVersion) {
      return new NextResponse(null, { status: 204 });
    }

    const updateResponse: TauriUpdateResponse = {
      version: latestVersion,
      notes: "Image tab infinite scroll and Pagination",
      pub_date: new Date().toISOString(),
      platforms: {
        ["darwin-aarch64"]: {
          signature:
            "dW50cnVzdGVkIGNvbW1lbnQ6IHNpZ25hdHVyZSBmcm9tIHRhdXJpIHNlY3JldCBrZXkKUlVRbTVWc2hHZjB5UXhKaklMS0tXYmVvQnhKME1kR3FTWEU3ZG9xLzY0MFp2T1R0OHNGTk84U2RwZ0pqYm5wSVhwYlRpems1S3BsMTkrbFprZnVRS3BwYUxqRTg0ZnYyNmdvPQp0cnVzdGVkIGNvbW1lbnQ6IHRpbWVzdGFtcDoxNzY3MDQ2MTM3CWZpbGU6U2VhcmNoUG9pbnQuYXBwLnRhci5nego4YjM3SVV3QkFJd2JEWE1kMGdQaTZzVjFHdHFRaWlnN3J3dlpQblQxRFc0WnpqTktkZ3NxVldaT3Zoc0Rsc1hYcUN1WFQyWkU5dXkvK1VpaFB4d2hBdz09Cg==",
          url: `https://storage.scse.hyperjump.tech/scse/releases/v${latestVersion}/macos/SearchPoint.app.tar.gz`,
        },
        ["windows-x86_64"]: {
          signature:
            "dW50cnVzdGVkIGNvbW1lbnQ6IHNpZ25hdHVyZSBmcm9tIHRhdXJpIHNlY3JldCBrZXkKUlVRbTVWc2hHZjB5UTM2azNWcnZ5U3hLeXlRMmM3UnA3YkRoZFVoUkh2bWV0Rlo2MnpEamVOb1Q1MXhYaThQSTZOcTdkOGNvQm5WcXhZcFpXYVZmNGdTeUEwUE9YVlExdmc4PQp0cnVzdGVkIGNvbW1lbnQ6IHRpbWVzdGFtcDoxNzY3MDQ1NjQxCWZpbGU6U2VhcmNoUG9pbnRfMC40LjFfeDY0X2VuLVVTLm1zaQppZUxEbjRteXVSSXVMVXlHaU5NZUYzVmpkZnl5MVBzSlR4OVduYVNza3hhM1FiYU4rRlZFWTcrSkhjQ3JySjYyME5wOVZ4ZEJjOFdsNDkreFVvL1NDQT09Cg==",
          url: `https://storage.scse.hyperjump.tech/scse/releases/v${latestVersion}/windows/SearchPoint_${latestVersion}_x64_en-US.msi`,
        },
        ["linux-x86_64"]: {
          signature:
            "dW50cnVzdGVkIGNvbW1lbnQ6IHNpZ25hdHVyZSBmcm9tIHRhdXJpIHNlY3JldCBrZXkKUlVRbTVWc2hHZjB5UXd0dGdEZGRoNXBrSWV5T0FieExLOXoxWUhma1lJMzlGUGZES3FKVWY2dVRRdk8yVkJaODhqSnE3Zi95NHdBTUdiQko1TDBDbm0wNFBKaEZIaVhMZmdnPQp0cnVzdGVkIGNvbW1lbnQ6IHRpbWVzdGFtcDoxNzY3MDQ2Njc3CWZpbGU6U2VhcmNoUG9pbnRfMC40LjFfYW1kNjQuQXBwSW1hZ2UKeDlQdm5XSXc5cVBodXgwNUtaSVA1UHJEZW4wQi9KTTBxWmd4MG8veml5eERPWllTdS9XdlZWaFNwTjZpeTB0MHlScjRYRjlhdmJpMDFuOHdzWGM0QXc9PQo=",
          url: `https://storage.scse.hyperjump.tech/scse/releases/v${latestVersion}/linux/SearchPoint_${latestVersion}_amd64.AppImage`,
        },
        ["macOS-download"]: {
          // this is a workaround to get the .dmg file instead of the .tar.gz
          signature: "",
          url: `https://storage.scse.hyperjump.tech/scse/releases/v${latestVersion}/macos/SearchPoint_${latestVersion}_universal.dmg`,
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
