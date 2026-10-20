"use client";

import QRCode from "qrcode";
import { useEffect, useState, useSyncExternalStore } from "react";
import { formatPeriod } from "@/lib/format";

const A4 = { width: 1240, height: 1754 };
const INK = "#111111";
const MUTED = "#6b6b72";
const LIME = "#c6f432";

function download(href: string, name: string) {
  const link = document.createElement("a");
  link.href = href;
  link.download = name;
  link.click();
}

function closeDate(endDate: string) {
  const date = new Date(`${endDate}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + 1);
  return `${date.getUTCMonth() + 1}.${date.getUTCDate()}`;
}

function wrap(ctx: CanvasRenderingContext2D, text: string, width: number) {
  const lines: string[] = [];
  let line = "";
  for (const char of text) {
    if (ctx.measureText(line + char).width > width && line) {
      lines.push(line);
      line = "";
    }
    line += char;
  }
  if (line) lines.push(line);
  return lines;
}

async function drawPoster(url: string, showName: string, period: string, venue: string) {
  const sans = getComputedStyle(document.body).fontFamily;
  const num = getComputedStyle(document.body).getPropertyValue("--font-nunito") || sans;
  await Promise.all([document.fonts.load(`900 72px ${sans}`, showName), document.fonts.load(`700 40px ${sans}`, "찍으면 공지 타임테이블 건의"), document.fonts.load(`900 36px ${num}`, period)]);
  const canvas = document.createElement("canvas");
  canvas.width = A4.width;
  canvas.height = A4.height;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, A4.width, A4.height);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const center = A4.width / 2;

  ctx.font = `700 30px ${sans}`;
  const badge = "공식 · 현장 안내";
  const badgeWidth = ctx.measureText(badge).width + 56;
  ctx.fillStyle = LIME;
  ctx.beginPath();
  ctx.roundRect(center - badgeWidth / 2, 150, badgeWidth, 64, 32);
  ctx.fill();
  ctx.fillStyle = INK;
  ctx.fillText(badge, center, 183);

  ctx.font = `900 72px ${sans}`;
  const titleLines = wrap(ctx, showName, A4.width - 240).slice(0, 2);
  titleLines.forEach((line, index) => ctx.fillText(line, center, 300 + index * 92));
  let y = 300 + titleLines.length * 92;

  ctx.font = `900 36px ${num}`;
  ctx.fillStyle = MUTED;
  ctx.fillText(`${period} · ${venue}`, center, y + 10);
  y += 90;

  const qr = document.createElement("canvas");
  await QRCode.toCanvas(qr, url, { width: 640, margin: 2, errorCorrectionLevel: "M" });
  ctx.drawImage(qr, center - 320, y, 640, 640);
  y += 640 + 90;

  ctx.fillStyle = INK;
  ctx.font = `700 46px ${sans}`;
  ctx.fillText("찍으면 공지 · 타임테이블 · 건의를", center, y);
  ctx.fillText("바로 볼 수 있어요", center, y + 66);
  y += 160;

  ctx.font = `400 30px ${sans}`;
  ctx.fillStyle = MUTED;
  ctx.fillText("앱 설치·로그인 없이 · 불편한 점은 건의로 남겨 주세요", center, y);

  ctx.font = `700 26px ${sans}`;
  ctx.fillStyle = "#b9b9c0";
  ctx.fillText("공연 모아보기", center, A4.height - 110);
  return canvas.toDataURL("image/png");
}

export function SiteQr({
  showId,
  initialCode,
  showName,
  startDate,
  endDate,
  venue,
}: {
  showId: number;
  initialCode: string;
  showName: string;
  startDate: string;
  endDate: string;
  venue: string;
}) {
  const origin = useSyncExternalStore(
    () => () => {},
    () => location.origin,
    () => null,
  );
  const [code, setCode] = useState(initialCode);
  const [svg, setSvg] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const url = origin && `${origin}/q/${code}`;
  const period = formatPeriod(startDate, endDate);

  useEffect(() => {
    if (!url) return;
    let alive = true;
    QRCode.toString(url, { type: "svg", margin: 0, errorCorrectionLevel: "M" }).then((value) => alive && setSvg(value));
    return () => {
      alive = false;
    };
  }, [url]);

  const downloadQr = async () => {
    if (!url) return;
    download(await QRCode.toDataURL(url, { width: 1200, margin: 2, errorCorrectionLevel: "M" }), `site-qr-${showId}.png`);
  };

  const downloadPoster = async () => {
    if (!url || busy) return;
    setBusy(true);
    try {
      download(await drawPoster(url, showName, period, venue), `site-qr-a4-${showId}.png`);
    } finally {
      setBusy(false);
    }
  };

  const regenerate = async () => {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    setError(null);
    const res = await fetch(`/api/organizer/shows/${showId}/site-code`, { method: "POST" });
    setConfirming(false);
    if (!res.ok) {
      setError("다시 만들지 못했어요. 다시 시도해 주세요.");
      return;
    }
    setCode((await res.json()).code);
  };

  return (
    <section className="flex flex-col gap-4 px-4 py-5 lg:mx-auto lg:w-full lg:max-w-160 lg:px-0 lg:py-8">
      <div className="flex flex-col gap-1">
        <h1 className="hidden font-display text-[22px] lg:block">현장 QR</h1>
        <p className="text-sm leading-relaxed text-muted">
          입구·부스·화장실에 붙여 주세요. 찍으면 공연 홈이 열리고 자동으로 참여돼요. 공연 기간({period.split(" — ")[0]} 0시 — {closeDate(endDate)} 정오)에는
          로그인 없이 건의를 쓸 수 있어요.
        </p>
      </div>

      <div className="flex flex-col items-center gap-3.5 rounded-3xl bg-[#f7f7f8] p-7">
        <div className="rounded-2xl bg-paper p-3.5">
          {svg ? (
            <div aria-label="현장 QR" role="img" className="size-60 [&>svg]:size-full" dangerouslySetInnerHTML={{ __html: svg }} />
          ) : (
            <div className="size-60 animate-pulse rounded-lg bg-pill motion-reduce:animate-none" />
          )}
        </div>
        <span className="font-num text-[13px] font-extrabold break-all text-muted">{url?.replace(/^https?:\/\//, "")}</span>
      </div>

      <div className="flex gap-2">
        <button type="button" onClick={downloadQr} className="press h-12 flex-1 cursor-pointer rounded-full bg-ink text-[15px] font-bold text-stub">
          QR 이미지 내려받기
        </button>
        <button
          type="button"
          onClick={downloadPoster}
          disabled={busy}
          className="press h-12 flex-1 cursor-pointer rounded-full bg-pill text-[15px] font-bold disabled:opacity-50"
        >
          인쇄용 A4 내려받기
        </button>
      </div>

      <div className="mt-2 flex items-center gap-3 pt-4.5 shadow-[inset_0_1px_0_var(--color-line)]">
        <span className="flex flex-1 flex-col gap-0.5">
          <b className="text-sm">QR 다시 만들기</b>
          <span className="text-xs leading-normal text-muted">
            {confirming ? "지금 붙인 QR은 더 이상 안 돼요. 한 번 더 누르면 바꿔요." : "QR 사진이 밖에 퍼졌을 때. 지금 붙인 QR은 더 이상 안 돼요."}
          </span>
        </span>
        {confirming && (
          <button type="button" onClick={() => setConfirming(false)} className="h-10 cursor-pointer px-2 text-sm text-muted">
            그만두기
          </button>
        )}
        <button
          type="button"
          onClick={regenerate}
          className={`h-10 shrink-0 cursor-pointer rounded-full px-4 text-sm font-bold ${
            confirming ? "bg-[#c0392b] text-stub" : "text-[#c0392b] shadow-[inset_0_0_0_1.5px_var(--color-line)]"
          }`}
        >
          {confirming ? "바꾸기" : "다시 만들기"}
        </button>
      </div>
      {error && (
        <p role="alert" className="text-sm text-muted">
          {error}
        </p>
      )}
    </section>
  );
}
