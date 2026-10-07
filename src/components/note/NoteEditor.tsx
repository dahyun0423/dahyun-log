"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { PartialBlock } from "@blocknote/core";
import { ko } from "@blocknote/core/locales";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView, type Theme } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import { notifyNotesChanged } from "@/lib/useMyNotes";

type Props = {
  id: string; // 노트 id (레슨 노트면 레슨 slug)
  lesson: string | null;
  defaultTitle: string;
  titleEditable: boolean; // 자유 페이지만 제목 수정 가능
  questions?: string[]; // 처음 열 때 깔아줄 질문
};

type Status = "idle" | "saving" | "saved" | "error" | "logged-out";

// 에디터 색·폰트를 사이트 디자인 토큰에 맞춤 (CSS 변수라 다크모드도 자동)
const theme: Theme = {
  colors: {
    editor: { text: "var(--fg)", background: "var(--surface)" },
    menu: { text: "var(--fg)", background: "var(--surface-elevated)" },
    tooltip: { text: "var(--fg)", background: "var(--surface-subtle)" },
    hovered: { text: "var(--fg)", background: "var(--surface-subtle)" },
    selected: { text: "var(--fg-on-primary)", background: "var(--primary)" },
    disabled: { text: "var(--fg-disabled)", background: "var(--surface-subtle)" },
    shadow: "var(--line)",
    border: "var(--line)",
    sideMenu: "var(--fg-tertiary)",
  },
  borderRadius: 12,
  fontFamily: "var(--font-pretendard), -apple-system, sans-serif",
};

// 질문마다 "제목 + 빈 줄"을 만들어 노트의 뼈대로 쓴다
function questionBlocks(questions: string[]): PartialBlock[] {
  return questions.flatMap((q) => [
    { type: "heading", props: { level: 3 }, content: q },
    { type: "paragraph" },
  ]);
}

export default function NoteEditor(props: Props) {
  const [loaded, setLoaded] = useState<{ title: string; blocks: PartialBlock[] } | "guest" | null>(null);

  // 배열은 렌더마다 새로 만들어질 수 있어서 문자열로 비교
  const questionsKey = JSON.stringify(props.questions ?? []);

  // 1) 서버에서 노트 불러오기 (없으면 질문 뼈대로 시작)
  useEffect(() => {
    fetch(`/api/notes/${props.id}`)
      .then(async (res) => {
        if (res.status === 401) {
          setLoaded("guest"); // 로그인 안 함
        } else if (res.ok) {
          const note = await res.json();
          setLoaded({ title: note.title, blocks: note.blocks });
        } else {
          setLoaded({ title: props.defaultTitle, blocks: questionBlocks(JSON.parse(questionsKey)) });
        }
      })
      .catch(() => setLoaded({ title: props.defaultTitle, blocks: [] }));
  }, [props.id, props.defaultTitle, questionsKey]);

  if (!loaded) return <p className="px-6 py-4 text-t6 text-fg-tertiary">노트 불러오는 중…</p>;
  if (loaded === "guest") return <LoginPrompt />;
  // key: 노트가 바뀌면 에디터를 새로 만든다 (이전 노트 내용이 다른 노트에 저장되는 사고 방지)
  return <Editor key={props.id} {...props} initialTitle={loaded.title} initialBlocks={loaded.blocks} />;
}

