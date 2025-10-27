import type { Order, OrderStatus } from '../types/order';
import type { SeatType } from '../types/train';
import { restoreInventory, getTrainByCode } from './trains';

const KEY = 'orders';

function read(): Order[] {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; }
}
function write(list: Order[]) {
  localStorage.setItem(KEY, JSON.stringify(list));
}
function dispatchOrdersChange(list: Order[]) {
  window.dispatchEvent(new CustomEvent('orderschange', { detail: { orders: list } }));
}

// 组合本地日期+时间为毫秒时间戳（支持+1跨天）
function combineLocalDateTimeMs(dateStr: string, timeStr: string): number {
  if (!dateStr || !timeStr) return 0;
  const [y, m, d] = dateStr.split('-').map(Number);
  const nextDay = timeStr.includes('+1');
  const [hh, mm] = timeStr.replace('+1','').split(':').map(Number);
  const dt = new Date(y, (m-1), d, hh, mm, 0, 0);
  if (nextDay) dt.setDate(dt.getDate() + 1);
  return dt.getTime();
}

export function getOrders(): Order[] {
  return read().sort((a,b) => b.createdAt - a.createdAt);
}

export function getOrder(id: string): Order | undefined {
  return read().find(o => o.id === id);
}

export function addOrder(order: Order): Order {
  const list = read();
  list.push(order);
  write(list);
  dispatchOrdersChange(list);
  return order;
}

export function setOrderStatus(id: string, status: OrderStatus): Order | undefined {
  const list = read();
  const next = list.map<Order>(o => (o.id === id ? { ...o, status } : o));
  write(next);
  dispatchOrdersChange(next);
  return next.find(o => o.id === id);
}

export function payOrder(id: string): Order | undefined {
  const order = getOrder(id);
  if (!order) return undefined;
  // 简化：随机分配车厢与座位号
  const carriage = Math.floor(Math.random() * 16) + 1; // 1-16号车厢
  const seatLetters = ['A','B','C','D','F'];
  const seatNo = String(Math.floor(Math.random() * 16) + 1).padStart(2,'0') + seatLetters[Math.floor(Math.random()*seatLetters.length)];
  const list = read();
  const next = list.map<Order>(o => {
    if (o.id === id) {
      return { ...o, status: 'paid' as OrderStatus, item: { ...o.item, carriage, seatNo } };
    }
    return o;
  });
  write(next);
  dispatchOrdersChange(next);
  return next.find(o => o.id === id);
}

export function cancelOrder(id: string): Order | undefined {
  return setOrderStatus(id, 'cancelled');
}

export function refundOrder(id: string): Order | undefined {
  const order = getOrder(id);
  if (!order || order.status !== 'paid') return undefined;
  const train = getTrainByCode(order.item.trainCode);
  if (train) {
    const departMs = combineLocalDateTimeMs(order.date, train.depart);
    if (departMs - Date.now() < 60 * 60 * 1000) {
      // 距发车不足1小时，不允许退票
      return undefined;
    }
  }
  // 先标记退票中
  setOrderStatus(id, 'refunding');
  // 模拟退票耗时，完成后恢复余票并标记取消
  setTimeout(() => {
    const latest = getOrder(id);
    if (!latest) return;
    restoreInventory(latest.item.trainCode, latest.item.seatType as SeatType, latest.passengers.length);
    setOrderStatus(id, 'cancelled');
  }, 800);
  return getOrder(id);
}

export function clearOrders(){ write([]); dispatchOrdersChange([]); }