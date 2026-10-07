"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { Folder, NoteSummary } from "@/lib/notes";
import { notesApi } from "@/lib/useMyNotes";

/*
 * 내 페이지 — 옵시디언처럼 폴더 안에 페이지를 여러 개 둔다.
 *   폴더: 접기/펼치기, ＋ 새 페이지, ⋯ 메뉴(하위 폴더·이름 바꾸기·삭제)
 *   페이지: ⋯ 메뉴(폴더 옮기기·삭제), 끌어서 폴더에 놓으면 이동
 */

type Props = {
  folders: Folder[];
  pages: NoteSummary[]; // 레슨 노트를 뺀 자유 페이지
  onNavigate: () => void; // 모바일에서 메뉴 닫기
};

// 지금 끌고 있는 것
type Dragging = { kind: "page" | "folder"; id: string } | null;

// 이름을 입력받는 중인 곳
type Editing =
  | { mode: "new-folder"; parentId: string | null }
  | { mode: "rename"; id: string }
  | null;

const OPEN_KEY = "page-tree-open";

export default function PageTree({ folders, pages, onNavigate }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [menu, setMenu] = useState<string | null>(null); // ⋯ 메뉴가 열린 항목 id
  const [editing, setEditing] = useState<Editing>(null);
  const [dragging, setDragging] = useState<Dragging>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null); // "root" 또는 폴더 id

  // 폴더 펼침 상태는 브라우저에 기억 (새로고침해도 유지)
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(OPEN_KEY) ?? "{}");
      const restore = setTimeout(() => setOpen(saved), 0);
      return () => clearTimeout(restore);
    } catch {
      /* 저장소를 못 쓰면 전부 접힌 채로 */
    }
  }, []);

  function toggle(id: string, value?: boolean) {
    setOpen((prev) => {
      const next = { ...prev, [id]: value ?? !prev[id] };
      try {
        localStorage.setItem(OPEN_KEY, JSON.stringify(next));
      } catch {
        /* 무시 */
      }
      return next;
    });
  }

  async function newPage(folderId: string | null) {
    setMenu(null);
    if (folderId) toggle(folderId, true);
    const id = await notesApi.createPage(folderId);
    if (id) {
      onNavigate();
      router.push(`/pages/${id}`);
    }
  }

  async function drop(target: string | null) {
    setDropTarget(null);
    if (!dragging) return;
    if (dragging.kind === "page") await notesApi.movePage(dragging.id, target);
    else if (dragging.id !== target) await notesApi.moveFolder(dragging.id, target);
    if (target) toggle(target, true);
    setDragging(null);
  }

  // 놓을 수 있는 자리 공통 속성
  const dropZone = (target: string | null) => ({
    onDragOver: (e: React.DragEvent) => {
      if (!dragging) return;
      e.preventDefault();
      setDropTarget(target ?? "root");
    },
    onDragLeave: () => setDropTarget(null),
    onDrop: (e: React.DragEvent) => {
      e.preventDefault();
      void drop(target);
    },
  });

  const row = (active: boolean, highlighted = false) =>
    `group flex items-center gap-1.5 rounded-sm px-2 py-1.5 text-t6 transition-colors duration-100 ${
      highlighted
        ? "bg-primary-subtle text-primary-strong"
        : active
          ? "bg-line text-fg font-semibold"
          : "text-fg-secondary hover:bg-line-subtle"
    }`;

  const iconButton =
    "hidden size-5 shrink-0 items-center justify-center rounded-sm text-fg-tertiary hover:bg-line group-hover:flex";

  function renderFolder(folder: Folder, depth: number): React.ReactNode {
    const isOpen = !!open[folder.id];
    const childFolders = folders.filter((f) => f.parentId === folder.id);
    const childPages = pages.filter((p) => p.folderId === folder.id);

    return (
      <li key={folder.id}>
        <div
          draggable
          onDragStart={() => setDragging({ kind: "folder", id: folder.id })}
          onDragEnd={() => setDragging(null)}
          {...dropZone(folder.id)}
          className={`${row(false, dropTarget === folder.id)} relative cursor-pointer`}
          style={{ paddingLeft: 8 + depth * 14 }}
          onClick={() => toggle(folder.id)}
        >
          <span className={`w-3 text-[10px] text-fg-tertiary transition-transform ${isOpen ? "rotate-90" : ""}`}>▶</span>
          {editing?.mode === "rename" && editing.id === folder.id ? (
            <NameInput
              initial={folder.name}
              onDone={async (name) => {
                setEditing(null);
                if (name && name !== folder.name) await notesApi.renameFolder(folder.id, name);
              }}
            />
          ) : (
            <span className="flex-1 truncate">📁 {folder.name}</span>
          )}
          <button
            title="이 폴더에 새 페이지"
            className={iconButton}
            onClick={(e) => {
              e.stopPropagation();
              void newPage(folder.id);
            }}
          >
            ＋
          </button>
          <button
            title="더 보기"
            className={iconButton}
            onClick={(e) => {
              e.stopPropagation();
              setMenu(menu === folder.id ? null : folder.id);
            }}
          >
            ⋯
          </button>
          {menu === folder.id && (
            <Menu onClose={() => setMenu(null)}>
              <MenuItem
                onClick={() => {
                  toggle(folder.id, true);
                  setEditing({ mode: "new-folder", parentId: folder.id });
                }}
              >
                📁 하위 폴더 만들기
              </MenuItem>
              <MenuItem onClick={() => setEditing({ mode: "rename", id: folder.id })}>✏️ 이름 바꾸기</MenuItem>
              <ConfirmItem label="🗑 폴더 삭제" confirm="안의 페이지는 바깥으로 꺼내요. 삭제할까요?" onConfirm={() => notesApi.deleteFolder(folder.id)} />
            </Menu>
          )}
        </div>

        {isOpen && (
          <ul>
            {editing?.mode === "new-folder" && editing.parentId === folder.id && (
              <NewFolderRow depth={depth + 1} parentId={folder.id} onDone={() => setEditing(null)} />
            )}
            {childFolders.map((f) => renderFolder(f, depth + 1))}
            {childPages.map((p) => renderPage(p, depth + 1))}
            {childFolders.length === 0 && childPages.length === 0 && editing?.mode !== "new-folder" && (
              <li className="py-1 text-t7 text-fg-disabled" style={{ paddingLeft: 8 + (depth + 1) * 14 + 18 }}>
                비어 있어요
              </li>
            )}
          </ul>
        )}
      </li>
    );
  }

  function renderPage(page: NoteSummary, depth: number): React.ReactNode {
    const href = `/pages/${page.id}`;
    return (
      <li key={page.id} className="relative">
        <Link
          href={href}
          draggable
          onDragStart={() => setDragging({ kind: "page", id: page.id })}
          onDragEnd={() => setDragging(null)}
          onClick={onNavigate}
          className={row(pathname === href)}
          style={{ paddingLeft: 8 + depth * 14 + 18 }}
        >
          <span className="flex-1 truncate">📄 {page.title}</span>
          <button
            title="더 보기"
            className={iconButton}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setMenu(menu === page.id ? null : page.id);
            }}
          >
            ⋯
          </button>
        </Link>
        {menu === page.id && (
          <Menu onClose={() => setMenu(null)}>
            <p className="px-3 pt-1 pb-1 text-[12px] font-semibold text-fg-tertiary">폴더로 옮기기</p>
            <MenuItem onClick={() => notesApi.movePage(page.id, null)} disabled={page.folderId === null}>
              🏠 맨 바깥
            </MenuItem>
            {folders.map((f) => (
              <MenuItem key={f.id} onClick={() => notesApi.movePage(page.id, f.id)} disabled={page.folderId === f.id}>
                📁 {folderPath(f, folders)}
              </MenuItem>
            ))}
            <div className="my-1 border-t border-line-subtle" />
            <ConfirmItem
              label="🗑 페이지 삭제"
              confirm="되돌릴 수 없어요. 삭제할까요?"
              onConfirm={async () => {
                await notesApi.deletePage(page.id);
                if (pathname === href) router.push("/");
              }}
            />
          </Menu>
        )}
      </li>
    );
  }

  const rootFolders = folders.filter((f) => !f.parentId || !folders.some((x) => x.id === f.parentId));
  const rootPages = pages.filter((p) => !p.folderId || !folders.some((f) => f.id === p.folderId));

  return (
    <div>
      {/* 제목 줄 — 여기에 끌어다 놓으면 맨 바깥으로 */}
      <div
        {...dropZone(null)}
        className={`group mt-6 mb-1 flex items-center justify-between rounded-sm px-2 py-0.5 ${dropTarget === "root" ? "bg-primary-subtle" : ""}`}
      >
        <p className="text-t7 font-semibold text-fg-tertiary">내 페이지</p>
        <div className="flex gap-0.5">
          <button title="새 폴더" className={`${iconButton} flex!`} onClick={() => setEditing({ mode: "new-folder", parentId: null })}>
            📁
          </button>
          <button title="새 페이지" className={`${iconButton} flex!`} onClick={() => void newPage(null)}>
            ＋
          </button>
        </div>
      </div>

      <ul>
        {editing?.mode === "new-folder" && editing.parentId === null && (
          <NewFolderRow depth={0} parentId={null} onDone={() => setEditing(null)} />
        )}
        {rootFolders.map((f) => renderFolder(f, 0))}
        {rootPages.map((p) => renderPage(p, 0))}
        {folders.length === 0 && pages.length === 0 && (
          <li className="px-2 py-1 text-t7 text-fg-disabled">＋로 페이지, 📁로 폴더를 만들어요</li>
        )}
      </ul>
    </div>
  );
}