function Editor({
  id,
  lesson,
  titleEditable,
  initialTitle,
  initialBlocks,
}: Props & { initialTitle: string; initialBlocks: PartialBlock[] }) {
  const [title, setTitle] = useState(initialTitle);
  const [status, setStatus] = useState<Status>("idle");
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const fade = useRef<ReturnType<typeof setTimeout>>(undefined);
  const titleRef = useRef(initialTitle); // 저장할 때 최신 제목
  const savedTitle = useRef(initialTitle); // 마지막으로 저장된 제목 (사이드바 갱신 판단용)
  const dirty = useRef(false); // 저장 안 된 변경이 있나
  const enterPressed = useRef(false); // 방금 Enter를 눌렀나

  const editor = useCreateBlockNote({
    initialContent: initialBlocks.length > 0 ? initialBlocks : undefined,
    dictionary: ko,
  });

  // 실제 저장 — 바뀐 게 있을 때만
  async function save() {
    clearTimeout(timer.current);
    if (!dirty.current) return;
    dirty.current = false;
    setStatus("saving");
    try {
      const res = await fetch(`/api/notes/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        keepalive: true, // 페이지를 떠나는 순간에도 요청이 끝까지 가도록
        body: JSON.stringify({
          title: titleRef.current,
          lesson,
          blocks: editor.document,
          markdown: editor.blocksToMarkdownLossy(editor.document),
        }),
      });
      if (res.status === 401) return setStatus("logged-out");
      if (!res.ok) throw new Error(await res.text());
      setStatus("saved");
      clearTimeout(fade.current);
      fade.current = setTimeout(() => setStatus("idle"), 2000); // "✓ 저장됨"은 2초 뒤 사라짐
      if (titleRef.current !== savedTitle.current) {
        savedTitle.current = titleRef.current;
        notifyNotesChanged(); // 사이드바 제목 갱신
      }
    } catch {
      dirty.current = true; // 실패하면 다음 기회에 다시
      setStatus("error");
    }
  }

  // 내용이 바뀌면: Enter 직후면 바로, 아니면 1.5초 쉬었을 때 저장
  function changed() {
    dirty.current = true;
    clearTimeout(timer.current);
    const delay = enterPressed.current ? 0 : 1500;
    enterPressed.current = false;
    timer.current = setTimeout(save, delay);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    // 한글 조합 중 Enter는 글자 확정용이라 제외
    if (e.key === "Enter" && !e.nativeEvent.isComposing) enterPressed.current = true;
    if ((e.metaKey || e.ctrlKey) && e.key === "s") {
      e.preventDefault();
      void save();
    }
  }

  // 화면을 떠날 때(다른 레슨으로 이동, 탭 닫기) 남은 변경 저장
  useEffect(() => {
    const flush = () => void save();
    window.addEventListener("pagehide", flush);
    return () => {
      window.removeEventListener("pagehide", flush);
      flush();
      clearTimeout(fade.current);
    };
    // save는 ref만 읽어서 처음 한 번만 연결하면 된다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex h-full flex-col" onKeyDownCapture={onKeyDown} onBlur={() => void save()}>
      <div className="flex items-center justify-between px-6 pt-5 pb-2 md:px-12">
        <span className="text-t7 font-semibold text-fg-tertiary">내 노트</span>
        <SaveStatus status={status} />
      </div>
      {titleEditable && (
        <input
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            titleRef.current = e.target.value;
            changed();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.nativeEvent.isComposing) {
              e.preventDefault();
              void save();
              editor.focus(); // 제목 쓰고 Enter → 본문으로
            }
          }}
          placeholder="제목 없음"
          className="mx-6 mt-4 mb-2 bg-transparent text-t1 font-bold tracking-[-0.02em] outline-none placeholder:text-fg-disabled md:mx-12"
        />
      )}
      <BlockNoteView
        editor={editor}
        theme={{ light: theme, dark: theme }}
        onChange={changed}
        className="flex-1 pb-24"
      />
    </div>
  );
}

function SaveStatus({ status }: { status: Status }) {
  const text = {
    idle: "",
    saving: "저장 중…",
    saved: "✓ 저장됨",
    error: "저장 실패 — 인터넷 연결을 확인해 주세요",
    "logged-out": "로그인이 풀렸어요 — 다시 로그인해 주세요",
  }[status];
  const color = status === "error" || status === "logged-out" ? "text-error" : "text-fg-tertiary";
  return <span className={`text-t7 ${color}`}>{text}</span>;
}

// 로그인 안 했을 때 노트 자리에 보이는 안내
function LoginPrompt() {
  const pathname = usePathname();
  return (
    <div className="flex h-full flex-col items-center justify-center px-6 py-16 text-center">
      <p className="text-t4 font-bold">내 노트는 로그인하면 보여요</p>
      <p className="mt-2 text-t6 text-fg-tertiary">레슨은 로그인 없이도 읽을 수 있어요.</p>
      <Link
        href={`/login?next=${encodeURIComponent(pathname)}`}
        className="mt-6 rounded-md bg-primary px-5 py-3 text-t6 font-bold text-fg-on-primary active:scale-[0.98]"
      >
        로그인하고 쓰기
      </Link>
    </div>
  );
}
