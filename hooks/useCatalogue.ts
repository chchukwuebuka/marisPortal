"use client";

import { useContext } from "react";
import {
  CatalogueContext,
  type CatalogueContextValue,
} from "@/providers/CatalogueProvider";

export function useCatalogue(): CatalogueContextValue {
  const ctx = useContext(CatalogueContext);
  if (!ctx) {
    throw new Error("useCatalogue must be used within a CatalogueProvider");
  }
  return ctx;
}
