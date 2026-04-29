import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {},
};

// next-pwa는 production 빌드에서만 활성화 (webpack 모드 필요 시 별도 설정)
// PWA는 manifest.json + service worker를 통해 직접 제공
export default nextConfig;
