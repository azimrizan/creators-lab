import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The dubbing pipeline spawns ffmpeg-static's binary and opens Edge TTS websockets; load both with plain Node require.
  serverExternalPackages: ["ffmpeg-static", "msedge-tts"],
};

export default nextConfig;
