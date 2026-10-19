"use client";

import { useState } from "react";
import type { OrganizerItem, OrganizerShow } from "@/lib/dev-types";
import { formatPeriod } from "@/lib/format";
import { ShowPicker } from "./show-picker";

const inputClass = "h-11 rounded-full bg-pill px-4 text-sm outline-none placeholder:text-muted focus:ring-2 focus:ring-ink";

type Editing = { id: number; field: "password" | "show" } | null;

async function send(path: string, method: string, body: unknown) {
  const res = await fetch(path, { method, headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  if (res.ok) return { ok: true as const, body: res.status === 200 ? await res.json().catch(() => null) : null };
  const error = await res.json().catch(() => null);
  return { ok: false as const, message: (error?.message as string | undefined) || "저장하지 못했어요." };
}

export function OrganizerBoard({ initial }: { initial: OrganizerItem[] }) {
  const [items, setItems] = useState(initial);
  const [creating, setCreating] = useState(false);
  const [newShow, setNewShow] = useState<OrganizerShow | null>(null);
  const [editing, setEditing] = useState<Editing>(null);
  const [editShow, setEditShow] = useState<OrganizerShow | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const report = (message: string | null, done: string | null = null) => {
    setError(message);
    setNotice(done);
  };

  const create = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!newShow) return report("공연을 골라 주세요.");
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const result = await send("/api/dev/organizers", "POST", {
      username: form.get("username"),
      password: form.get("password"),
      displayName: form.get("displayName"),
      showId: newShow.id,
    });
    if (!result.ok) return report(result.message);
    const res = await fetch("/api/dev/organizers");
    if (res.ok) setItems(await res.json());
    formElement.reset();
    setNewShow(null);
    setCreating(false);
    report(null, "계정을 만들었어요. 아이디와 비밀번호를 주최측에 알려 주세요.");
  };

  const changePassword = async (id: number, event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const password = new FormData(event.currentTarget).get("password");
    const result = await send(`/api/dev/organizers/${id}/password`, "PUT", { password });
    if (!result.ok) return report(result.message);
    setEditing(null);
    report(null, "비밀번호를 바꿨어요.");
  };

  const changeShow = async (id: number) => {
    if (!editShow) return report("공연을 골라 주세요.");
    const result = await send(`/api/dev/organizers/${id}/show`, "PUT", { showId: editShow.id });
    if (!result.ok) return report(result.message);
    setItems((prev) => prev.map((it) => (it.id === id ? (result.body as OrganizerItem) : it)));
    setEditing(null);
    setEditShow(null);
    report(null, "공연을 바꿨어요.");
  };

  const toggleActive = async (item: OrganizerItem) => {
    const result = await send(`/api/dev/organizers/${item.id}/active`, "PUT", { active: !item.active });
    if (!result.ok) return report(result.message);
    setItems((prev) => prev.map((it) => (it.id === item.id ? { ...it, active: !it.active } : it)));
    report(null, item.active ? "비활성화했어요." : "다시 활성화했어요.");
  };

  const edit = (id: number, field: "password" | "show") => {
    setEditing(editing?.id === id && editing.field === field ? null : { id, field });
    setEditShow(null);
    report(null);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-14 shrink-0 items-center gap-4 border-b border-line px-4 lg:px-6">
        <p className="text-sm text-muted">계정 {items.length}개</p>
        {(error || notice) && (
          <p role={error ? "alert" : "status"} className="min-w-0 truncate text-sm font-semibold">
            {error ?? notice}
          </p>
        )}
        <button
          type="button"
          aria-expanded={creating}
          onClick={() => {
            setCreating(!creating);
            report(null);
          }}
          className="ml-auto h-9 shrink-0 cursor-pointer rounded-full bg-ink px-3.5 text-[13px] font-semibold text-stub"
        >
          {creating ? "닫기" : "+ 계정 만들기"}
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex max-w-3xl flex-col px-4 lg:px-6">
          {creating && (
            <form onSubmit={create} className="flex flex-col gap-3 border-b border-line py-5">
              <div className="grid gap-2 sm:grid-cols-3">
                <input name="displayName" required maxLength={50} placeholder="표시 이름 (주최사)" autoComplete="off" className={inputClass} />
                <input name="username" required maxLength={30} placeholder="아이디" autoComplete="off" className={inputClass} />
                <input name="password" required minLength={8} placeholder="비밀번호 (8자 이상)" autoComplete="off" className={inputClass} />
              </div>
              <ShowPicker value={newShow} onChange={setNewShow} />
              <button type="submit" className="h-11 cursor-pointer self-start rounded-full bg-ink px-5 text-sm font-semibold text-stub">
                만들기
              </button>
            </form>
          )}
          {items.length === 0 && !creating && <p className="py-20 text-center text-sm text-muted">아직 주최측 계정이 없어요.</p>}
          <ul>
            {items.map((item) => (
              <li key={item.id} className={`flex flex-col gap-3 border-b border-line py-4 ${item.active ? "" : "opacity-55"}`}>
                <div className="flex items-center gap-4">
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className="flex items-center gap-2">
                      <span className="truncate font-semibold">{item.displayName}</span>
                      <span className="shrink-0 font-mono text-xs text-muted">{item.username}</span>
                      {!item.active && <span className="shrink-0 rounded-full bg-pill px-2 py-0.5 text-[11px]">비활성</span>}
                    </span>
                    <span className="truncate text-sm">
                      {item.show.name}{" "}
                      <span className="font-mono text-xs text-muted">{formatPeriod(item.show.startDate, item.show.endDate)}</span>
                    </span>
                  </div>
                  <div className="flex shrink-0 gap-1.5 text-[13px] font-semibold">
                    <button type="button" onClick={() => edit(item.id, "password")} className="h-9 cursor-pointer rounded-full bg-pill px-3">
                      비밀번호
                    </button>
                    <button type="button" onClick={() => edit(item.id, "show")} className="h-9 cursor-pointer rounded-full bg-pill px-3">
                      공연 바꾸기
                    </button>
                    <button type="button" onClick={() => toggleActive(item)} className="h-9 cursor-pointer rounded-full bg-pill px-3">
                      {item.active ? "비활성화" : "활성화"}
                    </button>
                  </div>
                </div>
                {editing?.id === item.id && editing.field === "password" && (
                  <form onSubmit={(event) => changePassword(item.id, event)} className="flex gap-2">
                    <input name="password" required minLength={8} placeholder="새 비밀번호 (8자 이상)" autoComplete="off" className={`${inputClass} flex-1`} />
                    <button type="submit" className="h-11 shrink-0 cursor-pointer rounded-full bg-ink px-4 text-sm font-semibold text-stub">
                      저장
                    </button>
                  </form>
                )}
                {editing?.id === item.id && editing.field === "show" && (
                  <div className="flex flex-col gap-2">
                    <ShowPicker value={editShow} onChange={setEditShow} />
                    <button
                      type="button"
                      onClick={() => changeShow(item.id)}
                      className="h-11 cursor-pointer self-start rounded-full bg-ink px-4 text-sm font-semibold text-stub"
                    >
                      저장
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