// "Git / 기초" 처럼 폴더 경로 보여주기
function folderPath(folder: Folder, all: Folder[]) {
  const names = [folder.name];
  let parent = all.find((f) => f.id === folder.parentId);
  while (parent && names.length < 5) {
    names.unshift(parent.name);
    parent = all.find((f) => f.id === parent!.parentId);
  }
  return names.join(" / ");
}

function NewFolderRow({ depth, parentId, onDone }: { depth: number; parentId: string | null; onDone: () => void }) {
  return (
    <li className="flex items-center gap-1.5 px-2 py-1 text-t6" style={{ paddingLeft: 8 + depth * 14 + 18 }}>
      📁
      <NameInput
        initial=""
        placeholder="폴더 이름"
        onDone={async (name) => {
          onDone();
          if (name) await notesApi.createFolder(name, parentId);
        }}
      />
    </li>
  );
}

// 이름 입력 — Enter 저장, Esc 취소, 바깥 클릭 저장
function NameInput({
  initial,
  placeholder,
  onDone,
}: {
  initial: string;
  placeholder?: string;
  onDone: (name: string) => void;
}) {
  const [value, setValue] = useState(initial);
  const [done, setDone] = useState(false);
  const finish = (name: string) => {
    if (done) return;
    setDone(true);
    onDone(name.trim());
  };
  return (
    <input
      autoFocus
      value={value}
      placeholder={placeholder}
      onClick={(e) => e.stopPropagation()}
      onChange={(e) => setValue(e.target.value)}
      onKeyDown={(e) => {
        if (e.nativeEvent.isComposing) return;
        if (e.key === "Enter") finish(value);
        if (e.key === "Escape") finish("");
      }}
      onBlur={() => finish(value)}
      className="min-w-0 flex-1 rounded-sm bg-surface px-1.5 py-0.5 text-t6 text-fg outline outline-line-focus"
    />
  );
}

