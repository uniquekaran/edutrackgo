// Local mock store for student leave applications. Same pattern as
// network-state — persists to localStorage; ready to swap for Supabase later.
import { useSyncExternalStore } from "react";

export type LeaveStatus = "pending" | "approved" | "rejected";

export interface LeaveApplication {
  id: string;
  studentName: string;
  course: string;
  reason: string;
  fromDate: string; // YYYY-MM-DD
  toDate: string;
  status: LeaveStatus;
  createdAt: number;
  reviewedAt?: number;
}

const KEY = "eduai-leaves-v1";

function seed(): LeaveApplication[] {
  const now = Date.now();
  return [
    {
      id: "l_" + Math.random().toString(36).slice(2, 8),
      studentName: "Aria Mehta",
      course: "B.Tech · CSE",
      reason: "Family function at hometown",
      fromDate: new Date(now + 86400000 * 2).toISOString().slice(0, 10),
      toDate: new Date(now + 86400000 * 4).toISOString().slice(0, 10),
      status: "pending",
      createdAt: now - 3600000,
    },
    {
      id: "l_" + Math.random().toString(36).slice(2, 8),
      studentName: "Rohan Verma",
      course: "B.Tech · ECE",
      reason: "Medical — viral fever, doctor's note attached",
      fromDate: new Date(now - 86400000).toISOString().slice(0, 10),
      toDate: new Date(now + 86400000).toISOString().slice(0, 10),
      status: "pending",
      createdAt: now - 7200000,
    },
    {
      id: "l_" + Math.random().toString(36).slice(2, 8),
      studentName: "Sara Khan",
      course: "BCA",
      reason: "Inter-college hackathon representing campus",
      fromDate: new Date(now + 86400000 * 6).toISOString().slice(0, 10),
      toDate: new Date(now + 86400000 * 8).toISOString().slice(0, 10),
      status: "pending",
      createdAt: now - 1800000,
    },
  ];
}

function load(): LeaveApplication[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  const s = seed();
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch {}
  return s;
}

let state: LeaveApplication[] = load();
const listeners = new Set<() => void>();

function emit() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {}
  listeners.forEach((l) => l());
}

export function useLeaves(): LeaveApplication[] {
  return useSyncExternalStore(
    (l) => { listeners.add(l); return () => { listeners.delete(l); }; },
    () => state,
    () => state,
  );
}

export function approveLeave(id: string) {
  state = state.map((l) => (l.id === id ? { ...l, status: "approved", reviewedAt: Date.now() } : l));
  emit();
}
export function rejectLeave(id: string) {
  state = state.map((l) => (l.id === id ? { ...l, status: "rejected", reviewedAt: Date.now() } : l));
  emit();
}
