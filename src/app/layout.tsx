import type { Metadata } from "next";
import localFont from "next/font/local";
import Header from "@/components/Header";
import "./globals.css";

// TDS 기본 서체. 가변 폰트 1개로 모든 굵기를 쓴다
const pretendard = localFont({
  src: "../../node_modules/pretendard/dist/web/variable/woff2/PretendardVariable.woff2",
  variable: "--font-pretendard",
  weight: "45 920",
  display: "swap",
});

export const metadata: Metadata = {
  title: "dahyun.log — 개발 공부 기록",
  description: "당당을 만들면서 서버·인프라·AI·프론트엔드를 하나씩 채워가는 9주 공부 기록",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className={`${pretendard.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <Header />
        <main className="mx-auto w-full max-w-3xl flex-1 px-5 pb-24">{children}</main>
        <footer className="border-t border-line-subtle py-8 text-center text-t7 text-fg-tertiary">
          dahyun.log · 2026 SW인재양성 9주 기록
        </footer>
      </body>
    </html>
  );
}
