import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  // swisseph-v2는 네이티브(.node) 모듈이라 번들하지 않고 런타임에 node_modules에서 불러온다.
  serverExternalPackages: ["swisseph-v2"],
  // 동료에게 보여줄 때 쓰는 Cloudflare 임시 터널 주소에서도 개발 서버를 열 수 있게 한다.
  allowedDevOrigins: ["*.trycloudflare.com"],
  // 서버리스 배포 시 런타임에 fs로 읽는 데이터 파일도 함께 올린다.
  // swisseph-v2는 `__dirname + '/../build/Release/swisseph.node'`로 불러와 파일 추적이 찾지 못하므로 직접 넣는다.
  // Vercel이 API 라우트를 한 함수로 묶기도 해서 /api 아래 전체에 붙인다.
  outputFileTracingIncludes: {
    "/api/**/*": ["./node_modules/swisseph-v2/build/Release/swisseph.node"], // 네이티브 계산 모듈
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
