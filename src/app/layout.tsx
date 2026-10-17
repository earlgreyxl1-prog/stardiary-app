import type { Metadata, Viewport } from 'next';
import { Noto_Sans_KR } from 'next/font/google';
import { MotionProvider } from '@/components/ui/MotionProvider';
import './globals.css';

const notoSansKr = Noto_Sans_KR({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: '내 별자리 알아보기',
  description: '생년월일과 태어난 곳으로 알아보는 나만의 별자리 이야기',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#14112e',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body className={`${notoSansKr.className} min-h-dvh bg-[#14112e] text-indigo-50 antialiased`}>
        <MotionProvider>{children}</MotionProvider>
      </body>
    </html>
  );
}
