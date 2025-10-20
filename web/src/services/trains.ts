import type { SearchQuery, Train, SeatType } from '../types/train';
import { popularCities } from '../constants/cities';

function pad(n: number) { return String(n).padStart(2, '0'); }
function addMinutes(time: string, mins: number) {
  const [hStr, mStr] = time.split(':'), h = parseInt(hStr, 10), m = parseInt(mStr, 10);
  const total = h * 60 + m + mins;
  const nh = Math.floor(total / 60) % 24;
  const nm = total % 60;
  const crossDay = Math.floor(total / 60) >= 24 ? '+1' : '';
  return `${pad(nh)}:${pad(nm)}${crossDay}`;
}

let seq = 100;
function genTrain(prefix: 'G' | 'D', origin: string, dest: string, departHour: number): Train {
  const code = `${prefix}${seq++}`;
  const depart = `${pad(departHour)}:${prefix === 'G' ? '00' : '15'}`;
  const arrive = addMinutes(depart, prefix === 'G' ? 270 : 390); // 4.5h or 6.5h
  const duration = prefix === 'G' ? '4h30m' : '6h30m';
  const types = prefix === 'G'
    ? { sw: 4, ydz: 12, edz: 60, wz: 0 }
    : { sw: 0, ydz: 0, edz: 50, wz: 8 };
  const price = prefix === 'G'
    ? { sw: 960, ydz: 480, edz: 320 }
    : { edz: 280 };
  return { code, origin, dest, depart, arrive, duration, types, price };
}

function generateAllTrains(): Train[] {
  const out: Train[] = [];
  popularCities.forEach((a, i) => {
    popularCities.forEach((b, j) => {
      if (i === j) return;
      // 为每一对城市生成两趟列车（G/D），双向覆盖
      out.push(genTrain('G', a, b, 7 + ((i + j) % 8))); // 07:00 - 14:30 之间
      out.push(genTrain('D', a, b, 9 + ((i + j) % 8))); // 09:15 - 18:45 之间
    });
  });
  return out;
}

const ALL_TRAINS: Train[] = generateAllTrains();

export async function fetchTrains(query: SearchQuery): Promise<Train[]> {
  await new Promise(r => setTimeout(r, 300));
  let data = ALL_TRAINS.filter(t => (
    (!query.origin || t.origin === query.origin) &&
    (!query.dest || t.dest === query.dest)
  ));
  if (query.hs) data = data.filter(t => /^G|^D/.test(t.code));
  return data;
}

// 新增：预订后扣减对应席别的余票（不低于0）
export function decrementInventory(trainCode: string, seatType: SeatType, amount: number = 1): number {
  const t = ALL_TRAINS.find(x => x.code === trainCode);
  if (!t) return 0;
  const cur = t.types[seatType] ?? 0;
  const next = Math.max(0, cur - amount);
  t.types[seatType] = next;
  return next;
}

// 新增：退票后恢复对应席别的余票
export function restoreInventory(trainCode: string, seatType: SeatType, amount: number = 1): number {
  const t = ALL_TRAINS.find(x => x.code === trainCode);
  if (!t) return 0;
  const cur = t.types[seatType] ?? 0;
  const next = cur + amount;
  t.types[seatType] = next;
  return next;
}