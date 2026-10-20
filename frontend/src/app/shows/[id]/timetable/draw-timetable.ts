import { formatDay, formatMinute, STAGE_COLORS, STAR_COLOR, type TimetableSlot, type TimetableStage } from "@/lib/timetable-types";

const SCALE = 3;
const BASE_WIDTH = 390;
const STAGE_WIDTH = 86;
const PAD_LEFT = 4;
const PAD_RIGHT = 8;
const AXIS_WIDTH = 22;
const COLUMN_GAP = 3;
const STAGE_HEADER = 30;
const STAGE_HEADER_GAP = 6;
const LABEL_HEIGHT = 16;
const PER_HOUR = 80;
const SIDE = 20;

const INK = "#111111";
const MUTED = "#6b6b72";
const LINE = "#e4e4e8";
const PILL = "#f1f1f3";
const PAPER = "#ffffff";

export type TimetableSheet = {
  showName: string;
  venue: string;
  day: string;
  stages: TimetableStage[];
  slots: TimetableSlot[];
  range: { start: number; end: number };
  starredIds: ReadonlySet<number>;
  footer: string;
  host: string;
};

function wrap(ctx: CanvasRenderingContext2D, text: string, width: number) {
  const lines: string[] = [];
  let line = "";
  for (const word of text.split(" ")) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width <= width) {
      line = next;
      continue;
    }
    if (line) lines.push(line);
    line = "";
    for (const char of word) {
      if (ctx.measureText(line + char).width > width && line) {
        lines.push(line);
        line = "";
      }
      line += char;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function truncate(ctx: CanvasRenderingContext2D, text: string, width: number) {
  if (ctx.measureText(text).width <= width) return text;
  let cut = text;
  while (cut && ctx.measureText(`${cut}…`).width > width) cut = cut.slice(0, -1);
  return `${cut}…`;
}

export async function drawTimetable(sheet: TimetableSheet) {
  const styles = getComputedStyle(document.body);
  const sans = styles.fontFamily;
  const num = styles.getPropertyValue("--font-nunito") || sans;
  const font = (weight: number, size: number, family: string) => `${weight} ${size}px ${family}`;

  const starred = sheet.slots.filter((slot) => sheet.starredIds.has(slot.id));
  const headline = `${formatDay(sheet.day)} · ${sheet.venue}`;
  const starLine = `내가 볼 순서 ${starred.length}개`;
  await Promise.all([
    document.fonts.load(font(900, 13, num), headline),
    document.fonts.load(font(900, 24, sans), sheet.showName),
    document.fonts.load(font(400, 12, sans), starLine),
    document.fonts.load(font(900, 11, num), sheet.stages.map((stage) => stage.name).join("")),
    document.fonts.load(font(700, 12, sans), sheet.slots.map((slot) => slot.artist).join("")),
    document.fonts.load(font(900, 10, num), "0123456789:~★"),
    document.fonts.load(font(700, 11, sans), sheet.footer),
  ]).catch(() => {});

  const width = Math.max(BASE_WIDTH, PAD_LEFT + PAD_RIGHT + AXIS_WIDTH + sheet.stages.length * STAGE_WIDTH);
  const gridTop = starred.length > 0 ? 122 : 100;
  const bodyTop = gridTop + STAGE_HEADER + STAGE_HEADER_GAP;
  const toY = (minute: number) => bodyTop + LABEL_HEIGHT + ((minute - sheet.range.start) / 60) * PER_HOUR;
  const bodyBottom = toY(sheet.range.end);
  const footerLine = bodyBottom + 26;
  const height = footerLine + 14 + 26 + 20;

  const canvas = document.createElement("canvas");
  canvas.width = width * SCALE;
  canvas.height = height * SCALE;
  const ctx = canvas.getContext("2d")!;
  ctx.scale(SCALE, SCALE);
  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, width, height);
  ctx.textBaseline = "alphabetic";

  ctx.fillStyle = MUTED;
  ctx.font = font(900, 13, num);
  ctx.fillText(truncate(ctx, headline, width - SIDE * 2), SIDE, 42);
  ctx.fillStyle = INK;
  ctx.font = font(900, 24, sans);
  ctx.fillText(truncate(ctx, sheet.showName, width - SIDE * 2), SIDE, 75);
  if (starred.length > 0) {
    ctx.font = font(900, 12, sans);
    ctx.fillStyle = STAR_COLOR;
    ctx.fillText("★", SIDE, 100);
    const starWidth = ctx.measureText("★ ").width;
    ctx.font = font(400, 12, sans);
    ctx.fillStyle = MUTED;
    ctx.fillText(starLine, SIDE + starWidth, 100);
  }

  const columnsLeft = PAD_LEFT + AXIS_WIDTH + COLUMN_GAP;
  const columnWidth = (width - columnsLeft - PAD_RIGHT - COLUMN_GAP * (sheet.stages.length - 1)) / sheet.stages.length;
  const columnX = (index: number) => columnsLeft + index * (columnWidth + COLUMN_GAP);

  ctx.font = font(900, 11, num);
  ctx.textBaseline = "middle";
  for (let minute = sheet.range.start; minute <= sheet.range.end; minute += 60) {
    ctx.fillStyle = INK;
    ctx.fillText(String(Math.floor(minute / 60) % 24), PAD_LEFT, toY(minute));
  }

  sheet.stages.forEach((stage, index) => {
    const x = columnX(index);
    const colors = STAGE_COLORS[index % STAGE_COLORS.length];
    ctx.fillStyle = colors.dark;
    ctx.beginPath();
    ctx.roundRect(x, gridTop, columnWidth, STAGE_HEADER, 6);
    ctx.fill();
    ctx.fillStyle = PAPER;
    ctx.font = font(900, 11, num);
    ctx.textAlign = "center";
    ctx.fillText(truncate(ctx, stage.name, columnWidth - 8), x + columnWidth / 2, gridTop + STAGE_HEADER / 2);
    ctx.textAlign = "left";

    for (let minute = sheet.range.start; minute < sheet.range.end; minute += 15) {
      ctx.fillStyle = minute % 60 === 0 ? LINE : PILL;
      ctx.fillRect(x, toY(minute), columnWidth, 1);
    }
    ctx.fillStyle = LINE;
    ctx.fillRect(x, bodyBottom, columnWidth, 1);

    sheet.slots
      .filter((slot) => slot.stageId === stage.id)
      .sort((a, b) => a.start - b.start)
      .forEach((slot, order) => {
        const top = toY(slot.start);
        const blockHeight = Math.max(toY(slot.end) - top, 14);
        const dark = order % 2 === 1;
        ctx.fillStyle = dark ? colors.dark : colors.light;
        ctx.fillRect(x, top, columnWidth, blockHeight);

        ctx.save();
        ctx.beginPath();
        ctx.rect(x, top, columnWidth, blockHeight);
        ctx.clip();
        ctx.fillStyle = dark ? PAPER : INK;
        ctx.font = font(700, 12, sans);
        ctx.textBaseline = "top";
        wrap(ctx, slot.artist, columnWidth - 10).forEach((line, i) => ctx.fillText(line, x + 5, top + 5 + i * 15));
        ctx.restore();

        const isStar = sheet.starredIds.has(slot.id);
        const label = `${formatMinute(slot.start)}~${isStar ? " ★" : ""}`;
        ctx.font = font(900, 10, num);
        const tagWidth = ctx.measureText(label).width + 8;
        ctx.fillStyle = isStar ? STAR_COLOR : PAPER;
        ctx.beginPath();
        ctx.roundRect(x, top - LABEL_HEIGHT + 1, tagWidth, 14, 3);
        ctx.fill();
        ctx.fillStyle = isStar ? PAPER : INK;
        ctx.textBaseline = "middle";
        ctx.fillText(label, x + 4, top - LABEL_HEIGHT + 8.5);
      });
  });

  ctx.fillStyle = LINE;
  ctx.fillRect(SIDE, footerLine, width - SIDE * 2, 1);
  ctx.font = font(700, 11, sans);
  const pillWidth = ctx.measureText(sheet.footer).width + 20;
  ctx.fillStyle = PILL;
  ctx.beginPath();
  ctx.roundRect(SIDE, footerLine + 14, pillWidth, 26, 6);
  ctx.fill();
  ctx.fillStyle = INK;
  ctx.fillText(sheet.footer, SIDE + 10, footerLine + 27);
  ctx.font = font(400, 11, sans);
  ctx.fillStyle = MUTED;
  ctx.textAlign = "right";
  ctx.fillText(sheet.host, width - SIDE, footerLine + 27);

  return new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
}
