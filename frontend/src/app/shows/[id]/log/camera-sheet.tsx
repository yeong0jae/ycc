"use client";

import { useEffect, useRef, useState } from "react";

const RECORD_MS = 3000;
const TYPES = ["video/mp4;codecs=avc1", "video/mp4", "video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"];

function pickType() {
  return TYPES.find((type) => MediaRecorder.isTypeSupported(type)) ?? "";
}

export function CameraSheet({
  label,
  onCapture,
  onFallback,
  onClose,
}: {
  label: string;
  onCapture: (file: File) => void;
  onFallback: () => void;
  onClose: () => void;
}) {
  const video = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facing, setFacing] = useState<"environment" | "user">("environment");
  const [recording, setRecording] = useState(false);
  const [unsupported] = useState(
    () => !navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined",
  );
  const [denied, setDenied] = useState(false);
  const failed = unsupported || denied;

  useEffect(() => {
    let active: MediaStream | null = null;
    let cancelled = false;
    if (unsupported) return;
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: facing, width: { ideal: 1080 }, height: { ideal: 1920 } }, audio: false })
      .then((media) => {
        if (cancelled) return media.getTracks().forEach((track) => track.stop());
        active = media;
        setStream(media);
        if (video.current) video.current.srcObject = media;
      })
      .catch(() => setDenied(true));
    return () => {
      cancelled = true;
      active?.getTracks().forEach((track) => track.stop());
    };
  }, [facing, unsupported]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && !recording && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, recording]);

  const record = () => {
    if (!stream || recording) return;
    const type = pickType();
    const recorder = new MediaRecorder(stream, type ? { mimeType: type } : undefined);
    const chunks: Blob[] = [];
    recorder.ondataavailable = (event) => event.data.size > 0 && chunks.push(event.data);
    recorder.onstop = () => {
      const mime = recorder.mimeType || type || "video/webm";
      const extension = mime.includes("mp4") ? "mp4" : "webm";
      onCapture(new File(chunks, `clip.${extension}`, { type: mime }));
    };
    recorder.start();
    setRecording(true);
    window.setTimeout(() => recorder.state !== "inactive" && recorder.stop(), RECORD_MS);
  };

  return (
    <div role="dialog" aria-modal="true" aria-label={`${label} 찍기`} className="fixed inset-0 z-50 flex flex-col bg-ink text-stub">
      <div className="relative mx-auto flex w-full max-w-2xl flex-1 flex-col">
        <video
          ref={video}
          autoPlay
          muted
          playsInline
          className={`absolute inset-2 size-[calc(100%-16px)] rounded-[28px] bg-[#1A1D2B] object-cover ${
            facing === "user" ? "-scale-x-100" : ""
          }`}
        />
        <div className="relative flex items-center justify-between p-5">
          <button
            type="button"
            aria-label="닫기"
            disabled={recording}
            onClick={onClose}
            className="flex size-11 cursor-pointer items-center justify-center rounded-full bg-ink/55 disabled:opacity-40"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
          <span className="rounded-full bg-ink/55 px-3.5 py-2 text-[13px] font-semibold">{label}</span>
          <button
            type="button"
            aria-label="카메라 전환"
            disabled={recording || failed}
            onClick={() => setFacing((f) => (f === "environment" ? "user" : "environment"))}
            className="flex size-11 cursor-pointer items-center justify-center rounded-full bg-ink/55 disabled:opacity-40"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M4 7h3l2-3h6l2 3h3v12H4z" />
              <path d="M9.5 13a2.5 2.5 0 0 0 4.5 1.5M14.5 12a2.5 2.5 0 0 0-4.5-1.5" />
            </svg>
          </button>
        </div>

        {failed && (
          <div className="relative m-auto flex max-w-72 flex-col items-center gap-3 text-center">
            <p className="font-semibold">카메라를 열 수 없어요</p>
            <p className="text-sm text-[#A3A8B3]">카메라 권한을 허용했는지 확인해 주세요. 휴대폰 카메라 앱으로 찍어서 올릴 수도 있어요.</p>
            <button type="button" onClick={onFallback} className="h-11 cursor-pointer rounded-xl bg-stub px-5 text-sm font-semibold text-ink">
              카메라 앱으로 찍기
            </button>
          </div>
        )}

        <div className="relative mt-auto flex flex-col items-center gap-3 pb-10">
          {!failed && (
            <p className="rounded-full bg-ink/55 px-3 py-1.5 text-[13px]">
              {recording ? "찍는 중…" : "한 번 누르면 3초 찍고 바로 올라가요"}
            </p>
          )}
          <button
            type="button"
            aria-label="3초 찍기"
            disabled={!stream || recording}
            onClick={record}
            className="relative flex size-21 cursor-pointer items-center justify-center rounded-full border-4 border-stub disabled:cursor-default"
          >
            <span
              className={`rounded-full bg-[#FF3B30] transition-all duration-200 motion-reduce:transition-none ${
                recording ? "size-8 rounded-lg" : "size-16"
              }`}
            />
            {recording && (
              <svg className="absolute -inset-1 size-[calc(100%+8px)] -rotate-90" viewBox="0 0 100 100" aria-hidden="true">
                <circle cx="50" cy="50" r="47" fill="none" stroke="#FF3B30" strokeWidth="6" pathLength="100" strokeDasharray="100" className="animate-record-ring" />
              </svg>
            )}
          </button>
          <button type="button" disabled={recording} onClick={onFallback} className="h-10 cursor-pointer text-[13px] text-[#A3A8B3] disabled:opacity-40">
            갤러리에서 고르기
          </button>
        </div>
      </div>
    </div>
  );
}
