// Local mock state for the EduAI Network parallel flow (persist to localStorage).
// Structured so the same shape can be replaced by Supabase queries later.
import { useSyncExternalStore } from "react";

export type ReqStatus = "pending" | "approved" | "rejected";

export interface EnrollmentRequest {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  university: string;
  course: string;
  year: string;
  section: string;
  receiptDataUrl?: string;
  receiptName?: string;
  status: ReqStatus;
  rollNumber?: string;
  rejectionReason?: string;
  createdAt: number;
}

export interface ChatMessage {
  id: string;
  fromId: string;
  toId: string;
  body: string;
  reported?: boolean;
  createdAt: number;
}

interface NetState {
  requests: EnrollmentRequest[];
  messages: ChatMessage[];
}

const KEY = "eduai-network-v1";

function load(): NetState {
  if (typeof window === "undefined") return { requests: [], messages: [] };
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { requests: [], messages: [] };
}

let state: NetState = load();
const listeners = new Set<() => void>();

function emit() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {}
  listeners.forEach((l) => l());
}

export const netStore = {
  subscribe(l: () => void) { listeners.add(l); return () => listeners.delete(l); },
  get() { return state; },
  set(u: (s: NetState) => NetState) { state = u(state); emit(); },
};

export function useNetStore<T>(sel: (s: NetState) => T): T {
  return useSyncExternalStore(netStore.subscribe, () => sel(netStore.get()), () => sel(state));
}

// helpers
export function submitEnrollment(input: Omit<EnrollmentRequest, "id" | "status" | "createdAt">): EnrollmentRequest {
  const req: EnrollmentRequest = {
    ...input,
    id: "req_" + Math.random().toString(36).slice(2, 10),
    status: "pending",
    createdAt: Date.now(),
  };
  netStore.set((s) => ({ ...s, requests: [req, ...s.requests.filter(r => r.userId !== input.userId)] }));
  return req;
}
export function approveRequest(id: string) {
  netStore.set((s) => ({
    ...s,
    requests: s.requests.map((r) =>
      r.id === id
        ? {
            ...r,
            status: "approved",
            rollNumber: `EDU-${r.course.replace(/\W/g, "").slice(0, 3).toUpperCase()}-${String(Math.floor(Math.random() * 900) + 100)}`,
          }
        : r,
    ),
  }));
}
export function rejectRequest(id: string, reason?: string) {
  netStore.set((s) => ({
    ...s,
    requests: s.requests.map((r) => (r.id === id ? { ...r, status: "rejected", rejectionReason: reason } : r)),
  }));
}
export function sendMessage(fromId: string, toId: string, body: string) {
  const msg: ChatMessage = {
    id: "m_" + Math.random().toString(36).slice(2, 10),
    fromId, toId, body: body.trim(), createdAt: Date.now(),
  };
  netStore.set((s) => ({ ...s, messages: [...s.messages, msg] }));
}
export function reportMessage(id: string) {
  netStore.set((s) => ({
    ...s,
    messages: s.messages.map((m) => (m.id === id ? { ...m, reported: true } : m)),
  }));
}
export function myRequest(userId: string): EnrollmentRequest | undefined {
  return state.requests.find((r) => r.userId === userId);
}
