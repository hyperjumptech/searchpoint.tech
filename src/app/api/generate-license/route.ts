import { NextResponse } from "next/server";
import { generateLicenseKey, formatLicenseKey } from "@/lib/generate-licenses";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");
    const os = searchParams.get("os") || "darwin-aarch64"; // Default fallback

    if (!email) {
      return NextResponse.json(
        { error: "Missing email parameter" },
        { status: 400 },
      );
    }

    // Validate OS parameter
    const validOS = ["darwin-aarch64", "windows-x86_64", "linux-x86_64"];
    const normalizedOs = validOS.includes(os) ? os : "darwin-aarch64";

    // Map to user-friendly OS names
    let deviceOs: string;
    switch (normalizedOs) {
      case "windows-x86_64":
        deviceOs = "Windows";
        break;
      case "linux-x86_64":
        deviceOs = "Linux";
        break;
      default:
        deviceOs = "macOS";
    }

    const rawKey = generateLicenseKey(email, "user", deviceOs);
    const formattedKey = formatLicenseKey(rawKey);

    return NextResponse.json({
      licenseKey: formattedKey,
      rawLicenseKey: rawKey,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to generate license key: " + (error as Error).message,
      },
      { status: 500 },
    );
  }
}
