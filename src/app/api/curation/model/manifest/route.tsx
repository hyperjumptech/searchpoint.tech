import { env } from "@/lib/env";
import { NextRequest, NextResponse } from "next/server";

interface ModelManifestResponse {
  filename: string;
  gguf_url: string;
  gguf_sha256: string;
  size_bytes: number;
  version: string;
}

export async function GET(_request: NextRequest) {
  try {
    const version = env.CURATION_MODEL_VERSION;
    const filename = env.CURATION_MODEL_FILENAME;
    const gguf_sha256 = env.CURATION_MODEL_GGUF_SHA256;
    const size_bytes = Number(env.CURATION_MODEL_SIZE_BYTES);
    if (
      !version ||
      !filename ||
      !gguf_sha256 ||
      !Number.isFinite(size_bytes) ||
      size_bytes <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "Model manifest not configured: CURATION_MODEL_VERSION, CURATION_MODEL_FILENAME, CURATION_MODEL_GGUF_SHA256 and CURATION_MODEL_SIZE_BYTES are required",
        },
        { status: 503 },
      );
    }

    // Models live in the same place as metadata.json, i.e. alongside the
    // desktop app releases. Version-scoped so upgrades can be pushed by
    // bumping CURATION_MODEL_VERSION without moving files.
    const baseUrl = `${env.UPDATER_BASE_URL}/releases/v${version}`;

    const manifest: ModelManifestResponse = {
      filename,
      gguf_url: `${baseUrl}/${filename}`,
      gguf_sha256,
      size_bytes,
      version,
    };

    return NextResponse.json(manifest);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          "Failed to build curation model manifest: " +
          (error as Error).message,
      },
      { status: 500 },
    );
  }
}
