import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  allowedDevOrigins: [
    "http://192.168.18.11:3000",
    "https://ready-cougar-trusty.ngrok-free.app",
  ],
};

export default nextConfig;
