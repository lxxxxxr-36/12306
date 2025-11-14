import React from 'react';
import './results.css';
import { useLocation, useNavigate } from 'react-router-dom';
import { fetchTrains, decrementInventory } from '../services/trains';
import { isLoggedIn, getSession } from '../services/auth';
import { addOrder } from '../services/orders';
import type { Order } from '../types/order';
import type { Train, SearchQuery } from '../types/train'
import { popularCities } from '../constants/cities';


// 数据由服务层基于城市对动态生成

 function timeToMinutes(t: string) {
   // 'HH:mm' or 'HH:mm+1' (next day)
   const nextDay = t.includes('+1');
   const [hh, mm] = t.replace('+1', '').split(':').map(Number);
   return (hh * 60 + mm) + (nextDay ? 24 * 60 : 0);
 }
 function durationToMinutes(d: string) {
   // '4h30m'
   const hMatch = d.match(/(\d+)h/);
   const mMatch = d.match(/(\d+)m/);
   const h = hMatch ? Number(hMatch[1]) : 0;
   const m = mMatch ? Number(mMatch[1]) : 0;
   return h * 60 + m;
 }
 function lowestPrice(p: Train['price']) {
   return Math.min(...Object.values(p).map(v => v ?? Infinity));
 }
 function isHighSpeed(code: string) {
   return /^G|^D/.test(code);
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
 function pickSeatAndPrice(train: Train): { seatType: 'sw'|'ydz'|'edz'|'wz'; price: number } {
   const candidates: Array<{type:'sw'|'ydz'|'edz'|'wz'; avail:number; price:number|undefined}> = [
     { type:'sw', avail: train.types.sw ?? 0, price: train.price.sw },
     { type:'ydz', avail: train.types.ydz ?? 0, price: train.price.ydz },
     { type:'edz', avail: train.types.edz ?? 0, price: train.price.edz },
     { type:'wz', avail: train.types.wz ?? 0, price: train.price.wz },
   ];
   const available = candidates.filter(c => c.avail > 0);
   if (available.length === 0) return { seatType: 'wz', price: train.price.wz ?? 0 };
   // 选择价格最低的可用席别，若价格缺失则视为Infinity
   const best = available.sort((a,b)=> (a.price ?? Infinity) - (b.price ?? Infinity))[0];
   return { seatType: best.type, price: best.price ?? 0 };
 }
 // 新增：选择席别的默认逻辑（仅在商务/一等/二等中选择最低价且有票）
 function defaultSelectableSeat(train: Train): 'sw'|'ydz'|'edz' {
   const candidates: Array<'sw'|'ydz'|'edz'> = ['edz','ydz','sw'];
   const available = candidates
     .map(t => ({ t, avail: train.types[t] ?? 0, price: train.price[t] ?? Infinity }))
     .filter(x => x.avail > 0)
     .sort((a,b)=> a.price - b.price);
   return available.length ? available[0].t : 'edz';
 }

 // 工具：日期比较（严格晚于）
 function isDateAfterStrict(a: string, b: string) {
   if (!a || !b) return false;
   const da = new Date(a).getTime();
   const db = new Date(b).getTime();
   return da > db;
 }
 function todayLocalISO() {
   const d = new Date();
   d.setHours(0,0,0,0);
   const off = d.getTimezoneOffset()*60000;
   return new Date(d.getTime()-off).toISOString().split('T')[0];
 }
 const Results: React.FC = () => {
   const { search } = useLocation();
   const navigate = useNavigate();
   const params = new URLSearchParams(search);
   const origin = params.get('origin') || '';
   const dest = params.get('dest') || '';
   const date = params.get('date') || '';
   const hs = params.get('hs') === '1';
   const stu = params.get('stu') === '1';
   const ticketType = (params.get('ticketType') as ('oneway'|'roundtrip') | null) || 'oneway';
  const returnDate = params.get('returnDate') || '';
  const isValidRoundtripDate = React.useMemo(() => isDateAfterStrict(returnDate, date), [returnDate, date]);
  const isDepartValidToday = React.useMemo(() => !!date && date >= todayLocalISO(), [date]);
  const [sortBy, setSortBy] = React.useState<'depart'|'arrive'|'duration'|'price'>('depart');
   const [seatFilter, setSeatFilter] = React.useState<'all'|'sw'|'ydz'|'edz'|'wz'>('all');
   // 新增：记录每个车次的所选席别（商务/一等/二等）
   const [selectedSeats, setSelectedSeats] = React.useState<Record<string, 'sw'|'ydz'|'edz'>>({});
   // 新增：中转换乘
   const [showTransfer, setShowTransfer] = React.useState(false);
   const [transferOptions, setTransferOptions] = React.useState<Array<{ mid: string; a: Train; b: Train }>>([]);
   const [loadingTransfer, setLoadingTransfer] = React.useState(false);

   const [data, setData] = React.useState<Train[]>([]);
   React.useEffect(()=>{
     const q: SearchQuery = { origin, dest, date, hs, stu };
     fetchTrains(q).then(setData);
   }, [origin, dest, date, hs, stu]);

   // 计算中转换乘候选
   React.useEffect(() => {
     if (!showTransfer) { setTransferOptions([]); return; }
     let cancelled = false;
     async function calc() {
       setLoadingTransfer(true);
       const mids = popularCities.filter(c => c !== origin && c !== dest);
       const out: Array<{ mid: string; a: Train; b: Train }> = [];
       for (const mid of mids) {
         const leg1 = await fetchTrains({ origin, dest: mid, date, hs, stu });
         const leg2 = await fetchTrains({ origin: mid, dest, date, hs, stu });
         for (const t1 of leg1.slice(0,3)) {
           const t1Arr = timeToMinutes(t1.arrive);
           const candidates2 = leg2.filter(t2 => timeToMinutes(t2.depart) >= t1Arr + 30);
           if (candidates2.length) {
             out.push({ mid, a: t1, b: candidates2[0] });
             if (out.length >= 5) break;
           }
         }
         if (out.length >= 5) break;
       }
       if (!cancelled) {
         setTransferOptions(out);
         setLoadingTransfer(false);
       }
     }
     calc();
     return () => { cancelled = true; };
   }, [showTransfer, origin, dest, date, hs, stu]);

   const filtered = React.useMemo(() => {
     let dataSrc = [...data];
     if (hs) dataSrc = dataSrc.filter(d => isHighSpeed(d.code));
     if (seatFilter !== 'all') dataSrc = dataSrc.filter(d => (d.types[seatFilter] ?? 0) > 0);
     if (stu) dataSrc = dataSrc.sort((a, b) => (a.types.edz ?? 0) > (b.types.edz ?? 0) ? -1 : 1);
     return dataSrc;
   }, [data, hs, seatFilter, stu]);

   const sorted = React.useMemo(() => {
     return [...filtered].sort((a, b) => {
       switch (sortBy) {
         case 'depart': return timeToMinutes(a.depart) - timeToMinutes(b.depart);
         case 'arrive': return timeToMinutes(a.arrive) - timeToMinutes(b.arrive);
         case 'duration': return durationToMinutes(a.duration) - durationToMinutes(b.duration);
         case 'price': return lowestPrice(a.price) - lowestPrice(b.price);
       }
     });
   }, [filtered, sortBy]);


   // 新增：使用所选席别生成订单草稿
   const handleBookWithSeat = (train: Train, seatType: 'sw'|'ydz'|'edz') => {
     const totalAvail = (train.types.sw ?? 0) + (train.types.ydz ?? 0) + (train.types.edz ?? 0) + (train.types.wz ?? 0);
     if (totalAvail <= 0) {
       const qs = `origin=${encodeURIComponent(origin)}&dest=${encodeURIComponent(dest)}&date=${encodeURIComponent(date)}&train=${encodeURIComponent(train.code)}`;
       navigate(`/standby?${qs}`);
       return;
     }
     if (!isDepartValidToday) { alert('出发日期不能早于今天'); return; }
     const departMs = combineLocalDateTimeMs(date, train.depart);
     if (departMs - Date.now() < 30 * 60 * 1000) { alert('距发车不足30分钟，停止售票'); return; }
     if (!isLoggedIn()) {
       navigate('/login', { state: { from: '/results' } });
       return;
     }
     const session = getSession();
     const basePrice = train.price[seatType] ?? 0;
     const price = Math.round(basePrice * (stu ? 0.9 : 1));
     const order: Order = {
       id: 'O' + Date.now().toString(36) + Math.random().toString(36).slice(2,6),
       origin,
       dest,
       date,
       passengers: [{ name: session?.username || '乘客', idType: 'ID', idNo: '' }],
       item: { trainCode: train.code, seatType, price },
       status: 'pending',
       createdAt: Date.now(),
     };
     addOrder(order);
     // 扣减库存：所选席别余票 - 乘客人数
    decrementInventory(train.code, seatType as import('../types/train').SeatType, order.passengers.length);
     navigate(`/checkout/${order.id}`);
   };
// 新增：往返下单（生成两笔订单）
const handleBookRoundTrip = async (train: Train, seatType: 'sw'|'ydz'|'edz') => {
  if (ticketType !== 'roundtrip') { return; }
  if (!returnDate) { alert('请选择返程日期'); return; }
  if (!isDateAfterStrict(returnDate, date)) { alert('返程日期必须晚于出发日期'); return; }
  if (!isDepartValidToday) { alert('出发日期不能早于今天'); return; }
  const departMs = combineLocalDateTimeMs(date, train.depart);
  if (departMs - Date.now() < 30 * 60 * 1000) { alert('距发车不足30分钟，停止售票'); return; }
  if (!isLoggedIn()) { navigate('/login', { state: { from: '/results' } }); return; }
  const session = getSession();
  const groupId = 'G' + Date.now().toString(36) + Math.random().toString(36).slice(2,6);
  // 去程
  const priceGo = Math.round((train.price[seatType] ?? 0) * (stu ? 0.9 : 1));
  const orderGo: Order = {
    id: 'O' + Date.now().toString(36) + Math.random().toString(36).slice(2,6),
    origin,
    dest,
    date,
    passengers: [{ name: session?.username || '乘客', idType: 'ID', idNo: '' }],
    item: { trainCode: train.code, seatType, price: priceGo },
    status: 'pending',
    createdAt: Date.now(),
    groupId,
  };
  addOrder(orderGo);
  decrementInventory(train.code, seatType as import('../types/train').SeatType, orderGo.passengers.length);
  // 返程：选择首个有票的列车
  const retList = await fetchTrains({ origin: dest, dest: origin, date: returnDate, hs, stu });
  const retTrain = retList.find(rt => ((rt.types.sw??0)+(rt.types.ydz??0)+(rt.types.edz??0)+(rt.types.wz??0))>0);
  if (retTrain) {
    const picked = pickSeatAndPrice(retTrain);
    const orderBack: Order = {
      id: 'O' + Date.now().toString(36) + Math.random().toString(36).slice(2,6),
      origin: dest,
      dest: origin,
      date: returnDate,
      passengers: [{ name: session?.username || '乘客', idType: 'ID', idNo: '' }],
      item: { trainCode: retTrain.code, seatType: picked.seatType, price: Math.round((picked.price ?? 0) * (stu ? 0.9 : 1)) },
      status: 'pending',
      createdAt: Date.now(),
      groupId,
    };
    addOrder(orderBack);
    decrementInventory(retTrain.code, picked.seatType as import('../types/train').SeatType, orderBack.passengers.length);
  } else {
    alert('返程暂无合适车次，已为您保留去程订单');
  }
  navigate(`/checkout/${orderGo.id}`);
};
// 新增：联程（中转换乘）下单（两笔订单）
const handleBookTransfer = (opt: { mid: string; a: Train; b: Train }) => {
  if (!isDepartValidToday) { alert('出发日期不能早于今天'); return; }
  const departMs = combineLocalDateTimeMs(date, opt.a.depart);
  if (departMs - Date.now() < 30 * 60 * 1000) { alert('距发车不足30分钟，停止售票'); return; }
  if (!isLoggedIn()) { navigate('/login', { state: { from: '/results' } }); return; }
  const session = getSession();
  const groupId = 'G' + Date.now().toString(36) + Math.random().toString(36).slice(2,6);
  const pickA = pickSeatAndPrice(opt.a);
  const pickB = pickSeatAndPrice(opt.b);
  const orderA: Order = {
    id: 'O' + Date.now().toString(36) + Math.random().toString(36).slice(2,6),
    origin,
    dest: opt.mid,
    date,
    passengers: [{ name: session?.username || '乘客', idType: 'ID', idNo: '' }],
    item: { trainCode: opt.a.code, seatType: pickA.seatType, price: Math.round((pickA.price ?? 0) * (stu ? 0.9 : 1)) },
    status: 'pending',
    createdAt: Date.now(),
    groupId,
  };
  addOrder(orderA);
  decrementInventory(opt.a.code, pickA.seatType as import('../types/train').SeatType, orderA.passengers.length);
  const orderB: Order = {
    id: 'O' + Date.now().toString(36) + Math.random().toString(36).slice(2,6),
    origin: opt.mid,
    dest,
    date,
    passengers: [{ name: session?.username || '乘客', idType: 'ID', idNo: '' }],
    item: { trainCode: opt.b.code, seatType: pickB.seatType, price: Math.round((pickB.price ?? 0) * (stu ? 0.9 : 1)) },
    status: 'pending',
    createdAt: Date.now(),
    groupId,
  };
  addOrder(orderB);
  decrementInventory(opt.b.code, pickB.seatType as import('../types/train').SeatType, orderB.passengers.length);
  navigate(`/checkout/${orderA.id}`);
};

   return (
     <div className="results-page">
-      <div className="summary">{origin || '出发地'} → {dest || '目的地'} · {date || '出发日期'} {hs? '· 高铁动车':''} {stu? '· 学生':''}</div>
+      <div className="summary">{origin || '出发地'} → {dest || '目的地'} · {date || '出发日期'} {ticketType==='roundtrip' ? `· 往返${returnDate ? '（返程 '+returnDate+'）':''}` : ''} {hs? '· 高铁动车':''} {stu? '· 学生票九折':''}</div>
       <div className="filters">
         <label>席别：
           <select value={seatFilter} onChange={e=>setSeatFilter(e.target.value as ('all'|'sw'|'ydz'|'edz'|'wz'))}>
             <option value="all">全部</option>
             <option value="sw">商务座</option>
             <option value="ydz">一等座</option>
             <option value="edz">二等座</option>
             <option value="wz">无座</option>
           </select>
         </label>
         <label>排序：
           <select value={sortBy} onChange={e=>setSortBy(e.target.value as ('depart'|'arrive'|'duration'|'price'))}>
             <option value="depart">出发时间升序</option>
             <option value="arrive">到达时间升序</option>
             <option value="duration">历时升序</option>
             <option value="price">价格最低</option>
           </select>
         </label>
+        <label style={{marginLeft:12}}>
+          <input type="checkbox" checked={showTransfer} onChange={e=>setShowTransfer(e.target.checked)} /> 显示中转换乘
+        </label>
       </div>

       <table className="list">
         <thead>
           <tr>
             <th>车次</th><th>出发-到达</th><th>历时</th><th>商务座</th><th>一等座</th><th>二等座</th><th>无座</th><th>操作</th>
           </tr>
         </thead>
         <tbody>
           {sorted.map((r)=> (
             <tr key={r.code}>
               <td>{r.code}</td>
               <td>{r.depart} - {r.arrive}</td>
               <td>{r.duration}</td>
               <td>{r.types.sw ?? '--'}</td>
               <td>{r.types.ydz ?? '--'}</td>
               <td>{r.types.edz ?? '--'}</td>
               <td>{r.types.wz ?? '--'}</td>
               <td>{(((r.types.sw ?? 0)+(r.types.ydz ?? 0)+(r.types.edz ?? 0)+(r.types.wz ?? 0))<=0) ? (
                 <button className="primary" onClick={() => { const qs = `origin=${encodeURIComponent(origin)}&dest=${encodeURIComponent(dest)}&date=${encodeURIComponent(date)}&train=${encodeURIComponent(r.code)}`; navigate(`/standby?${qs}`); }}>候补</button>
               ) : (
                 (() => {
                   const selected = selectedSeats[r.code] ?? defaultSelectableSeat(r);
                   const setSelected = (val: 'sw'|'ydz'|'edz') => setSelectedSeats(prev => ({ ...prev, [r.code]: val }));
                   const swLabel = `商务座${r.price.sw? ' ￥'+Math.round(r.price.sw * (stu ? 0.9 : 1)):''}（余票${r.types.sw ?? 0}）`;
                   const ydzLabel = `一等座${r.price.ydz? ' ￥'+Math.round(r.price.ydz * (stu ? 0.9 : 1)):''}（余票${r.types.ydz ?? 0}）`;
                   const edzLabel = `二等座${r.price.edz? ' ￥'+Math.round(r.price.edz * (stu ? 0.9 : 1)):''}（余票${r.types.edz ?? 0}）`;
                   const selectedAvail = (r.types[selected] ?? 0);
                   return (
                     <span style={{display:'inline-flex', gap:8, alignItems:'center'}}>
                       <select value={selected} onChange={e => setSelected(e.target.value as 'sw'|'ydz'|'edz')}>
                         <option value="sw" disabled={(r.types.sw ?? 0) <= 0}>{swLabel}</option>
                         <option value="ydz" disabled={(r.types.ydz ?? 0) <= 0}>{ydzLabel}</option>
                         <option value="edz" disabled={(r.types.edz ?? 0) <= 0}>{edzLabel}</option>
                       </select>
                       {(() => { const isSaleCutoff = (combineLocalDateTimeMs(date, r.depart) - Date.now() < 30*60*1000);
                         return (
                           <>
                             <button className="primary" disabled={selectedAvail <= 0 || !isDepartValidToday || isSaleCutoff} title={isSaleCutoff ? '距发车不足30分钟，已截止售票' : undefined} onClick={() => handleBookWithSeat(r, selected)}>{isSaleCutoff ? '已截止' : '预订'}</button>
                             {ticketType === 'roundtrip' && (
                               <button className="secondary" disabled={selectedAvail <= 0 || !returnDate || !isValidRoundtripDate || !isDepartValidToday || isSaleCutoff} title={isSaleCutoff ? '距发车不足30分钟，已截止售票' : undefined} onClick={() => handleBookRoundTrip(r, selected)}>{isSaleCutoff ? '已截止' : '预订往返'}</button>
                             )}
                           </>
                         );
                       })()}
                     </span>
                   );
                 })()
               )}</td>
             </tr>
           ))}
           </tbody>
         </table>
         <div className="hint">演示数据，仅用于界面展示。无票时会在此处显示候补入口。</div>
      {showTransfer && (
        <div style={{marginTop:24}}>
          <h3 style={{margin:'8px 0'}}>中转换乘候选</h3>
          {loadingTransfer ? (
            <div>正在计算联程方案...</div>
          ) : transferOptions.length === 0 ? (
            <div>暂无合适的中转换乘方案</div>
          ) : (
            <table className="list">
              <thead>
                <tr>
                  <th>去程车次</th><th>中转站</th><th>返程车次</th><th>操作</th>
                </tr>
              </thead>
              <tbody>
                {transferOptions.map((opt, idx) => (
                  <tr key={idx}>
                    <td>{opt.a.code} · {origin}→{opt.mid} · {opt.a.depart}-{opt.a.arrive}</td>
                    <td>{opt.mid}</td>
                    <td>{opt.b.code} · {opt.mid}→{dest} · {opt.b.depart}-{opt.b.arrive}</td>
                    <td>
                      <button className="primary" onClick={() => handleBookTransfer(opt)}>预订联程</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
     </div>
   );
 }

 export default Results;