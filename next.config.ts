import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  // swisseph-v2는 네이티브(.node) 모듈이라 번들하지 않고 런타임에 node_modules에서 불러온다.
  serverExternalPackages: ["swisseph-v2"],
  // 서버리스 배포 시 런타임에 fs로 읽는 데이터 파일도 함께 올린다.
  outputFileTracingIncludes: {
    "/api/chart": ["./node_modules/swisseph-v2/ephe/**/*"], // 천문력
    "/api/geocode": ["./data/world-cities.geonames.json"], // GeoNames 도시 (CC BY 4.0)
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
