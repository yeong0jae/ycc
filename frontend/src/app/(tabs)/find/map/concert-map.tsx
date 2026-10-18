"use client";

import Link from "next/link";
import Script from "next/script";
import { useEffect, useRef, useState, ViewTransition } from "react";
import { formatDday, formatPeriod } from "@/lib/format";
import type { Facility } from "@/lib/show-types";

type LatLng = object;
type Point = { x: number; y: number };
type KakaoMap = {
  setCenter(position: LatLng): void;
  panTo(position: LatLng): void;
  setLevel(level: number): void;
  getLevel(): number;
  getProjection(): {
    containerPointFromCoords(position: LatLng): Point;
    coordsFromContainerPoint(point: Point): LatLng;
  };
};
type CustomOverlay = { setMap(map: KakaoMap | null): void };
type KakaoMaps = {
  load(callback: () => void): void;
  LatLng: new (latitude: number, longitude: number) => LatLng;
  Point: new (x: number, y: number) => Point;
  Map: new (container: HTMLElement, options: { center: LatLng; level: number }) => KakaoMap;
  CustomOverlay: new (options: {
    position: LatLng;
    content: HTMLElement;
    yAnchor: number;
    zIndex: number;
    map: KakaoMap;
  }) => CustomOverlay;
  event: { addListener(target: KakaoMap, type: string, handler: () => void): void };
};

declare global {
  interface Window {
    kakao?: { maps: KakaoMaps };
  }
}

const SEOUL = { latitude: 37.5665, longitude: 126.978, level: 8 };
const NAME_VISIBLE_LEVEL = 6;
const MARKER_TOP_RATIO = 0.2;

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function shortName(name: string) {
  return name.replace(/\s*\(.*\)\s*$/, "");
}

function centerAbove(maps: KakaoMaps, map: KakaoMap, facility: Facility, height: number) {
  const projection = map.getProjection();
  const point = projection.containerPointFromCoords(new maps.LatLng(facility.latitude, facility.longitude));
  return projection.coordsFromContainerPoint(new maps.Point(point.x, point.y + height * (0.5 - MARKER_TOP_RATIO)));
}

type MarkerState = "named" | "count" | "active" | "dimmed";

function markerElement(facility: Facility, state: MarkerState, onClick: () => void) {
  const button = document.createElement("button");
  button.type = "button";
  const press = "transition-transform duration-150 active:scale-95 motion-reduce:transition-none motion-reduce:active:scale-100";
  button.setAttribute("aria-label", `${shortName(facility.name)} 공연 ${facility.shows.length}개`);
  button.addEventListener("click", onClick);

  const count = document.createElement("span");
  count.textContent = String(facility.shows.length);

  if (state === "dimmed" || state === "count") {
    button.className = `${press} flex h-7 min-w-7 items-center justify-center rounded-full px-1.5 font-mono text-[13px] shadow ${
      state === "dimmed" ? "bg-stub text-muted" : "bg-ink text-stub"
    }`;
    button.append(count);
    return button;
  }

  const active = state === "active";
  button.className = `${press} flex h-9 items-center gap-1.5 whitespace-nowrap rounded-full py-1 pr-3 pl-1 shadow-md ${
    active ? "animate-marker-pop bg-ink text-stub motion-reduce:animate-none" : "bg-stub text-ink"
  }`;
  count.className = `flex h-6.5 min-w-6.5 items-center justify-center rounded-full px-1 font-mono text-[13px] ${
    active ? "bg-stub text-ink" : "bg-ink text-stub"
  }`;
  const label = document.createElement("span");
  label.className = "text-[13px] font-semibold";
  label.textContent = shortName(facility.name);
  button.append(count, label);
  return button;
}

