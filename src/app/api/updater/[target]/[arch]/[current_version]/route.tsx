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
    const latestVersion = "0.1.6";

    if (current_version === latestVersion) {
      return new NextResponse(null, { status: 204 });
    }

    const updateResponse: TauriUpdateResponse = {
      version: latestVersion,
      notes: "Bug fixes and improvements",
      pub_date: new Date().toISOString(),
      platforms: {
        ["darwin-aarch64"]: {
          signature:
            "dW50cnVzdGVkIGNvbW1lbnQ6IHNpZ25hdHVyZSBmcm9tIHRhdXJpIHNlY3JldCBrZXkKUlVRbTVWc2hHZjB5UTdUS1ZscjFjaVErOGZYUlAxdG16N3JHNitvQW1uNEl6TlNRUVlYSlJONkQ3YVdUWktlNUtla2huOGNOeFI0OXF3OXNpeVNzMmNYekNkcEY2ZFh1OEFJPQp0cnVzdGVkIGNvbW1lbnQ6IHRpbWVzdGFtcDoxNzYzMDIxMzYzCWZpbGU6c2NzZS1kZXNrdG9wLmFwcC50YXIuZ3oKV2wyNWNXNllrek56bzdkZkV6OW1xUCsvV3pPb0hVNjdUZkVIbytDRmUxYXdRRVBxL0E5Uy80THdJaGQ3SEdFdlk3ZE41Q3hDS0F4K2E4NnNQSHB3QVE9PQo=",
          url: "https://storage.scse.hyperjump.tech/scse/releases/v0.1.6/macos/scse-desktop.app.tar.gz",
        },
        ["windows-x86_64"]: {
          signature:
            "dW50cnVzdGVkIGNvbW1lbnQ6IHNpZ25hdHVyZSBmcm9tIHRhdXJpIHNlY3JldCBrZXkKUlVRbTVWc2hHZjB5UXc2V1lsUlRzYmd4aDEzSWxid2NZTFhCYmlscEVHaVJGeUxXZ2FZNkphdGdhY083K1luUjRhRERaWjJuUVNYZVUvQzVkNDM5c2dKcTRpVmNNYnlNckE4PQp0cnVzdGVkIGNvbW1lbnQ6IHRpbWVzdGFtcDoxNzYzMDIxNDAzCWZpbGU6c2NzZS1kZXNrdG9wXzAuMS42X3g2NF9lbi1VUy5tc2kKRTRuMmpSQ0xGd3RzaFhZRkpZZEdQT1ZyTHJ0amtLR0tUeE9ienRzbWs5VDY1YkVwczdqeW95eTR2RExsWXk0YzBHRWIwUW92ZWJLM3VVN3BhR0gvQkE9PQo=",
          url: "https://storage.scse.hyperjump.tech/scse/releases/v0.1.6/windows/scse-desktop_0.1.6_x64_en-US.msi",
        },
        ["linux-x86_64"]: {
          signature:
            "dW50cnVzdGVkIGNvbW1lbnQ6IHNpZ25hdHVyZSBmcm9tIHRhdXJpIHNlY3JldCBrZXkKUlVRbTVWc2hHZjB5UXk0bi9NaGk3eFBUMkFlaUEyb0dac3RHbHFtclcycFRsY0xxbFgvTUtwM0UwSEdZYVJDdmhmMUNQblJsblA5RHdDVTNLVEprcE5xNVNoNnpaYXBxeFFBPQp0cnVzdGVkIGNvbW1lbnQ6IHRpbWVzdGFtcDoxNzYzMDIwMTM1CWZpbGU6c2NzZS1kZXNrdG9wXzAuMS42X2FtZDY0LkFwcEltYWdlCm9rL051dEVQRlg5K2s4NGxFVnU4VkJkbVRWZzkyT0hncEJ3ZUo4Mkw3TEI3M090cWtsaEV2UlprdlNGbTBJeFVrcG4yWE02RzRVSnBiRi8rOWFHakRnPT0K",
          url: "https://storage.scse.hyperjump.tech/scse/releases/v0.1.6/linux/scse-desktop_0.1.6_amd64.AppImage",
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
