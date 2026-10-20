"use client";

import { useEffect } from "react";
import { syncAccount } from "@/lib/participation";

export function AccountSync() {
  useEffect(() => {
    syncAccount();
  }, []);
  return null;
}
