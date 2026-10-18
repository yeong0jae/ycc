"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { type Moment, MOMENTS, type MyLog } from "@/lib/log-types";
import { CameraSheet } from "./camera-sheet";

export function LogCapture({ showId, initial }: { showId: number; initial: MyLog | null }) {
  const router = useRouter();
  const [clips, setClips] = useState(initial?.clips ?? []);
  const [busy, setBusy] = useState<Moment | "publish" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [camera, setCamera] = useState<Moment | null>(null);
  const inputs = useRef<Partial<Record<Moment, HTMLInputElement | null>>>({});

  const upload = async (moment: Moment, file: File) => {
    setBusy(moment);
    setError(null);
    const form = new FormData();
    form.append("moment", moment);
    form.append("file", file);
    const res = await fetch(`/api/shows/${showId}/log/clips`, { method: "POST", body: form });
    const body = await res.json().catch(() => null);
    if (res.ok) setClips(body.clips);
    else setError(body?.message || (res.status === 413 ? "10MB 이하 영상만 올릴 수 있어요." : "올리지 못했어요. 다시 찍어 주세요."));
    setBusy(null);
  };

  const remove = async (moment: Moment) => {
    setBusy(moment);
    const res = await fetch(`/api/shows/${showId}/log/clips/${moment}`, { method: "DELETE" });
    if (res.ok) setClips((await res.json()).clips);
    setBusy(null);
  };

  const publish = async (form: FormData) => {
    setBusy("publish");
    setError(null);
    const res = await fetch(`/api/shows/${showId}/log/publish`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ song: form.get("song"), note: form.get("note") }),
    });
    if (res.ok) {
      const log: MyLog = await res.json();
      router.push(`/logs/${log.id}`);
      return;
    }
    const body = await res.json().catch(() => null);
    setError(body?.message || "로그를 만들지 못했어요. 잠시 후 다시 시도해 주세요.");
    setBusy(null);
  };

  return (
    <div className="flex flex-col gap-6">
      <ol className="flex flex-col gap-2.5">
        {MOMENTS.map((moment) => {
          const clip = clips.find((c) => c.moment === moment.key);
          return (
            <li key={moment.key} className="flex items-center gap-3 rounded-2xl bg-stub px-4 py-3">
              <span
                className={`flex size-10 shrink-0 items-center justify-center rounded-full font-mono text-xs ${
                  clip ? "bg-ink text-stub" : "bg-paper text-muted"
                }`}
              >
                {clip ? `${(clip.durationMs / 1000).toFixed(1)}s` : "—"}
              </span>
              <span className="flex flex-1 flex-col">
                <span className="font-semibold">{moment.label}</span>
                <span className="text-[13px] text-muted">{clip ? "찍었어요" : moment.hint}</span>
              </span>
              <input
                ref={(el) => {
                  inputs.current[moment.key] = el;
                }}
                type="file"
                accept="video/*"
                capture="environment"
                className="sr-only"
                aria-label={`${moment.label} 찍기`}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  event.target.value = "";
                  if (file) upload(moment.key, file);
                }}
              />
              {clip && (
                <button
                  type="button"
                  disabled={busy !== null}
                  onClick={() => remove(moment.key)}
                  className="h-10 cursor-pointer px-2 text-[13px] text-muted disabled:opacity-50"
                >
                  지우기
                </button>
              )}
              <button
                type="button"
                disabled={busy !== null}
                onClick={() => setCamera(moment.key)}
                className="h-10 cursor-pointer rounded-xl bg-ink px-4 text-[13px] font-semibold text-stub transition-transform duration-150 active:scale-95 disabled:opacity-50 motion-reduce:transition-none motion-reduce:active:scale-100"
              >
                {busy === moment.key ? "올리는 중…" : clip ? "다시 찍기" : "찍기"}
              </button>
            </li>
          );
        })}
      </ol>
      <p className="text-[13px] leading-relaxed text-muted">
        순간마다 앞의 4초만 쓰고, 소리는 담지 않아요. 공연 중 촬영은 공연장 규칙을 지켜 주세요.
      </p>

      {clips.length > 0 && (
        <form action={publish} className="flex flex-col gap-4 border-t-2 border-dashed border-line pt-6">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold">그날의 한 곡 (선택)</span>
            <input
              name="song"
              maxLength={100}
              defaultValue={initial?.song ?? ""}
              className="h-12 rounded-xl border border-line bg-stub px-4 outline-none focus:border-ink"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold">한 줄 (선택)</span>
            <input
              name="note"
              maxLength={100}
              defaultValue={initial?.note ?? ""}
              placeholder="앵콜 첫 곡에서 다 같이 울었다"
              className="h-12 rounded-xl border border-line bg-stub px-4 outline-none placeholder:text-muted focus:border-ink"
            />
          </label>
          <button
            type="submit"
            disabled={busy !== null}
            className="h-13 cursor-pointer rounded-2xl bg-ink font-semibold text-stub transition-transform duration-150 active:scale-[0.98] disabled:opacity-60 motion-reduce:transition-none motion-reduce:active:scale-100"
          >
            {busy === "publish" ? "브이로그 만드는 중…" : `${clips.length}컷으로 로그 남기기`}
          </button>
        </form>
      )}
      {error && (
        <p role="alert" className="text-sm font-semibold">
          {error}
        </p>
      )}
      {camera && (
        <CameraSheet
          label={MOMENTS.find((m) => m.key === camera)!.label}
          onClose={() => setCamera(null)}
          onFallback={() => {
            const moment = camera;
            setCamera(null);
            inputs.current[moment]?.click();
          }}
          onCapture={(file) => {
            const moment = camera;
            setCamera(null);
            upload(moment, file);
          }}
        />
      )}
    </div>
  );
}
