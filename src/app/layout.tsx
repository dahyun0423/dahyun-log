import type { Metadata } from "next";
import localFont from "next/font/local";
import { Suspense } from "react";
import Sidebar from "@/components/Sidebar";
import { getLessons } from "@/lib/lessons";
import { listNotes, READ_ONLY } from "@/lib/notes";
import "./globals.css";

// 기본 서체 Pretendard. 가변 폰트 1개로 모든 굵기를 쓴다
const pretendard = localFont({
  src: "../../node_modules/pretendard/dist/web/variable/woff2/PretendardVariable.woff2",
  variable: "--font-pretendard",
  weight: "45 920",
  display: "swap",
});

export const metadata: Metadata = {
  title: "dahyun.log",
  description: "모르는 것을 하나씩 채워가는 개발 공부 기록",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const lessons = await getLessons();
  const notes = listNotes();

  return (
    <html lang="ko" className={`${pretendard.variable} h-full antialiased`}>
      <body className="min-h-full font-sans md:flex">
        {/* 사이드바는 현재 주소(usePathname)를 써서 Suspense로 감싼다. 빈 자리만 먼저 그림 */}
        <Suspense fallback={<div className="hidden md:block md:h-screen md:w-64 md:shrink-0 md:bg-surface-subtle" />}>
          <Sidebar lessons={lessons} notes={notes} readOnly={READ_ONLY} />
        </Suspense>
        <main className="min-w-0 flex-1">{children}</main>
      </body>
    </html>
  );
}
