import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const fromRoot = (relative: string) => fileURLToPath(new URL(relative, import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      '@': fromRoot('./src'),
      // 'server-only'는 클라이언트 번들에 서버 코드가 섞이면 빌드를 막는 가드다.
      // 테스트는 Node에서 서버 코드를 직접 부르므로 빈 모듈로 바꾼다.
      'server-only': fromRoot('./test/stubs/server-only.ts'),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    // 엔진(swisseph)·도시 데이터(약 23MB)를 읽는 통합 테스트가 있어 기본 5초보다 넉넉히 둔다.
    testTimeout: 20_000,
  },
});
