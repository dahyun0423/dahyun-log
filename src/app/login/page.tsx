"use client";

import { useState } from "react";
import { notifyNotesChanged } from "@/lib/useMyNotes";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError("");
    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    setPending(false);
    if (!res.ok) {
      setError("비밀번호가 틀렸어요");
      return;
    }
    notifyNotesChanged();
    // 로그인 전에 보던 곳으로 (?next=/learn/...)
    const next = new URLSearchParams(window.location.search).get("next") ?? "/";
    window.location.href = next.startsWith("/") ? next : "/";
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-sm flex-col justify-center px-5">
      <h1 className="text-t2 font-bold tracking-[-0.02em]">
        비밀번호를
        <br />
        입력해 주세요
      </h1>
      <p className="mt-2 text-t6 text-fg-tertiary">로그인하면 노트를 쓰고 볼 수 있어요.</p>
      <form onSubmit={submit} className="mt-8">
        <input
          type="password"
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="비밀번호"
          className="w-full rounded-md bg-surface-subtle px-4 py-3.5 text-t5 outline-none focus:outline-2 focus:outline-line-focus"
        />
        {error && <p className="mt-2 text-t7 text-error">{error}</p>}
        <button
          disabled={pending || !password}
          className="mt-4 h-14 w-full rounded-md bg-primary text-t5 font-bold text-fg-on-primary transition-transform duration-100 hover:bg-primary-hover active:scale-[0.98] disabled:bg-surface-subtle disabled:text-fg-disabled"
        >
          {pending ? "확인 중…" : "로그인"}
        </button>
      </form>
    </div>
  );
}
