import { Suspense } from "react";
import { notFound } from "next/navigation";
import LazyNoteEditor from "@/components/note/LazyNoteEditor";
import { isValidId } from "@/lib/notes";

// 레슨과 상관없는 자유 페이지 (에러 기록, 회고, 아이디어 …)
export default function FreePage({ params }: PageProps<"/pages/[id]">) {
  return (
    <Suspense>
      <Page params={params} />
    </Suspense>
  );
}

async function Page({ params }: { params: PageProps<"/pages/[id]">["params"] }) {
  const { id } = await params;
  if (!isValidId(id)) notFound();

  return (
    <div className="mx-auto max-w-3xl">
      <LazyNoteEditor key={id} id={id} lesson={null} defaultTitle="제목 없음" titleEditable />
    </div>
  );
}
