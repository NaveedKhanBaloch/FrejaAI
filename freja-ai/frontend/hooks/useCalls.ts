"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { CallLog } from "@/types";

export function useCalls() {
  return useQuery({ queryKey: ["calls"], queryFn: () => api<CallLog[]>("/calls") });
}