function Menu({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <>
      {/* 바깥을 누르면 닫힘 */}
      <div className="fixed inset-0 z-30" onClick={(e) => { e.preventDefault(); e.stopPropagation(); onClose(); }} />
      <div
        className="absolute top-full right-1 z-40 mt-1 max-h-72 w-56 overflow-y-auto rounded-md border border-line-subtle bg-surface-elevated py-1 shadow-lg"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onClose();
        }}
      >
        {children}
      </div>
    </>
  );
}

function MenuItem({ children, onClick, disabled }: { children: React.ReactNode; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className="block w-full truncate px-3 py-1.5 text-left text-t6 text-fg hover:bg-surface-subtle disabled:text-fg-disabled disabled:hover:bg-transparent"
    >
      {children}
    </button>
  );
}

// 삭제처럼 되돌릴 수 없는 건 한 번 더 누르게
function ConfirmItem({ label, confirm, onConfirm }: { label: string; confirm: string; onConfirm: () => unknown }) {
  const [asking, setAsking] = useState(false);
  return asking ? (
    <div className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
      <p className="text-[12px] text-fg-secondary">{confirm}</p>
      <div className="mt-2 flex gap-1.5">
        <button
          className="rounded-sm bg-error px-2.5 py-1 text-[12px] font-bold text-fg-on-primary"
          onClick={(e) => {
            e.stopPropagation();
            void onConfirm();
            setAsking(false);
          }}
        >
          삭제
        </button>
        <button className="rounded-sm bg-surface-subtle px-2.5 py-1 text-[12px] font-bold" onClick={() => setAsking(false)}>
          취소
        </button>
      </div>
    </div>
  ) : (
    <button
      className="block w-full px-3 py-1.5 text-left text-t6 text-error hover:bg-surface-subtle"
      onClick={(e) => {
        e.stopPropagation();
        setAsking(true);
      }}
    >
      {label}
    </button>
  );
}
