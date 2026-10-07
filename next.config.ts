import type { NextConfig } from "next";
import createMDX from "@next/mdx";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // .mdx 파일도 페이지/모듈로 인식
  pageExtensions: ["ts", "tsx", "md", "mdx"],
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

const withMDX = createMDX({
  options: {
    // 표·체크박스 같은 GitHub 마크다운 문법 지원 (Turbopack은 문자열로 지정)
    remarkPlugins: ["remark-gfm"],
  },
});

export default withMDX(nextConfig);
