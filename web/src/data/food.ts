export type TrainProduct = { id: string; name: string; price: number; tag?: string };
export type MerchantProduct = { id: string; name: string; price: number };
export type MerchantStatus = 'open' | 'rest';
export type Merchant = {
  id: string;
  name: string;
  city: string;
  status: MerchantStatus;
  phone?: string;
  hours?: string;
  startFee?: number;
  deliveryFee?: number;
  products: MerchantProduct[];
};

export function getTrainProducts(trainCode: string): TrainProduct[] {
  const base = [
    { id: 'tp-40', name: '40元套餐', price: 40, tag: '特惠' },
    { id: 'tp-30', name: '30元套餐', price: 30, tag: '简餐' },
    { id: 'tp-15', name: '15元餐盒', price: 15, tag: '轻食' },
    { id: 'tp-50', name: '商务简餐', price: 50, tag: '热门' },
  ];
  return base.map((p, idx) => ({ ...p, id: `${p.id}-${trainCode || 'GEN'}-${idx}` }));
}

const SAMPLE_MERCHANTS: Record<string, Merchant[]> = {
  '上海': [
    { id: 'm-sh-yhdw', name: '永和大王（上海虹桥站店）', city: '上海', status: 'open', phone: '18956186964', hours: '10:00-20:00', startFee: 0, deliveryFee: 8, products: [
      { id: 'p-yhdw-10', name: '大王卤肉饭', price: 28 },
      { id: 'p-yhdw-11', name: '咖喱鸡腿饭套餐', price: 51 },
      { id: 'p-yhdw-12', name: '特惠地瓜丸', price: 2.9 },
    ] },
    { id: 'm-sh-xlcy', name: '上海兴旅餐饮（徐州东站店）', city: '上海', status: 'open', phone: '021-88990011', hours: '09:00-20:00', startFee: 0, deliveryFee: 8, products: [
      { id: 'p-xlcy-10', name: '兴旅招牌红烧牛肉饭', price: 32 },
      { id: 'p-xlcy-11', name: '扬州炒饭套餐', price: 29 },
      { id: 'p-xlcy-12', name: '小酥肉双拼饭', price: 35 },
      { id: 'p-xlcy-13', name: '绿豆沙饮品', price: 6 },
    ] },
    { id: 'm-sh-zgf', name: '真功夫（上海虹桥站）', city: '上海', status: 'open', phone: '021-88886666', hours: '09:00-21:00', startFee: 0, deliveryFee: 8, products: [
      { id: 'p-zgf-10', name: '功夫牛肉饭', price: 39 },
      { id: 'p-zgf-11', name: '宫保鸡丁饭', price: 32 },
    ] },
    { id: 'm-sh-dks', name: '德克士（上海虹桥站）', city: '上海', status: 'rest', phone: '021-77775555', hours: '休息中', startFee: 0, deliveryFee: 8, products: [
      { id: 'p-dks-10', name: '香辣鸡腿堡套餐', price: 36 },
    ] },
  ],
  '南京': [
    { id: 'm-nj-rykz', name: '如意客栈（南京南站）', city: '南京', status: 'open', phone: '025-66668888', hours: '08:00-18:00', startFee: 0, deliveryFee: 6, products: [
      { id: 'p-rykz-10', name: '招牌牛肉面', price: 26 },
      { id: 'p-rykz-11', name: '鸡腿便当', price: 28 },
    ] },
    { id: 'm-nj-dcs', name: '德克士（南京南站）', city: '南京', status: 'rest', phone: '025-55557777', hours: '休息中', startFee: 0, deliveryFee: 6, products: [
      { id: 'p-nj-dks-10', name: '鸡排饭', price: 29 },
    ] },
  ],
  '北京': [
    { id: 'm-bj-zlmlt', name: '张亮麻辣烫（北京站）', city: '北京', status: 'open', phone: '010-66668888', hours: '10:00-20:00', startFee: 0, deliveryFee: 7, products: [
      { id: 'p-zl-10', name: '麻辣烫套餐', price: 35 },
      { id: 'p-zl-11', name: '牛肉粉丝汤', price: 24 },
    ] },
    { id: 'm-bj-sxxc', name: '沙县小吃（北京站）', city: '北京', status: 'rest', phone: '010-55557777', hours: '休息中', startFee: 0, deliveryFee: 7, products: [
      { id: 'p-sx-10', name: '拌面套餐', price: 22 },
    ] },
  ],
};

export function getMerchants(city: string): Merchant[] {
  const key = Object.keys(SAMPLE_MERCHANTS).find(k => city.includes(k)) || city;
  const list = SAMPLE_MERCHANTS[key];
  if (list && list.length) return list;
  return [
    { id: `m-${city}-open`, name: `${city}示例商家A`, city, status: 'open', phone: '000-0000', hours: '09:00-19:00', startFee: 0, deliveryFee: 5, products: [
      { id: `p-${city}-a1`, name: '示例套餐A', price: 29 },
      { id: `p-${city}-a2`, name: '示例套餐B', price: 35 },
    ] },
    { id: `m-${city}-rest`, name: `${city}示例商家B`, city, status: 'rest', phone: '000-0001', hours: '休息中', startFee: 0, deliveryFee: 5, products: [
      { id: `p-${city}-b1`, name: '示例套餐C', price: 25 },
    ] },
  ];
}

export function getMerchantById(id: string): Merchant | undefined {
  for (const arr of Object.values(SAMPLE_MERCHANTS)) {
    const m = arr.find(x => x.id === id);
    if (m) return m;
  }
  return undefined;
}

// ---- 购物车（本地存储） ----
export type CartItem = { merchantId: string; productId: string; name: string; price: number; qty: number };
const CART_KEY = 'foodCart';
function loadCart(): CartItem[] { try { return JSON.parse(localStorage.getItem(CART_KEY) || '[]'); } catch { return []; } }
function saveCart(items: CartItem[]) { localStorage.setItem(CART_KEY, JSON.stringify(items)); }

export function getCart(merchantId?: string): CartItem[] {
  const list = loadCart();
  return merchantId ? list.filter(i => i.merchantId === merchantId) : list;
}
export function clearCart(merchantId?: string): void {
  if (!merchantId) { saveCart([]); return; }
  saveCart(loadCart().filter(i => i.merchantId !== merchantId));
}
export function setCartItemQty(merchantId: string, productId: string, qty: number): CartItem[] {
  const list = loadCart();
  const idx = list.findIndex(i => i.merchantId === merchantId && i.productId === productId);
  if (qty <= 0) {
    if (idx >= 0) list.splice(idx, 1);
    saveCart(list); return list;
  }
  if (idx >= 0) {
    list[idx].qty = qty;
  } else {
    const m = getMerchantById(merchantId);
    const p = m?.products.find(x => x.id === productId);
    if (!p) return list;
    list.push({ merchantId, productId, name: p.name, price: p.price, qty });
  }
  saveCart(list); return list;
}
export function addToCart(merchantId: string, productId: string, delta: number = 1): CartItem[] {
  const list = loadCart();
  const idx = list.findIndex(i => i.merchantId === merchantId && i.productId === productId);
  const cur = idx >= 0 ? list[idx].qty : 0;
  const next = Math.max(0, cur + delta);
  return setCartItemQty(merchantId, productId, next);
}
export function cartTotal(merchantId?: string): number {
  return getCart(merchantId).reduce((s,i)=> s + i.price * i.qty, 0);
}
export function cartCount(merchantId?: string): number {
  return getCart(merchantId).reduce((s,i)=> s + i.qty, 0);
}