export function ConcertMap({
  facilities,
  appKey,
  initialFacilityId,
}: {
  facilities: Facility[];
  appKey: string;
  initialFacilityId: number | null;
}) {
  const container = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<KakaoMap | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [sheetId, setSheetId] = useState<number | null>(null);
  const [level, setLevel] = useState(SEOUL.level);
  const sheet = facilities.find((facility) => facility.id === sheetId);
  const sheetOpen = selectedId !== null;

  const init = () => {
    window.kakao?.maps.load(() => {
      const maps = window.kakao!.maps;
      const initial = facilities.find((facility) => facility.id === initialFacilityId);
      const created = new maps.Map(container.current!, {
        center: initial
          ? new maps.LatLng(initial.latitude, initial.longitude)
          : new maps.LatLng(SEOUL.latitude, SEOUL.longitude),
        level: initial ? NAME_VISIBLE_LEVEL : SEOUL.level,
      });
      maps.event.addListener(created, "click", () => setSelectedId(null));
      maps.event.addListener(created, "zoom_changed", () => setLevel(created.getLevel()));
      if (initial) {
        created.setCenter(centerAbove(maps, created, initial, container.current!.clientHeight));
        setLevel(NAME_VISIBLE_LEVEL);
        setSelectedId(initial.id);
        setSheetId(initial.id);
      }
      setMap(created);
    });
  };

  useEffect(() => {
    if (!map) return;
    const maps = window.kakao!.maps;
    const select = (facility: Facility) => {
      setSelectedId(facility.id);
      setSheetId(facility.id);
      const center = centerAbove(maps, map, facility, container.current!.clientHeight);
      if (prefersReducedMotion()) map.setCenter(center);
      else map.panTo(center);
    };
    const overlays = facilities.map((facility) => {
      const state: MarkerState =
        facility.id === selectedId
          ? "active"
          : selectedId !== null
            ? "dimmed"
            : level <= NAME_VISIBLE_LEVEL
              ? "named"
              : "count";
      return new maps.CustomOverlay({
        position: new maps.LatLng(facility.latitude, facility.longitude),
        content: markerElement(facility, state, () => select(facility)),
        yAnchor: 1,
        zIndex: state === "active" ? 2 : 1,
        map,
      });
    });
    return () => overlays.forEach((overlay) => overlay.setMap(null));
  }, [map, facilities, selectedId, level]);

  const recenter = () => {
    const maps = window.kakao?.maps;
    if (!map || !maps) return;
    map.setCenter(new maps.LatLng(SEOUL.latitude, SEOUL.longitude));
    map.setLevel(SEOUL.level);
    setLevel(SEOUL.level);
    setSelectedId(null);
  };

  if (!appKey) {
    return <p className="p-4 text-muted">KAKAO_MAP_KEY가 설정되지 않아 지도를 띄울 수 없어요.</p>;
  }

  return (
    <div className="relative flex-1">
      <Script
        src={`https://dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&autoload=false`}
        onReady={init}
      />
      <div ref={container} className="absolute inset-0 bg-line" />

      <section
        aria-label={sheet ? `${shortName(sheet.name)} 공연` : undefined}
        inert={!sheetOpen}
        className={`absolute inset-x-0 bottom-0 z-20 flex max-h-[60%] flex-col rounded-t-3xl bg-stub shadow-[0_-4px_20px_rgb(17_19_24/0.12)] transition-transform duration-300 ease-[cubic-bezier(0.2,0,0,1)] motion-reduce:transition-none ${
          sheetOpen ? "translate-y-0" : "translate-y-full"
        }`}
      >
        {sheet && (
          <>
            <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-4">
              <div>
                <h2 className="font-display text-2xl">{shortName(sheet.name)}</h2>
                {sheet.address && <p className="text-[13px] text-muted">{sheet.address}</p>}
              </div>
              <button
                type="button"
                aria-label="닫기"
                onClick={() => setSelectedId(null)}
                className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-paper transition-transform duration-150 active:scale-95 motion-reduce:transition-none motion-reduce:active:scale-100"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  aria-hidden="true"
                >
                  <path d="M6 6l12 12M18 6 6 18" />
                </svg>
              </button>
            </div>
            <div className="mx-5 border-t-2 border-dashed border-line" />
            <ul className="overflow-y-auto px-5 pb-28">
              {sheet.shows.map((show) => (
                <li key={show.id} className="border-b border-paper last:border-b-0">
                  <Link
                    href={`/shows/${show.id}`}
                    prefetch
                    className="flex min-h-21 items-center gap-3.5 py-2.5 transition-transform duration-150 active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100"
                  >
                    <ViewTransition name={`poster-${show.id}`} share="morph" default="none">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={show.posterUrl}
                        alt=""
                        className="h-16 w-12 shrink-0 rounded-lg object-cover"
                      />
                    </ViewTransition>
                    <span className="flex min-w-0 flex-1 flex-col gap-1">
                      <span className="font-display leading-snug">{show.name}</span>
                      <span className="font-mono text-[13px] text-muted">
                        {formatPeriod(show.startDate, show.endDate)}
                      </span>
                    </span>
                    <span className="shrink-0 rounded-full bg-ink px-2.5 py-0.5 font-mono text-xs text-stub">
                      {formatDday(show.startDate)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
      <div
        inert={sheetOpen}
        className={`absolute inset-x-4 bottom-28 z-10 flex items-center justify-between gap-3 rounded-2xl bg-stub px-4 py-3.5 shadow-[0_4px_16px_rgb(17_19_24/0.12)] transition-opacity duration-200 motion-reduce:transition-none ${
          sheetOpen ? "opacity-0" : "opacity-100"
        }`}
      >
        <p className="text-sm">공연장을 누르면 그곳의 콘서트가 보여요</p>
        <button
          type="button"
          aria-label="서울 시내로"
          onClick={recenter}
          className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-line transition-transform duration-150 active:scale-95 motion-reduce:transition-none motion-reduce:active:scale-100"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="3" />
            <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
          </svg>
        </button>
      </div>
    </div>
  );
}
