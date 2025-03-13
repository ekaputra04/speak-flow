import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  api: {
    bodyParser: false, // Agar bisa menangani file upload
  },
};

export default nextConfig;
