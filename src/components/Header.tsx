import Link from "next/link";
import { categories } from "@/data/categories";

export default function Header() {
  return (
    <header className="sticky top-0 z-10 border-b border-line-subtle bg-surface/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-3xl items-center gap-6 px-5">
        <Link href="/" className="text-t5 font-bold">
          dahyun.log
        </Link>
        {/* 모바일에서는 가로 스크롤 */}
        <nav className="flex gap-4 overflow-x-auto text-t6 whitespace-nowrap text-fg-tertiary">
          {categories.map((c) => (
            <Link
              key={c.slug}
              href={`/#${c.slug}`}
              className="transition-colors duration-100 hover:text-fg"
            >
              {c.name}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
