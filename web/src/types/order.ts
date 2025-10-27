export type OrderStatus = 'pending' | 'paid' | 'cancelled' | 'refunding';

export interface Passenger {
  name: string;
  idType: 'ID' | 'Passport';
  idNo: string;
  student?: boolean;
}

export interface OrderItem {
  trainCode: string;
  seatType: 'sw' | 'ydz' | 'edz' | 'wz';
  carriage?: number;
  seatNo?: string;
  price: number;
}

export interface Order {
  id: string;
  origin: string;
  dest: string;
  date: string; // YYYY-MM-DD
  passengers: Passenger[];
  item: OrderItem;
  status: OrderStatus;
  createdAt: number;
  // 新增：订单分组ID，用于往返或联程（同组两笔订单）
  groupId?: string;
}