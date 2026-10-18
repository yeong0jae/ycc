export const RESTORE_KEY = "ycc:restore-scroll";
export const SCROLL_KEY = "ycc:find-scroll";

const MAX_WAIT_MS = 1000;
const POLL_MS = 16;

function mark(element: HTMLElement | null, name: string) {
  if (!element) return;
  element.style.setProperty("view-transition-name", name);
  element.style.setProperty("view-transition-class", "morph");
}

function unmark(id: string) {
  document.querySelectorAll<HTMLElement>(`[data-poster="${id}"]`).forEach((element) => {
    element.style.removeProperty("view-transition-name");
    element.style.removeProperty("view-transition-class");
  });
}

export function backWithPosterMorph(back: () => void) {
  sessionStorage.setItem(RESTORE_KEY, "1");
  setTimeout(() => sessionStorage.removeItem(RESTORE_KEY), MAX_WAIT_MS * 2);
  const from = document.querySelector<HTMLElement>("[data-poster]");
  const id = from?.dataset.poster;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!id || !document.startViewTransition || reduced) return back();

  const name = `poster-${id}`;
  const path = window.location.pathname;
  mark(from, name);
  const transition = document.startViewTransition(
    () =>
      new Promise<void>((resolve) => {
        const started = performance.now();
        const wait = () => {
          if (window.location.pathname === path && performance.now() - started < MAX_WAIT_MS) {
            setTimeout(wait, POLL_MS);
            return;
          }
          setTimeout(() => {
            mark(document.querySelector<HTMLElement>(`[data-poster="${id}"]`), name);
            resolve();
          }, POLL_MS);
        };
        back();
        wait();
      }),
  );
  const cleanup = () => unmark(id);
  transition.finished.then(cleanup, cleanup);
}
