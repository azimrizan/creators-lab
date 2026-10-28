import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The dubbing pipeline spawns ffmpeg-static's binary and opens Edge TTS websockets; load both with plain Node require.
  serverExternalPackages: ["ffmpeg-static", "msedge-tts"],
  // ffmpeg-static's binary is spawned by path, so file tracing can't see it; ship it with the dubbing route.
  outputFileTracingIncludes: {
    "/api/dubbing": ["./node_modules/ffmpeg-static/ffmpeg"],
  },
};

export default nextConfig;
