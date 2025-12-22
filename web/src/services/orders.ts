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

// 变更到站：允许修改 dest（待支付或已支付且未发车）
export function changeOrderDest(id: string, newDest: string): Order | undefined {
  const order = getOrder(id);
  if (!order) return undefined;
  if (!newDest || newDest === order.dest) return order;
  const train = getTrainByCode(order.item.trainCode);
  if (order.status === 'paid' && train) {
    const departMs = combineLocalDateTimeMs(order.date, train.depart);
    if (departMs <= Date.now()) {
      // 已发车不允许变更到站
      return undefined;
    }
  }
  const list = read();
  const next = list.map<Order>(o => (o.id === id ? { ...o, dest: newDest, changeDestCount: (o.changeDestCount ?? 0) + 1 } : o));
  write(next);
  dispatchOrdersChange(next);
  return next.find(o => o.id === id);
}

// 改签（同车次同席别，仅改出发日期）
// 规则（对齐12306官网的简化实现）：
// - 每张票仅可改签一次（rescheduleCount<1）
// - 已办理“变更到站”的车票不再办理改签（changeDestCount>0 禁止）
// - 新日期不得早于当天
// - 时间窗口：
//   * 开车前48小时及以上：允许改签至预售期内其他日期（此处不限制上限）
//   * 开车前不足48小时：仅允许改签至票面日期当日或更早的日期（不允许改签到票面日期之后的日期）
//   * 开车后至票面日期当日24:00：仅允许当日（同一日期）范围；由于本系统仅记录日期，不支持时刻改签，故仅允许同日改签（等效为限制）
export function rescheduleOrderDate(id: string, newDate: string): Order | undefined {
  const order = getOrder(id);
  if (!order) return undefined;
  if (!newDate || newDate === order.date) return order;
  const todayLocalISO = (() => { const d = new Date(); d.setHours(0,0,0,0); const off = d.getTimezoneOffset()*60000; return new Date(d.getTime()-off).toISOString().split('T')[0]; })();
  if (newDate < todayLocalISO) return undefined; // 不允许改签到过去
  if ((order.rescheduleCount ?? 0) >= 1) return undefined; // 仅允许一次改签
  if ((order.changeDestCount ?? 0) > 0) return undefined; // 已变更到站不允许改签
  const train = getTrainByCode(order.item.trainCode);
  const departMs = train ? combineLocalDateTimeMs(order.date, train.depart) : 0;
  const now = Date.now();
  if (departMs > 0) {
    const msLeft = departMs - now;
    const hoursLeft = msLeft / (60 * 60 * 1000);
    if (msLeft > 0) {
      // 未发车
      if (hoursLeft < 48) {
        // 不足48小时：不允许改签到票面日期之后
        if (newDate > order.date) return undefined;
      }
      // >=48小时：允许到任何未来日期（此处不限制预售期上限）
    } else {
      // 已发车：仅允许同日（系统仅日期维度）
      if (newDate !== order.date) return undefined;
    }
  }
  const list = read();
  const next = list.map<Order>(o => (o.id === id ? { ...o, date: newDate, rescheduleCount: (o.rescheduleCount ?? 0) + 1 } : o));
  write(next);
  dispatchOrdersChange(next);
  return next.find(o => o.id === id);
}

export function clearOrders(){ write([]); dispatchOrdersChange([]); }
