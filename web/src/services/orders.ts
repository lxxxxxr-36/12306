import type { Order, OrderStatus } from '../types/order';

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
  let updated: Order | undefined;
  const next = list.map(o => {
    if (o.id === id) {
      updated = { ...o, status };
      return updated;
    }
    return o;
  });
  write(next);
  dispatchOrdersChange(next);
  return updated;
}

export function payOrder(id: string): Order | undefined {
  const order = getOrder(id);
  if (!order) return undefined;
  // 简化：随机分配车厢与座位号
  const carriage = Math.floor(Math.random() * 16) + 1; // 1-16号车厢
  const seatLetters = ['A','B','C','D','F'];
  const seatNo = String(Math.floor(Math.random() * 16) + 1).padStart(2,'0') + seatLetters[Math.floor(Math.random()*seatLetters.length)];
  const list = read();
  const next = list.map(o => {
    if (o.id === id) {
      return { ...o, status: 'paid', item: { ...o.item, carriage, seatNo } };
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

export function clearOrders(){ write([]); dispatchOrdersChange([]); }