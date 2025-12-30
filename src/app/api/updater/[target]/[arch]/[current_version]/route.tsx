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
    const latestVersion = "0.4.2";

    if (current_version === latestVersion) {
      return new NextResponse(null, { status: 204 });
    }

    const updateResponse: TauriUpdateResponse = {
      version: latestVersion,
      notes: "Tab Others with icon, Onboarding Page, and Removing License",
      pub_date: new Date().toISOString(),
      platforms: {
        ["darwin-aarch64"]: {
          signature:
            "dW50cnVzdGVkIGNvbW1lbnQ6IHNpZ25hdHVyZSBmcm9tIHRhdXJpIHNlY3JldCBrZXkKUlVRbTVWc2hHZjB5UTROMzg3aWUwaTFrb1dGQzFMVW5PeDJ0dVBJSXV2dmsyNHBMMFhOY0tmVHQ0YjZLT2JzZFJlVmhtdnBkZ3lRcXA1aUU3WEZsOHAwKzNUZ0l4YXZDa0FrPQp0cnVzdGVkIGNvbW1lbnQ6IHRpbWVzdGFtcDoxNzY3MDkwMjk0CWZpbGU6U2VhcmNoUG9pbnQuYXBwLnRhci5negpaMmpyejRPdzVZWXhIUFUvZ2VnK0VxY0FRd29CamFFNmxTUDQwRkRoeW1ualY1MEpBS1U2LzErMzFrR3pxclBZK2ZIb3NJQmFaOGVRVVBwSEUwMktBUT09Cg==",
          url: `https://storage.scse.hyperjump.tech/scse/releases/v${latestVersion}/macos/SearchPoint.app.tar.gz`,
        },
        ["windows-x86_64"]: {
          signature:
            "dW50cnVzdGVkIGNvbW1lbnQ6IHNpZ25hdHVyZSBmcm9tIHRhdXJpIHNlY3JldCBrZXkKUlVRbTVWc2hHZjB5UXpwd1BDRGVRYWtlQnBhK3VDN0JxVzNXTkNIdGszd3NNaFlJbEQyOGkzQzF4YlBEdE0rWXpEY1NkMFBESVM5TW9mU2c0dTRjekxFOVJWTlRySnRlQUFNPQp0cnVzdGVkIGNvbW1lbnQ6IHRpbWVzdGFtcDoxNzY3MDkxMzQ2CWZpbGU6U2VhcmNoUG9pbnRfMC40LjJfeDY0X2VuLVVTLm1zaQpGdFZvQWZNcXQwL2pxNHhoUUE0cERNYUJKc0pJaVhTQkgwSGNmc1d5Z0tMRkhEWGxvcTY4TnJRZkJYUjFnckZ1NTVlSlVhTmw2aFZnZ3NNWWdhT1pCZz09Cg==",
          url: `https://storage.scse.hyperjump.tech/scse/releases/v${latestVersion}/windows/SearchPoint_${latestVersion}_x64_en-US.msi`,
        },
        ["linux-x86_64"]: {
          signature:
            "dW50cnVzdGVkIGNvbW1lbnQ6IHNpZ25hdHVyZSBmcm9tIHRhdXJpIHNlY3JldCBrZXkKUlVRbTVWc2hHZjB5UXhLaXk3azN1ZFp1bHNzdERHRy9uZDV6MG11YnJISEFwUnZJRlBsZTFzWmtweWdVNUt2RHkwNm5LdkE0SE5LSnJtMnRBRmVkMWlONldMSmRWU1JMMUFrPQp0cnVzdGVkIGNvbW1lbnQ6IHRpbWVzdGFtcDoxNzY3MDg5OTc0CWZpbGU6U2VhcmNoUG9pbnRfMC40LjJfYW1kNjQuQXBwSW1hZ2UKd01pR05XdUlUcmZuZmFaeTRVdlljak1RRFVBQlBRQ3Y1Q1NpaExOVHRMaWk5VHlVd1p4RUVUYy9tSVM1Z1Bza1JYM3pydUpDZDVicVJVRU43YmZsQ0E9PQo=",
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
