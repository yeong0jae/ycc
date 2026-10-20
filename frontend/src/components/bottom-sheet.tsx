"use client";

import { type ReactNode, useLayoutEffect, useRef } from "react";

export function BottomSheet({ label, onClose, children, className = "" }: { label: string; onClose: () => void; children: ReactNode; className?: string }) {
  const dialog = useRef<HTMLDialogElement>(null);

  useLayoutEffect(() => {
    dialog.current?.showModal();
  }, []);

  return (
    <dialog
      ref={dialog}
      aria-label={label}
      onClose={onClose}
      onClick={(event) => event.target === dialog.current && dialog.current.close()}
      className={`sheet inset-x-0 top-auto bottom-0 mx-auto mb-0 max-h-[92dvh] w-full max-w-2xl rounded-t-3xl bg-paper p-0 text-ink ${className}`}
    >
      {children}
    </dialog>
  );
}
