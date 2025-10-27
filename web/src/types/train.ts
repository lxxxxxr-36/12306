export type SeatType = 'sw' | 'ydz' | 'edz' | 'wz';
export interface Train {
  code: string;
  origin: string;
  dest: string;
  depart: string; // HH:mm or HH:mm+1
  arrive: string; // HH:mm or HH:mm+1
  duration: string; // 4h30m
  types: Partial<Record<SeatType, number>>; // 余票数量
  price: Partial<Record<SeatType, number>>; // 票价
}

export interface SearchQuery {
  origin: string;
  dest: string;
  date: string; // YYYY-MM-DD
  hs?: boolean;
  stu?: boolean;
  // 新增：票种（单程/往返）与返程日期（往返需要）
  ticketType?: 'oneway' | 'roundtrip';
  returnDate?: string; // YYYY-MM-DD
}