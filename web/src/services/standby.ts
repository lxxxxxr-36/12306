import type { SeatType } from '../types/train';
import type { Passenger } from '../types/order';

export type StandbyStatus = 'submitted' | 'matching' | 'success' | 'expired' | 'cancelled';
export interface StandbyRequest {
  id: string;
  origin: string;
  dest: string;
  date: string; // YYYY-MM-DD
  trainCode: string;
  passengers: Passenger[];
  seatPrefs: SeatType[];
  deadlineMinutes: number;
  priority: 'time' | 'price';
  deposit: number;
  status: StandbyStatus;
  createdAt: number;
  updatedAt: number;
  // 模拟用：成功时间点与过期时间点
  successTargetMs?: number;
  expireAtMs: number;
  matchedSeatType?: SeatType;
}

const KEY = 'standbys';
function loadList(): StandbyRequest[] {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; }
}
function saveList(list: StandbyRequest[]) { localStorage.setItem(KEY, JSON.stringify(list)); }

export interface CreateStandbyPayload {
  origin: string;
  dest: string;
  date: string;
  trainCode: string;
  passengers: Passenger[];
  seatPrefs: SeatType[];
  deadlineMinutes: number;
  priority: 'time' | 'price';
  deposit: number;
}

export function createStandby(payload: CreateStandbyPayload): StandbyRequest {
  const id = Math.random().toString(36).slice(2);
  const now = Date.now();
  const successAfter = 12_000 + Math.floor(Math.random() * 20_000);
  const req: StandbyRequest = {
    id,
    ...payload,
    status: 'submitted',
    createdAt: now,
    updatedAt: now,
    successTargetMs: now + successAfter,
    expireAtMs: now + payload.deadlineMinutes * 60_000,
  };
  const list = loadList();
  list.push(req);
  saveList(list);
  return req;
}

export function getStandby(id: string): StandbyRequest | undefined {
  return loadList().find(s => s.id === id);
}

export function listStandbys(): StandbyRequest[] { return loadList(); }

export function cancelStandby(id: string){
  const list = loadList();
  const idx = list.findIndex(s => s.id === id);
  if (idx >= 0) {
    list[idx].status = 'cancelled';
    list[idx].updatedAt = Date.now();
    saveList(list);
  }
}

export function payStandby(id: string): StandbyRequest | undefined {
  const list = loadList();
  const idx = list.findIndex(s => s.id === id);
  if (idx === -1) return undefined;
  const now = Date.now();
  const s = list[idx];
  if (s.status !== 'submitted') return s;
  s.status = 'matching';
  s.updatedAt = now;
  if (!s.successTargetMs) {
    s.successTargetMs = now + (12_000 + Math.floor(Math.random() * 20_000));
  }
  saveList(list);
  return s;
}

export function checkStandbyStatus(id: string): StandbyRequest | undefined {
  const list = loadList();
  const idx = list.findIndex(s => s.id === id);
  if (idx === -1) return undefined;
  const s = list[idx];
  const now = Date.now();
  if (s.status === 'matching') {
    if (now >= s.expireAtMs) {
      s.status = 'expired';
      s.updatedAt = now;
    } else if (s.successTargetMs && now >= s.successTargetMs) {
      s.status = 'success';
      s.updatedAt = now;
      // 简单选择一个席别作为匹配结果
      if (s.seatPrefs && s.seatPrefs.length > 0) {
        s.matchedSeatType = s.seatPrefs[Math.floor(Math.random() * s.seatPrefs.length)];
      }
    }
    saveList(list);
  }
  return s;
}
