"use client";

import { useContext } from "react";
import {
  ApplicationContext,
  type ApplicationContextValue,
} from "@/providers/ApplicationProvider";

export function useApplication(): ApplicationContextValue {
  const ctx = useContext(ApplicationContext);
  if (!ctx) {
    throw new Error("useApplication must be used within an ApplicationProvider");
  }
  return ctx;
}
