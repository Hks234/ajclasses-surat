import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Only emit the Docker `server.js` bundle when explicitly requested.
  // A default standalone build on ordinary hosts leaves CSS/JS behind, so the
  // live site looks blank after a successful compile.
  output: process.env.OUTPUT_STANDALONE === "1" ? "standalone" : undefined,
  poweredByHeader: false,
  reactStrictMode: true,
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  serverExternalPackages: [
    "mysql2",
    "bcryptjs",
    "nodemailer",
    "razorpay",
    "ffmpeg-static",
    "ffprobe-static",
  ],
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
